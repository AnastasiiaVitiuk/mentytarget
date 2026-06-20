"""MentyTarget FastAPI service.

Pipeline endpoints:
  GET  /health
  GET  /resolve-disease?q=...           -> disease name -> EFO/MONDO id
  POST /score-targets                   -> full pipeline -> ranked dashboard data
  POST /report                          -> downloadable PDF of a ranking
"""
from __future__ import annotations

import csv
import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.data.opentargets import (
    fetch_associated_targets,
    fetch_literature_for_targets,
    resolve_disease,
)
from app.model.explain import explain_frame
from app.model.ranker import ranker
from app.pipeline.features import build_feature_frame
from app.reports.generate import build_pdf
from app.schemas import (
    DiseaseHit,
    EvidenceItem,
    FeatureContribution,
    LiteratureEvidence,
    Modality,
    RankedTarget,
    ReportRequest,
    ResolveResponse,
    ScoreRequest,
    ScoreResponse,
)
from app.pipeline.features import DATATYPES

# How many top-ranked targets to fetch literature evidence for.
# Kept small because each one is an extra OpenTargets API call.
LITERATURE_TOP_N = 5
LITERATURE_PER_TARGET = 3


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[MentyTarget] ranker loaded: kind={ranker.kind}")
    yield


app = FastAPI(title="MentyTarget API", version="1.0.0", lifespan=lifespan)

# Allow your Next.js frontend to call the API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "model": ranker.kind}


@app.get("/resolve-disease", response_model=ResolveResponse)
async def resolve(q: str) -> ResolveResponse:
    try:
        hits = await resolve_disease(q)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"OpenTargets error: {exc}") from exc
    return ResolveResponse(query=q, hits=[DiseaseHit(**h) for h in hits])


async def _run_pipeline(req: ScoreRequest) -> ScoreResponse:
    # 1. Resolve disease name -> id
    hits = await resolve_disease(req.disease)
    if not hits:
        raise HTTPException(status_code=404, detail=f"No disease match for '{req.disease}'")
    disease_id = hits[0]["id"]

    # 2. Collect public data from OpenTargets
    disease = await fetch_associated_targets(disease_id)

    # 3. Preprocess + 4. evidence extraction + feature engineering
    df = build_feature_frame(disease, req.modality.value, req.proprietary_scores)
    if df.empty:
        raise HTTPException(status_code=404, detail="No associated targets found.")

    # 5. AI model for target prediction / ranking
    df = df.copy()
    df["__score"] = ranker.predict(df)
    df = df.sort_values("__score", ascending=False).reset_index(drop=True)
    df = df.head(req.top_k).reset_index(drop=True)

    # 6. Explanation generation
    explanations = explain_frame(df)

    # 6b. Literature evidence for the top-N targets only (extra API calls, kept small)
    top_pairs = [
        (df.iloc[i]["target_id"], disease_id) for i in range(min(LITERATURE_TOP_N, len(df)))
    ]
    literature_by_target: dict[str, list[dict]] = {}
    if top_pairs:
        try:
            literature_by_target = await fetch_literature_for_targets(
                top_pairs, size=LITERATURE_PER_TARGET
            )
        except Exception:
            # Literature is a nice-to-have; never fail the whole request for it.
            literature_by_target = {}

    # 7. Assemble dashboard payload
    targets: list[RankedTarget] = []
    for i, row in df.iterrows():
        evidence = [
            EvidenceItem(datatype=dt, score=float(row[dt])) for dt in DATATYPES if row[dt] > 0
        ]
        exp = explanations[i]
        lit_rows = literature_by_target.get(row["target_id"], [])
        targets.append(
            RankedTarget(
                rank=i + 1,
                target_id=row["target_id"],
                symbol=row["symbol"],
                name=row["name"],
                score=float(row["__score"]),
                overall_association=float(row["overall_association"]),
                tractability=float(row["tractability"]),
                evidence=evidence,
                explanation=exp["explanation"],
                top_contributions=[FeatureContribution(**c) for c in exp["top_contributions"]],
                literature=[LiteratureEvidence(**lr) for lr in lit_rows],
            )
        )

    return ScoreResponse(
        disease_query=req.disease,
        disease_id=disease["id"],
        disease_label=disease["name"],
        modality=req.modality,
        model=ranker.kind,
        targets=targets,
    )


@app.post("/score-targets", response_model=ScoreResponse)
async def score_targets(req: ScoreRequest) -> ScoreResponse:
    return await _run_pipeline(req)


@app.post("/score-targets-with-file", response_model=ScoreResponse)
async def score_targets_with_file(
    disease: str = Form(...),
    modality: Modality = Form(Modality.small_molecule),
    top_k: int = Form(25),
    proprietary_csv: UploadFile | None = File(default=None),
) -> ScoreResponse:
    """Same pipeline, but lets a company upload a proprietary CSV
    (columns: ensembl_gene_id,score) from their own patient/experimental data."""
    proprietary: dict[str, float] = {}
    if proprietary_csv is not None:
        raw = (await proprietary_csv.read()).decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(raw))
        for line in reader:
            gene = (line.get("ensembl_gene_id") or "").strip()
            try:
                val = float(line.get("score", ""))
            except (TypeError, ValueError):
                continue
            if gene:
                proprietary[gene] = val

    req = ScoreRequest(
        disease=disease, modality=modality, top_k=top_k, proprietary_scores=proprietary or None
    )
    return await _run_pipeline(req)


@app.post("/report")
async def report(req: ReportRequest) -> StreamingResponse:
    pdf = build_pdf(req.disease_label, req.modality.value, req.targets)
    filename = f"mentytarget_{req.disease_label.replace(' ', '_')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )