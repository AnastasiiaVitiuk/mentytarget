/**
 * Open Targets Platform GraphQL client (public, CORS-enabled).
 * Fetches clinically tested / approved drugs for a target and drug detail.
 *
 * https://api.platform.opentargets.org/api/v4/graphql
 *
 * NOTE: the schema uses string clinical-stage enums (e.g. "APPROVAL",
 * "PHASE_3") rather than numeric phases.
 */

const OT_ENDPOINT = "https://api.platform.opentargets.org/api/v4/graphql"

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(OT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`Open Targets request failed (${res.status})`)
  }
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "Open Targets query error")
  }
  return json.data as T
}

/** Maps an Open Targets clinical-stage enum to a 0-5 rank for sorting. */
export function stageRank(stage: string | null): number {
  switch (stage) {
    case "APPROVAL":
      return 5
    case "PHASE_4":
      return 4.5
    case "PHASE_3":
      return 4
    case "PHASE_2":
      return 3
    case "PHASE_1":
      return 2
    case "EARLY_PHASE_1":
      return 1
    case "PRECLINICAL":
      return 0.5
    default:
      return 0
  }
}

/** Human-readable label for a clinical-stage enum. */
export function stageLabel(stage: string | null): string {
  switch (stage) {
    case "APPROVAL":
      return "Approved"
    case "PHASE_4":
      return "Phase IV"
    case "PHASE_3":
      return "Phase III"
    case "PHASE_2":
      return "Phase II"
    case "PHASE_1":
      return "Phase I"
    case "EARLY_PHASE_1":
      return "Early Phase I"
    case "PRECLINICAL":
      return "Preclinical"
    default:
      return "Unknown"
  }
}

export interface KnownDrug {
  drugId: string
  prefName: string
  drugType: string | null
  mechanismOfAction: string | null
  stage: string | null
  diseaseName: string | null
}

/** Resolves a gene symbol to an Ensembl gene id (Open Targets target id). */
async function resolveEnsemblId(symbol: string, targetId?: string): Promise<string> {
  if (targetId && /^ENSG\d+/.test(targetId)) return targetId

  const data = await gql<{
    search: { hits: { id: string; entity: string }[] }
  }>(
    `query Resolve($q: String!) {
      search(queryString: $q, entityNames: ["target"], page: { index: 0, size: 1 }) {
        hits { id entity }
      }
    }`,
    { q: symbol },
  )
  const hit = data.search.hits.find((h) => h.entity === "target") ?? data.search.hits[0]
  if (!hit) throw new Error(`No Open Targets target found for ${symbol}`)
  return hit.id
}

export interface KnownDrugsResult {
  ensemblId: string
  count: number
  drugs: KnownDrug[]
}

export async function fetchKnownDrugs(
  symbol: string,
  targetId?: string,
): Promise<KnownDrugsResult> {
  const ensemblId = await resolveEnsemblId(symbol, targetId)

  const data = await gql<{
    target: {
      drugAndClinicalCandidates: {
        count: number
        rows: {
          maxClinicalStage: string | null
          drug: {
            id: string
            name: string
            drugType: string | null
            mechanismsOfAction: {
              rows: { mechanismOfAction: string; actionType: string | null }[]
            } | null
          } | null
          diseases: { disease: { name: string } | null }[]
        }[]
      } | null
    } | null
  }>(
    `query KnownDrugs($id: String!) {
      target(ensemblId: $id) {
        drugAndClinicalCandidates {
          count
          rows {
            maxClinicalStage
            drug {
              id
              name
              drugType
              mechanismsOfAction { rows { mechanismOfAction actionType } }
            }
            diseases { disease { name } }
          }
        }
      }
    }`,
    { id: ensemblId },
  )

  const rows = data.target?.drugAndClinicalCandidates?.rows ?? []

  // Collapse to unique drugs, keeping the highest clinical stage seen.
  const byDrug = new Map<string, KnownDrug>()
  for (const r of rows) {
    if (!r.drug) continue
    const stage = r.maxClinicalStage
    const existing = byDrug.get(r.drug.id)
    if (!existing || stageRank(stage) > stageRank(existing.stage)) {
      const firstDisease = r.diseases.find((d) => d.disease?.name)?.disease?.name
      byDrug.set(r.drug.id, {
        drugId: r.drug.id,
        prefName: r.drug.name,
        drugType: r.drug.drugType,
        mechanismOfAction:
          r.drug.mechanismsOfAction?.rows?.[0]?.mechanismOfAction ?? null,
        stage,
        diseaseName: firstDisease ?? null,
      })
    }
  }

  const drugs = [...byDrug.values()].sort(
    (a, b) => stageRank(b.stage) - stageRank(a.stage),
  )

  return {
    ensemblId,
    count: data.target?.drugAndClinicalCandidates?.count ?? drugs.length,
    drugs,
  }
}

