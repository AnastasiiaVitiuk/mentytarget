"""Explanation generation.

Produces per-target feature attributions (SHAP when a LightGBM model is loaded,
otherwise the transparent weighted contributions) plus a human-readable sentence
for the dashboard.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.model.ranker import _FALLBACK_WEIGHTS, ranker
from app.pipeline.features import FEATURE_COLUMNS

_PRETTY = {
    "overall_association": "overall disease association",
    "genetic_association": "human genetic evidence",
    "somatic_mutation": "somatic mutation evidence",
    "known_drug": "existing drug/clinical precedent",
    "affected_pathway": "pathway involvement",
    "literature": "literature support",
    "rna_expression": "differential expression",
    "animal_model": "animal model evidence",
    "tractability": "druggability for this modality",
    "n_evidence_types": "breadth of evidence",
    "proprietary_score": "your proprietary data signal",
}


def _shap_matrix(df: pd.DataFrame) -> np.ndarray:
    """Return signed contribution matrix [n_targets, n_features]."""
    X = df[FEATURE_COLUMNS].to_numpy(dtype=float)
    if ranker.kind == "lightgbm" and ranker._model is not None:
        try:
            import shap

            explainer = shap.TreeExplainer(ranker._model)
            vals = explainer.shap_values(X)
            return np.asarray(vals, dtype=float)
        except Exception:
            pass  # fall through to weighted contributions
    # Fallback: contribution = feature_value * weight
    w = np.array([_FALLBACK_WEIGHTS.get(c, 0.0) for c in FEATURE_COLUMNS])
    return X * w


def explain_frame(df: pd.DataFrame, top_n: int = 3) -> list[dict]:
    """Return [{explanation, top_contributions:[{feature,value,contribution}]}]."""
    if df.empty:
        return []
    contrib = _shap_matrix(df)
    out: list[dict] = []

    for i in range(len(df)):
        row_contrib = contrib[i]
        order = np.argsort(np.abs(row_contrib))[::-1][:top_n]
        tops = [
            {
                "feature": FEATURE_COLUMNS[j],
                "value": float(df.iloc[i][FEATURE_COLUMNS[j]]),
                "contribution": float(row_contrib[j]),
            }
            for j in order
            if abs(row_contrib[j]) > 1e-9
        ]
        drivers = [_PRETTY.get(t["feature"], t["feature"]) for t in tops]
        symbol = df.iloc[i].get("symbol", df.iloc[i].get("target_id", "target"))
        if drivers:
            text = f"{symbol} ranks highly mainly due to {', '.join(drivers)}."
        else:
            text = f"{symbol} has limited supporting evidence for this disease."
        out.append({"explanation": text, "top_contributions": tops})
    return out
