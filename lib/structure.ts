/**
 * Resolves a human gene symbol to a UniProt entry and an AlphaFold 3D
 * structure model, using public EBI/UniProt REST APIs (CORS-enabled).
 *
 * Flow: gene symbol -> reviewed human UniProt accession -> AlphaFold PDB URL.
 */

export interface ProteinInfo {
  accession: string
  proteinName: string
  geneSymbol: string
  functionText: string | null
  sequenceLength: number | null
  /** URL to an AlphaFold-predicted structure in PDB format. */
  pdbUrl: string
  /** Direct link to the AlphaFold entry page. */
  alphaFoldUrl: string
  /** Direct link to the UniProt entry page. */
  uniProtUrl: string
}

interface UniProtComment {
  commentType?: string
  texts?: { value?: string }[]
}

interface UniProtResult {
  primaryAccession?: string
  proteinDescription?: {
    recommendedName?: { fullName?: { value?: string } }
    submissionNames?: { fullName?: { value?: string } }[]
  }
  sequence?: { length?: number }
  comments?: UniProtComment[]
}

/**
 * Resolves the exact AlphaFold PDB URL via its prediction API (the file
 * version is no longer stable, e.g. model_v4 -> model_v6). Falls back to a
 * direct v6 URL if the API is unavailable.
 */
async function resolveAlphaFoldPdbUrl(accession: string): Promise<string> {
  try {
    const res = await fetch(
      `https://alphafold.ebi.ac.uk/api/prediction/${accession}`,
    )
    if (res.ok) {
      const data: { pdbUrl?: string }[] = await res.json()
      if (data?.[0]?.pdbUrl) return data[0].pdbUrl
    }
  } catch {
    /* fall through to default */
  }
  return `https://alphafold.ebi.ac.uk/files/AF-${accession}-F1-model_v6.pdb`
}

export async function fetchProteinInfo(symbol: string): Promise<ProteinInfo> {
  const query = encodeURIComponent(
    `gene_exact:${symbol} AND organism_id:9606 AND reviewed:true`,
  )
  const url =
    `https://rest.uniprot.org/uniprotkb/search?query=${query}` +
    `&fields=accession,protein_name,cc_function,length&format=json&size=1`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`UniProt lookup failed (${res.status})`)
  }
  const data: { results?: UniProtResult[] } = await res.json()
  const entry = data.results?.[0]
  if (!entry?.primaryAccession) {
    throw new Error(`No reviewed human UniProt entry found for ${symbol}`)
  }

  const accession = entry.primaryAccession
  const proteinName =
    entry.proteinDescription?.recommendedName?.fullName?.value ??
    entry.proteinDescription?.submissionNames?.[0]?.fullName?.value ??
    symbol

  const functionComment = entry.comments?.find(
    (c) => c.commentType === "FUNCTION",
  )
  const functionText = functionComment?.texts?.[0]?.value ?? null

  const pdbUrl = await resolveAlphaFoldPdbUrl(accession)

  return {
    accession,
    proteinName,
    geneSymbol: symbol,
    functionText,
    sequenceLength: entry.sequence?.length ?? null,
    pdbUrl,
    alphaFoldUrl: `https://alphafold.ebi.ac.uk/entry/${accession}`,
    uniProtUrl: `https://www.uniprot.org/uniprotkb/${accession}/entry`,
  }
}

/** Fetches the raw PDB text for an AlphaFold model. */
export async function fetchPdbText(pdbUrl: string): Promise<string> {
  const res = await fetch(pdbUrl)
  if (!res.ok) {
    throw new Error(`Structure download failed (${res.status})`)
  }
  return res.text()
}
