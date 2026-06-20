from fastapi import FastAPI
from pydantic import BaseModel

from services.opentargets import (
    search_disease,
    get_targets
)

app = FastAPI()


class DiseaseRequest(BaseModel):
    disease: str


@app.post("/analyze")
def analyze(data: DiseaseRequest):

    disease_result = search_disease(data.disease)

    hits = disease_result["data"]["search"]["hits"]

    disease_hit = None

    for hit in hits:
        if hit["entity"] == "disease":
            disease_hit = hit
            break

    disease_id = disease_hit["id"]

    target_result = get_targets(disease_id)

    rows = target_result["data"]["disease"]["associatedTargets"]["rows"]

    targets = []

    for row in rows:
        targets.append({
            "gene": row["target"]["approvedSymbol"],
            "score": row["score"],
            "modality": "Small Molecule",
            "resource": "Open Targets"
        })

    return {
        "targets": targets
    }