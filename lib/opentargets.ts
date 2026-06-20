/**
 * Open Targets Platform GraphQL client (public, CORS-enabled).
 * Used to fetch known/clinically-tested drugs for a target and drug detail.
 *
 * https://api.platform.opentargets.org/api/v4/graphql
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

export interface KnownDrug {
  drugId: string
  prefName: string
  drugType: string | null
  mechanismOfAction: string | null
  phase: number | null
  status: string | null
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
      knownDrugs: {
        count: number
        rows: {
          drugId: string
          prefName: string
          drugType: string | null
          mechanismOfAction: string | null
          phase: number | null
          status: string | null
          disease: { name: string } | null
        }[]
      } | null
    } | null
  }>(
    `query KnownDrugs($id: String!) {
      target(ensemblId: $id) {
        knownDrugs(size: 100) {
          count
          rows {
            drugId
            prefName
            drugType
            mechanismOfAction
            phase
            status
            disease { name }
          }
        }
      }
    }`,
    { id: ensemblId },
  )

  const rows = data.target?.knownDrugs?.rows ?? []

  // Collapse duplicate drug rows (same drug appears per indication), keeping
  // the highest clinical phase seen for each drug.
  const byDrug = new Map<string, KnownDrug>()
  for (const r of rows) {
    const existing = byDrug.get(r.drugId)
    if (!existing || (r.phase ?? 0) > (existing.phase ?? 0)) {
      byDrug.set(r.drugId, {
        drugId: r.drugId,
        prefName: r.prefName,
        drugType: r.drugType,
        mechanismOfAction: r.mechanismOfAction,
        phase: r.phase,
        status: r.status,
        diseaseName: r.disease?.name ?? null,
      })
    }
  }

  const drugs = [...byDrug.values()].sort(
    (a, b) => (b.phase ?? 0) - (a.phase ?? 0),
  )

  return {
    ensemblId,
    count: data.target?.knownDrugs?.count ?? drugs.length,
    drugs,
  }
}

export interface DrugDetail {
  id: string
  name: string
  drugType: string | null
  description: string | null
  isApproved: boolean | null
  maximumClinicalTrialPhase: number | null
  hasBeenWithdrawn: boolean | null
  blackBoxWarning: boolean | null
  tradeNames: string[]
  synonyms: string[]
  mechanisms: { mechanismOfAction: string; actionType: string | null; targetName: string | null }[]
  indications: { name: string; maxPhase: number | null }[]
  chemblUrl: string
}

export async function fetchDrugDetail(chemblId: string): Promise<DrugDetail> {
  const data = await gql<{
    drug: {
      id: string
      name: string
      drugType: string | null
      description: string | null
      isApproved: boolean | null
      maximumClinicalTrialPhase: number | null
      hasBeenWithdrawn: boolean | null
      blackBoxWarning: boolean | null
      tradeNames: string[] | null
      synonyms: string[] | null
      mechanismsOfAction: {
        rows: { mechanismOfAction: string; actionType: string | null; targetName: string | null }[]
      } | null
      indications: {
        rows: { disease: { name: string } | null; maxPhaseForIndication: number | null }[]
      } | null
    } | null
  }>(
    `query Drug($id: String!) {
      drug(chemblId: $id) {
        id
        name
        drugType
        description
        isApproved
        maximumClinicalTrialPhase
        hasBeenWithdrawn
        blackBoxWarning
        tradeNames
        synonyms
        mechanismsOfAction {
          rows { mechanismOfAction actionType targetName }
        }
        indications {
          rows { disease { name } maxPhaseForIndication }
        }
      }
    }`,
    { id: chemblId },
  )

  const d = data.drug
  if (!d) throw new Error(`No drug found for ${chemblId}`)

  return {
    id: d.id,
    name: d.name,
    drugType: d.drugType,
    description: d.description,
    isApproved: d.isApproved,
    maximumClinicalTrialPhase: d.maximumClinicalTrialPhase,
    hasBeenWithdrawn: d.hasBeenWithdrawn,
    blackBoxWarning: d.blackBoxWarning,
    tradeNames: d.tradeNames ?? [],
    synonyms: (d.synonyms ?? []).slice(0, 8),
    mechanisms: d.mechanismsOfAction?.rows ?? [],
    indications: (d.indications?.rows ?? [])
      .filter((r) => r.disease)
      .map((r) => ({ name: r.disease!.name, maxPhase: r.maxPhaseForIndication }))
      .slice(0, 12),
    chemblUrl: `https://www.ebi.ac.uk/chembl/explore/compound/${d.id}`,
  }
}
