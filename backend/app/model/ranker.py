"""The AI model for target prediction / ranking.

Primary model: LightGBM learning-to-rank (lambdarank, optimizes NDCG).
Fallback: a transparent weighted sum of evidence features, so the API always
returns a sensible ranking even before a model has been trained.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.config import settings
from app.pipeline.features import FEATURE_COLUMNS

# Weights for the transparent fallback ranker. These encode domain priors:
# genetic + known-drug evidence and tractability matter most for a good target.
_FALLBACK_WEIGHTS: dict[str, float] = {
    "overall_association": 0.30,
    "genetic_association": 0.18,
    "known_drug": 0.12,
    "affected_pathway": 0.06,
    "somatic_mutation": 0.05,
    "animal_model": 0.04,
    "literature": 0.03,
    "rna_expression": 0.02,
    "tractability": 0.12,
    "n_evidence_types": 0.03,
    "proprietary_score": 0.05,
}


class TargetRanker:
    """Loads a trained LightGBM model if present; otherwise uses the fallback."""

    def __init__(self) -> None:
        self._model = None
        self.kind = "weighted_fallback"
        self._try_load()

    def _try_load(self) -> None:
        if settings.model_path.exists():
            import joblib

            self._model = joblib.load(settings.model_path)
            self.kind = "lightgbm"

    def _normalize(self, raw: np.ndarray) -> np.ndarray:
        """Min-max normalize scores to 0..1 for display."""
        if raw.size == 0:
            return raw
        lo, hi = float(raw.min()), float(raw.max())
        if hi - lo < 1e-9:
            return np.clip(raw, 0.0, 1.0)
        return (raw - lo) / (hi - lo)

    def predict(self, df: pd.DataFrame) -> np.ndarray:
        """Return a ranking score per row (higher = better target)."""
        if df.empty:
            return np.array([])
        X = df[FEATURE_COLUMNS].to_numpy(dtype=float)

        if self._model is not None:
            raw = self._model.predict(X)
        else:
            w = np.array([_FALLBACK_WEIGHTS.get(c, 0.0) for c in FEATURE_COLUMNS])
            # n_evidence_types is on a 0..7 scale; squash it before weighting.
            X_adj = X.copy()
            idx = FEATURE_COLUMNS.index("n_evidence_types")
            X_adj[:, idx] = X_adj[:, idx] / len(FEATURE_COLUMNS)
            raw = X_adj @ w

        return self._normalize(np.asarray(raw, dtype=float))


# Singleton used by the API layer.
ranker = TargetRanker()
