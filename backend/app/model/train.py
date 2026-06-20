"""Train the LightGBM learning-to-rank model with weak supervision.

Labels come from OpenTargets itself (no hand labeling needed):
  - A target is a POSITIVE for a disease if it has strong `known_drug` evidence
    (an approved/clinical drug already targets it for that disease) OR very strong
    genetic association -> these are validated/credible targets.
  - Weakly associated targets are negatives.

This is a relevance label in [0, 1, 2, 3] suitable for lambdarank/NDCG.

Run:
    python -m app.model.train --diseases EFO_0000249 EFO_0000349 MONDO_0004975
"""
from __future__ import annotations

import argparse
import asyncio

import lightgbm as lgb
import numpy as np
import pandas as pd

from app.config import settings
from app.data.opentargets import fetch_associated_targets
from app.pipeline.features import FEATURE_COLUMNS, build_feature_frame


def _make_labels(df: pd.DataFrame) -> np.ndarray:
    """Derive graded relevance labels (0..3) via weak supervision."""
    labels = np.zeros(len(df), dtype=int)
    labels[df["overall_association"] >= 0.30] = 1
    labels[(df["genetic_association"] >= 0.50) | (df["overall_association"] >= 0.50)] = 2
    labels[df["known_drug"] >= 0.50] = 3  # validated: a drug already targets it
    return labels


async def _collect(disease_ids: list[str], modality: str) -> tuple[pd.DataFrame, list[int]]:
    frames: list[pd.DataFrame] = []
    group_sizes: list[int] = []
    for efo in disease_ids:
        disease = await fetch_associated_targets(efo, size=settings.max_candidates)
        df = build_feature_frame(disease, modality)
        if df.empty:
            continue
        df["__label"] = _make_labels(df)
        frames.append(df)
        group_sizes.append(len(df))  # one query group per disease (required by lambdarank)
    if not frames:
        raise SystemExit("No training data collected.")
    return pd.concat(frames, ignore_index=True), group_sizes


def train(disease_ids: list[str], modality: str = "small_molecule") -> None:
    data, groups = asyncio.run(_collect(disease_ids, modality))
    X = data[FEATURE_COLUMNS].to_numpy(dtype=float)
    y = data["__label"].to_numpy(dtype=int)

    model = lgb.LGBMRanker(
        objective="lambdarank",
        metric="ndcg",
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=31,
        min_child_samples=10,
        random_state=42,
    )
    model.fit(X, y, group=groups)

    settings.model_path.parent.mkdir(parents=True, exist_ok=True)
    import joblib

    joblib.dump(model, settings.model_path)
    print(f"Saved model -> {settings.model_path}")
    importances = sorted(
        zip(FEATURE_COLUMNS, model.feature_importances_), key=lambda x: -x[1]
    )
    print("Feature importances:")
    for name, imp in importances:
        print(f"  {name:24s} {imp}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--diseases", nargs="+", required=True, help="EFO/MONDO ids")
    parser.add_argument("--modality", default="small_molecule")
    args = parser.parse_args()
    train(args.diseases, args.modality)
