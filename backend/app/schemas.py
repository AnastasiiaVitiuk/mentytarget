"""Pydantic request/response models shared across the API."""
from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class Modality(str, Enum):
    """Drug modality the company intends to pursue.

    Maps to OpenTargets tractability modality buckets.
    """

    small_molecule = "small_molecule"
    antibody = "antibody"
    protac = "protac"
    other = "other"


class ScoreRequest(BaseModel):
    disease: str = Field(..., description="Disease name, e.g. 'Alzheimer disease'")
    modality: Modality = Modality.small_molecule
    top_k: int = Field(25, ge=1, le=200, description="How many ranked targets to return")
    # Optional proprietary signal: { ensembl_gene_id: score_between_0_and_1 }
    proprietary_scores: dict[str, float] | None = Field(
        default=None,
        description="Optional per-target signal from the company's own patient/experimental data.",
    )


class EvidenceItem(BaseModel):
    datatype: str
    score: float


class FeatureContribution(BaseModel):
    feature: str
    value: float
    contribution: float  # SHAP value (signed)


class LiteratureEvidence(BaseModel):
    pubmed_id: str | None = None
    score: float | None = None
    year: int | None = None


class RankedTarget(BaseModel):
    rank: int
    target_id: str  # Ensembl gene id
    symbol: str
    name: str
    score: float  # final ranking score 0..1
    overall_association: float
    tractability: float
    evidence: list[EvidenceItem]
    explanation: str
    top_contributions: list[FeatureContribution]
    literature: list[LiteratureEvidence] = Field(default_factory=list)


class ScoreResponse(BaseModel):
    disease_query: str
    disease_id: str
    disease_label: str
    modality: Modality
    model: str  # "lightgbm" | "weighted_fallback"
    targets: list[RankedTarget]


class DiseaseHit(BaseModel):
    id: str
    name: str


class ResolveResponse(BaseModel):
    query: str
    hits: list[DiseaseHit]


class ReportRequest(BaseModel):
    disease_label: str
    modality: Modality
    targets: list[dict[str, Any]]