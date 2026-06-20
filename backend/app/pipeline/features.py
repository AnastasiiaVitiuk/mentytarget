"""Preprocessing + evidence extraction + feature engineering.

Turns raw OpenTargets association rows into a clean feature matrix that the
ranking model consumes. This is the "Preprocessing -> Evidence extraction"
stage of the MentyTarget pipeline.
"""
from __future__ import annotations

import pandas as pd

from app.schemas import Modality

# The evidence datatypes OpenTargets reports. Each becomes a model feature.
DATATYPES: list[str] = [
    "genetic_association",
    "somatic_mutation",
    "known_drug",
    "affected_pathway",
    "literature",
    "rna_expression",
    "animal_model",
]

# Map our API modality -> OpenTargets tractability "modality" codes.
MODALITY_MAP: dict[str, str] = {
    Modality.small_molecule.value: "SM",
    Modality.antibody.value: "AB",
    Modality.protac.value: "PR",
    Modality.other.value: "OC",
}

# Final ordered feature list used everywhere (training + inference + SHAP).
FEATURE_COLUMNS: list[str] = [
    "overall_association",
    *DATATYPES,
    "tractability",
    "n_evidence_types",
    "proprietary_score",
]


def _tractability_score(tractability: list[dict] | None, modality: str) -> float:
    """Collapse OpenTargets tractability buckets into a 0..1 druggability score
    for the requested modality. More 'positive' buckets => higher score."""
    if not tractability:
        return 0.0
    target_code = MODALITY_MAP.get(modality, "SM")
    hits = [t for t in tractability if t.get("modality") == target_code and t.get("value")]
    if not hits:
        return 0.0
    # OpenTargets exposes several ordered buckets; presence of any approved/clinical
    # bucket is the strongest signal. We approximate with a normalized count.
    strong = sum(
        1
        for t in hits
        if any(k in (t.get("label") or "").lower() for k in ("approved", "clinical", "advanced"))
    )
    return min(1.0, 0.4 * len(hits) / 5.0 + 0.6 * min(strong, 1))


def build_feature_frame(
    disease: dict,
    modality: str,
    proprietary_scores: dict[str, float] | None = None,
) -> pd.DataFrame:
    """Convert raw OpenTargets disease payload into a per-target feature frame."""
    proprietary_scores = proprietary_scores or {}
    rows: list[dict] = []

    for row in disease["associatedTargets"]["rows"]:
        target = row["target"]
        dt_scores = {d["id"]: d["score"] for d in row.get("datatypeScores", [])}

        record: dict[str, object] = {
            "target_id": target["id"],
            "symbol": target.get("approvedSymbol") or target["id"],
            "name": target.get("approvedName") or "",
            "overall_association": float(row.get("score") or 0.0),
            "tractability": _tractability_score(target.get("tractability"), modality),
            "proprietary_score": float(proprietary_scores.get(target["id"], 0.0)),
        }
        for dt in DATATYPES:
            record[dt] = float(dt_scores.get(dt, 0.0))
        record["n_evidence_types"] = sum(1 for dt in DATATYPES if record[dt] > 0)

        rows.append(record)

    df = pd.DataFrame(rows)
    if df.empty:
        df = pd.DataFrame(columns=["target_id", "symbol", "name", *FEATURE_COLUMNS])
    # Ensure every expected feature column exists and is numeric.
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            df[col] = 0.0
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    return df
