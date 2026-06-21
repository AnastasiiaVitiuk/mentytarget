/**
 * Backend API connection layer.
 *
 * All calls to the FastAPI backend (backend/app/main.py) go through here.
 * Set NEXT_PUBLIC_API_URL in .env.local (defaults to localhost:8000 for dev).
 */

import { searchDisease, type DiseaseResult, type Resource } from "./targets-data"
import { fetchAssociatedTargets } from "./opentargets"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/** Forces the bundled demo dataset regardless of backend availability. */
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

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

const RESOURCE_TO_DATATYPE: Record<Resource, string> = {
  GWAS: "genetic_association",
  Transcriptomics: "rna_expression",
  Literature: "literature",
}

/**
 * Builds a ScoreResponse from the bundled sample dataset so the app is fully
 * navigable without the FastAPI backend (e.g. on a static Vercel deployment).
 * The interactive 3D viewer and suggested-drugs panels still call the live
 * UniProt / AlphaFold / Open Targets APIs — only the ranking step is mocked.
 */
export function buildDemoResponse(
  query: string,
  modality: Modality,
): ScoreResponse {
  const data: DiseaseResult = searchDisease(query)

  const targets: RankedTarget[] = data.targets.map((t, i) => ({
    rank: i + 1,
    // Not an Ensembl id; Open Targets resolves the real id from the symbol.
    target_id: `DEMO_${t.symbol}`,
    symbol: t.symbol,
    name: t.name,
    score: t.score,
    overall_association: Number(Math.min(1, t.score + 0.02).toFixed(2)),
    tractability: Number((0.4 + t.score * 0.5).toFixed(2)),
    evidence: [{ datatype: RESOURCE_TO_DATATYPE[t.resource], score: t.score }],
    explanation: `${t.symbol} is prioritized for ${data.disease} based on ${t.resource} evidence with an association score of ${t.score.toFixed(2)}.`,
    top_contributions: [
      {
        feature: RESOURCE_TO_DATATYPE[t.resource],
        value: t.score,
        contribution: Number((t.score * 0.6).toFixed(2)),
      },
    ],
    literature: [],
  }))

  return {
    disease_query: query,
    disease_id: "DEMO",
    disease_label: data.disease,
    modality,
    model: "demo-fallback",
    targets,
  }
}

/** Human-readable labels for Open Targets datatype evidence ids. */
const DATATYPE_LABELS: Record<string, string> = {
  genetic_association: "Genetic association",
  somatic_mutation: "Somatic mutation",
  known_drug: "Known drug",
  affected_pathway: "Affected pathway",
  literature: "Literature",
  rna_expression: "RNA expression",
  animal_model: "Animal model",
}

/**
 * Builds a ScoreResponse from live Open Targets disease→target associations.
 * This is the default ranking source: it needs no backend, returns the full
 * set of associated targets, and carries real evidence + tractability so the
 * results are genuine raw data rather than the bundled demo dataset.
 */
async function buildLiveResponse(
  query: string,
  modality: Modality,
  topK: number,
): Promise<ScoreResponse> {
  const { efoId, diseaseLabel, targets: assoc } = await fetchAssociatedTargets(
    query,
    modality,
    topK,
  )
  if (assoc.length === 0) throw new Error("No associated targets")

  const targets: RankedTarget[] = assoc.map((t) => {
    const sorted = [...t.datatypeScores].sort((a, b) => b.score - a.score)
    const top = sorted.slice(0, 3)
    const topLabel = top[0]
      ? (DATATYPE_LABELS[top[0].id] ?? top[0].id).toLowerCase()
      : "association evidence"
    // Blend association strength with modality tractability for the final score.
    const score = Number((t.score * 0.8 + t.tractabilityScore * 0.2).toFixed(3))
    return {
      rank: 0,
      target_id: t.ensemblId,
      symbol: t.symbol,
      name: t.name,
      score,
      overall_association: Number(t.score.toFixed(3)),
      tractability: t.tractabilityScore,
      evidence: sorted.map((d) => ({
        datatype: d.id,
        score: Number(d.score.toFixed(3)),
      })),
      explanation: `${t.symbol} is associated with ${diseaseLabel} (overall association ${t.score.toFixed(
        2,
      )}), driven primarily by ${topLabel} evidence. Tractability for the selected modality scores ${t.tractabilityScore.toFixed(
        2,
      )}.`,
      top_contributions: top.map((d) => ({
        feature: DATATYPE_LABELS[d.id] ?? d.id,
        value: Number(d.score.toFixed(3)),
        contribution: Number((d.score * t.score).toFixed(3)),
      })),
      literature: [],
    }
  })

  targets.sort((a, b) => b.score - a.score)
  targets.forEach((t, i) => {
    t.rank = i + 1
  })

  return {
    disease_query: query,
    disease_id: efoId,
    disease_label: diseaseLabel,
    modality,
    model: "opentargets-live",
    targets,
  }
}

export async function runAnalysisRequest(
  disease: string,
  modality: Modality,
  file: File | null,
  topK = 100,
): Promise<ScoreResponse> {
  if (DEMO_MODE) return buildDemoResponse(disease, modality)

  // When proprietary data is supplied, prefer the FastAPI backend (the only
  // path that can score a custom CSV). If it's unreachable, fall through to
  // the live Open Targets ranking so results still render.
  if (file) {
    try {
      return await scoreTargetsWithFile(disease, modality, file, topK)
    } catch (err) {
      if (err instanceof ApiError) throw err
    }
  }

  // Default path: live Open Targets associations — real data, no backend.
  try {
    return await buildLiveResponse(disease, modality, topK)
  } catch {
    // Absolute last resort so the UI is never empty.
    return buildDemoResponse(disease, modality)
  }
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
