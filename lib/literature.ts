/**
 * Live literature lookup via the Europe PMC REST API (public, CORS-enabled).
 *
 * Given a gene symbol (and optionally a disease label) this returns recent,
 * peer-reviewed publications so each target shows real, linkable literature
 * regardless of whether the FastAPI backend supplied PubMed evidence.
 *
 * https://europepmc.org/RestfulWebService
 */

const EPMC_ENDPOINT =
  "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

export interface LiteratureArticle {
  id: string
  source: string
  pmid: string | null
  title: string
  authors: string | null
  journal: string | null
  year: string | null
  citedByCount: number | null
  url: string
}

interface EpmcResult {
  id?: string
  source?: string
  pmid?: string
  title?: string
  authorString?: string
  journalTitle?: string
  pubYear?: string
  citedByCount?: number
  doi?: string
}

/**
 * Europe PMC titles can contain inline markup (e.g. <i>…</i>) and HTML
 * entities. Strip tags and decode the common entities for clean display.
 */
function cleanTitle(raw: string): string {
  return raw
    // Decode entities first so encoded markup (e.g. &lt;i&gt;) becomes real
    // tags, then strip all tags in a single pass.
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/\.$/, "")
    .trim()
}

function articleUrl(r: EpmcResult): string {
  if (r.source && r.id) {
    return `https://europepmc.org/article/${r.source}/${r.id}`
  }
  if (r.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`
  if (r.doi) return `https://doi.org/${r.doi}`
  return "https://europepmc.org"
}

export async function fetchTargetLiterature(
  symbol: string,
  disease?: string,
  limit = 8,
): Promise<LiteratureArticle[]> {
  // Restrict to gene-symbol mentions; add the disease term when available so
  // the results are relevant to the analysis context.
  const terms = disease
    ? `("${symbol}" AND "${disease}")`
    : `"${symbol}"`
  const query = `${terms} AND (SRC:MED) AND HAS_ABSTRACT:Y`

  const url =
    `${EPMC_ENDPOINT}?query=${encodeURIComponent(query)}` +
    `&format=json&pageSize=${limit}&resultType=lite&sort=${encodeURIComponent(
      "P_PDATE_D desc",
    )}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Europe PMC lookup failed (${res.status})`)
  }

  const data: { resultList?: { result?: EpmcResult[] } } = await res.json()
  const rows = data.resultList?.result ?? []

  return rows
    .filter((r) => r.title)
    .map((r) => ({
      id: r.id ?? r.pmid ?? r.title!,
      source: r.source ?? "MED",
      pmid: r.pmid ?? null,
      title: cleanTitle(r.title!),
      authors: r.authorString ?? null,
      journal: r.journalTitle ?? null,
      year: r.pubYear ?? null,
      citedByCount:
        typeof r.citedByCount === "number" ? r.citedByCount : null,
      url: articleUrl(r),
    }))
}
