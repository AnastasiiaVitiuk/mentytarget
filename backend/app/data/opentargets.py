"""Client for the public OpenTargets Platform GraphQL API.

Docs: https://platform-docs.opentargets.org/data-access/graphql-api
No API key required.
"""
from __future__ import annotations

import asyncio

import httpx

from app.config import settings

# Resolve a free-text disease name to an EFO/MONDO id.
_SEARCH_QUERY = """
query Search($q: String!) {
  search(queryString: $q, entityNames: ["disease"], page: {index: 0, size: 5}) {
    hits { id name entity }
  }
}
"""

# Pull associated targets for a disease, including the per-datatype evidence
# breakdown and tractability buckets (used for modality awareness).
_ASSOCIATIONS_QUERY = """
query Assoc($efoId: String!, $size: Int!) {
  disease(efoId: $efoId) {
    id
    name
    associatedTargets(page: {index: 0, size: $size}) {
      count
      rows {
        score
        datatypeScores { id score }
        target {
          id
          approvedSymbol
          approvedName
          tractability { label modality value }
        }
      }
    }
  }
}
"""

# Pull literature (EuropePMC) evidence rows for a specific target-disease pair.
_LITERATURE_QUERY = """
query Literature($ensemblId: String!, $efoId: String!, $size: Int!) {
  target(ensemblId: $ensemblId) {
    id
    evidences(efoIds: [$efoId], datasourceIds: ["europepmc"], size: $size) {
      rows {
        literature
        score
        publicationYear
      }
    }
  }
}
"""


async def _post(query: str, variables: dict) -> dict:
    async with httpx.AsyncClient(timeout=settings.http_timeout) as client:
        resp = await client.post(
            settings.opentargets_api,
            json={"query": query, "variables": variables},
        )
        resp.raise_for_status()
        payload = resp.json()
        if "errors" in payload:
            raise RuntimeError(f"OpenTargets API error: {payload['errors']}")
        return payload["data"]


async def resolve_disease(name: str) -> list[dict]:
    """Return candidate diseases [{id, name}] for a free-text query."""
    data = await _post(_SEARCH_QUERY, {"q": name})
    return [{"id": h["id"], "name": h["name"]} for h in data["search"]["hits"]]


async def fetch_associated_targets(efo_id: str, size: int | None = None) -> dict:
    """Return raw disease + associated-target rows from OpenTargets."""
    size = size or settings.max_candidates
    data = await _post(_ASSOCIATIONS_QUERY, {"efoId": efo_id, "size": size})
    disease = data.get("disease")
    if not disease:
        raise ValueError(f"No disease found for id '{efo_id}'")
    return disease


async def fetch_literature_evidence(
    ensembl_id: str, efo_id: str, size: int = 3
) -> list[dict]:
    """Return up to `size` literature evidence rows for a target-disease pair.

    Returns a list of {pubmed_id, score, year}. Returns [] on any failure
    (literature lookup is best-effort and should never break the main pipeline).
    """
    try:
        data = await _post(
            _LITERATURE_QUERY,
            {"ensemblId": ensembl_id, "efoId": efo_id, "size": size},
        )
    except Exception:
        return []

    target = data.get("target")
    if not target:
        return []
    rows = target.get("evidences", {}).get("rows", [])
    results = []
    for r in rows:
        lit = r.get("literature") or []
        results.append(
            {
                "pubmed_id": lit[0] if lit else None,
                "score": r.get("score"),
                "year": r.get("publicationYear"),
            }
        )
    return results


async def fetch_literature_for_targets(
    pairs: list[tuple[str, str]], size: int = 3
) -> dict[str, list[dict]]:
    """Fetch literature evidence for multiple (ensembl_id, efo_id) pairs concurrently.

    Returns a dict keyed by ensembl_id -> list of literature evidence rows.
    """
    tasks = [fetch_literature_evidence(ensembl_id, efo_id, size) for ensembl_id, efo_id in pairs]
    results = await asyncio.gather(*tasks)
    return {ensembl_id: lit for (ensembl_id, _), lit in zip(pairs, results)}