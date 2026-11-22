---
'@rushdb/mcp-server': minor
---

Support RushDB 3.0.14.

- Catalog check: `findRecords` and `propertyValues` return the server's `warnings` (a label, property or compared text no record holds, with the stored spelling, the property that stores the text, or similar names), listed first in the tool text so the agent re-runs with the stored value instead of answering "nothing found". `findRecords` and `bulkDeleteRecords` take `check: "warn" | "strict" | "off"`, sent only when set. A strict refusal comes back as a tool error listing the warnings.
- Unique indexes: new `listIndexes`, `createIndex` (`unique: true`) and `deleteIndex` tools for ordered and unique property indexes. A unique conflict (409) names the label, property and the record holding the value. Other HTTP errors keep the server's reason beside the hint.
- `bulkCreateRecords` sends batches of 5,000 flat rows (10,000 nested documents, at most about 8 MB each). **Behavior change:** a call larger than one batch is no longer all-or-nothing unless it passes a `transactionId`. If a batch fails, the error names the batches that committed (or are staged in the transaction), the batch that failed and those not sent, with their row ranges, so only the rest is resent. Calls that fit in one batch send one request, as before.
- The search query spec and system prompt cover the new types (date, localdatetime, localtime, duration, point), datetimes kept to the microsecond with their offset, `$within` and `$distance`, and typed `$min`/`$max`/`$timeBucket`. `updateRelation` `types` accepts the new types.
- Fixed: the system prompt said the schema markdown has per-property record counts (only `getSchema` JSON has them), and the README tool counts (now 56).

Everything new is optional: with a RushDB server before 3.0.14 no `check` is sent and no warnings come back. The index tools need a RushDB SDK with `db.indexes`.