export interface DrugDetail {
  id: string
  name: string
  drugType: string | null
  description: string | null
  maximumClinicalStage: string | null
  hasBeenWithdrawn: boolean
  blackBoxWarning: boolean
  tradeNames: string[]
  synonyms: string[]
  mechanisms: { mechanismOfAction: string; actionType: string | null; targetName: string | null }[]
  indications: { name: string; stage: string | null }[]
  warnings: { warningType: string | null; description: string | null; toxicityClass: string | null }[]
  chemblUrl: string
}

export async function fetchDrugDetail(chemblId: string): Promise<DrugDetail> {
  const data = await gql<{
    drug: {
      id: string
      name: string
      drugType: string | null
      description: string | null
      maximumClinicalStage: string | null
      tradeNames: string[] | null
      synonyms: string[] | null
      mechanismsOfAction: {
        rows: { mechanismOfAction: string; actionType: string | null; targetName: string | null }[]
      } | null
      indications: {
        rows: { disease: { name: string } | null; maxClinicalStage: string | null }[]
      } | null
      drugWarnings:
        | { warningType: string | null; description: string | null; toxicityClass: string | null }[]
        | null
    } | null
  }>(
    `query Drug($id: String!) {
      drug(chemblId: $id) {
        id
        name
        drugType
        description
        maximumClinicalStage
        tradeNames
        synonyms
        mechanismsOfAction {
          rows { mechanismOfAction actionType targetName }
        }
        indications {
          rows { disease { name } maxClinicalStage }
        }
        drugWarnings { warningType description toxicityClass }
      }
    }`,
    { id: chemblId },
  )

  const d = data.drug
  if (!d) throw new Error(`No drug found for ${chemblId}`)

  const warnings = d.drugWarnings ?? []
  const blackBoxWarning = warnings.some((w) =>
    (w.warningType ?? "").toLowerCase().includes("black box"),
  )
  const hasBeenWithdrawn = warnings.some((w) =>
    (w.warningType ?? "").toLowerCase().includes("withdrawn"),
  )

  // De-duplicate indications by disease name, keeping the highest stage.
  const indMap = new Map<string, { name: string; stage: string | null }>()
  for (const r of d.indications?.rows ?? []) {
    const name = r.disease?.name
    if (!name) continue
    const existing = indMap.get(name)
    if (!existing || stageRank(r.maxClinicalStage) > stageRank(existing.stage)) {
      indMap.set(name, { name, stage: r.maxClinicalStage })
    }
  }

  return {
    id: d.id,
    name: d.name,
    drugType: d.drugType,
    description: d.description,
    maximumClinicalStage: d.maximumClinicalStage,
    hasBeenWithdrawn,
    blackBoxWarning,
    tradeNames: d.tradeNames ?? [],
    synonyms: (d.synonyms ?? []).slice(0, 8),
    mechanisms: d.mechanismsOfAction?.rows ?? [],
    indications: [...indMap.values()]
      .sort((a, b) => stageRank(b.stage) - stageRank(a.stage))
      .slice(0, 12),
    warnings,
    chemblUrl: `https://www.ebi.ac.uk/chembl/explore/compound/${d.id}`,
  }
}
