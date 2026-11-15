---
'@rushdb/mcp-server': patch
---

Every tool now has a `title`, and its annotations set `readOnlyHint`, `destructiveHint` and `openWorldHint` explicitly, plus `idempotentHint` where repeating a call has no further effect. Tools that overwrite existing data are now marked destructive: `updateRecord`, `updateRelation`, `upsertEmbeddingVectors` and `syncConnection` (`setRecord` already was). Clients may ask for confirmation before these calls more often. The `createRecord` and `bulkCreateRecords` descriptions now say that upsert options change matching records in place.
