/**
 * Backend API connection layer.
 *
 * All calls to the FastAPI backend (backend/app/main.py) go through here.
 * Set NEXT_PUBLIC_API_URL in .env.local (defaults to localhost:8000 for dev).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export type Modality = "small_molecule" | "antibody" | "protac" | "other"

export interface EvidenceItem {
  datatype: string
  score: number
}

export interface FeatureContribution {
  feature: string
  value: number
  contribution: number
}

export interface LiteratureEvidence {
  pubmed_id: string | null
  score: number | null
  year: number | null
}

export interface RankedTarget {
  rank: number
  target_id: string
  symbol: string
  name: string
  score: number
  overall_association: number
  tractability: number
  evidence: EvidenceItem[]
  explanation: string
  top_contributions: FeatureContribution[]
  literature: LiteratureEvidence[]
}

export interface ScoreResponse {
  disease_query: string
  disease_id: string
  disease_label: string
  modality: Modality
  model: string
  targets: RankedTarget[]
}

export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json()
    return body?.detail ?? res.statusText
  } catch {
    return res.statusText
  }
}

export async function scoreTargets(
  disease: string,
  modality: Modality = "small_molecule",
  topK = 25,
): Promise<ScoreResponse> {
  const res = await fetch(`${API_BASE_URL}/score-targets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disease, modality, top_k: topK }),
  })
  if (!res.ok) throw new ApiError(await parseErrorDetail(res), res.status)
  return res.json()
}

export async function scoreTargetsWithFile(
  disease: string,
  modality: Modality,
  file: File,
  topK = 25,
): Promise<ScoreResponse> {
  const formData = new FormData()
  formData.append("disease", disease)
  formData.append("modality", modality)
  formData.append("top_k", String(topK))
  formData.append("proprietary_csv", file)

  const res = await fetch(`${API_BASE_URL}/score-targets-with-file`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new ApiError(await parseErrorDetail(res), res.status)
  return res.json()
}

export async function runAnalysisRequest(
  disease: string,
  modality: Modality,
  file: File | null,
  topK = 25,
): Promise<ScoreResponse> {
  if (file) return scoreTargetsWithFile(disease, modality, file, topK)
  return scoreTargets(disease, modality, topK)
}

export async function downloadReportPdf(
  diseaseLabel: string,
  modality: Modality,
  targets: RankedTarget[],
): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ disease_label: diseaseLabel, modality, targets }),
  })
  if (!res.ok) throw new ApiError(await parseErrorDetail(res), res.status)
  return res.blob()
}
