---
'@rushdb/mcp-server': minor
---

Hybrid search fusion controls. `fusion: 'dbsf'` fuses each leg's scores normalized by its own
distribution (mean ± 3σ, as Qdrant defines DBSF) instead of ranks (`rrf`, the default, with
`rrfK`). Each leg takes a `weight` (its share of the fused score) and a `prefetchLimit` (hits it
ranks before fusion, 1–10,000). On `vectorSearch`, the top-level `weight`/`prefetchLimit` are the
vector leg's and `text.weight`/`text.prefetchLimit` the text leg's; the result reports `fusion`.
