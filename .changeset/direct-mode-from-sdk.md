---
'@rushdb/mcp-server': minor
---

Direct mode (`RUSHDB_MODE=direct`, a standalone engine) offers every tool whose SDK methods run on the
engine — now including relationships, bulk import, CSV export, text indexes and keyword search, external
vector indexes, and `findRecords` with ordering, projections and aggregations. Which tools are offered is
derived from the SDK's list of RushDB Cloud methods (`TOOL_SDK_METHODS`), so the two cannot drift; the
Cloud tools (`smartSearch`, the relationship-pattern tools) are not listed and are refused if called.
`vectorSearch`, `semanticSearch` and `createEmbeddingIndex` describe their direct-mode form. New
`RUSHDB_ENGINE_SCOPE` for a multitenant engine.

`detachRelation` without `relationType` removes relationships of every type, and no longer takes a
`transactionId` (the engine cannot stage a detach). In direct mode, creating, updating, deleting by id,
attaching and importing records inside a transaction are staged into it.
