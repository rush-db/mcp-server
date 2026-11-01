---
'@rushdb/mcp-server': minor
---

New read-only tools that keep an agent from guessing values and names: `searchValues` (where a value from the question is stored, across every property; `match: similar` for near spellings), `getSchemaSummary` (every label's properties with distinct counts, ranges and small fields' values in one live read), `resolveNames` (the real label or property behind a name not in the schema) and `getJoinCandidates` (how labels reference each other, with evidence; RushDB Cloud only, not offered in direct mode). `propertyValues` applies its `query` as a value search with counts, `match` and `domainOnMiss`. The others work in Cloud and direct mode; they need `@rushdb/javascript-sdk` with the catalog lookups.
