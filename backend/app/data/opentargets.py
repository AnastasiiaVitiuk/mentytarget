"""Client for the public OpenTargets Platform GraphQL API.

Docs: https://platform-docs.opentargets.org/data-access/graphql-api
No API key required.
"""
from __future__ import annotations

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
