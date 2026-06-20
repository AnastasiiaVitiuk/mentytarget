# MentyTarget — AI Target Identification Backend

FastAPI service that powers the MentyTarget pipeline:

```
disease name -> OpenTargets public data (+ optional proprietary CSV)
  -> preprocess -> evidence extraction -> LightGBM ranking model
  -> SHAP explanations -> dashboard JSON -> downloadable PDF report
```

## ML approach

- **Model:** LightGBM **learning-to-rank** (`lambdarank`, optimizes NDCG). Best fit
  for heterogeneous tabular evidence features, native missing-value handling, and
  strong interpretability.
- **Labels:** weak supervision from OpenTargets itself (targets with an approved/
  clinical drug or strong genetic association are positives). No manual labeling.
- **Explanations:** SHAP attributions per target → the "why this target ranks here"
  text shown on the dashboard.
- **Fallback:** if no model is trained yet, a transparent weighted-sum ranker is used,
  so the API works out of the box.

## Run locally

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for interactive Swagger docs.

## Train the model (optional but recommended)

```bash
# Pass several disease ids so the ranker learns across diseases
python -m app.model.train --diseases EFO_0000249 EFO_0000349 MONDO_0004975
```

This writes `models/ranker.joblib`, which the API auto-loads on next start.

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/resolve-disease?q=Alzheimer` | name → EFO/MONDO id |
| POST | `/score-targets` | full pipeline → ranked targets |
| POST | `/score-targets-with-file` | same, with proprietary CSV upload |
| POST | `/report` | download ranking as PDF |

### Example request

```bash
curl -X POST http://localhost:8000/score-targets \
  -H "Content-Type: application/json" \
  -d '{"disease":"Alzheimer disease","modality":"small_molecule","top_k":25}'
```

### Proprietary data upload

CSV with columns `ensembl_gene_id,score` (score in 0..1):

```bash
curl -X POST http://localhost:8000/score-targets-with-file \
  -F "disease=Alzheimer disease" \
  -F "modality=small_molecule" \
  -F "proprietary_csv=@my_patient_signal.csv"
```

## Connecting your Next.js frontend

```ts
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/score-targets`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ disease, modality, top_k: 25 }),
})
const data = await res.json() // { targets: [...] } -> feed into your dashboard
```
