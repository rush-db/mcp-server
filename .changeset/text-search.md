---
'@rushdb/mcp-server': minor
---

Keyword (BM25) search. Text indexes cover one property of a label, or every string of it (`*`),
and are declared, listed and dropped through `/text-indexes` (`db.textIndexes`, MCP
`createTextIndex` / `listTextIndexes` / `deleteTextIndex`), with a default name of
`<label>.<property>.text`. `POST /search/text` (`db.records.textSearch`, MCP `textSearch`) ranks
matching records among those `labels` and `where` select, and `total` counts every match. A
vector search with a `text` leg becomes a hybrid search the engine fuses. The dashboard lists and
creates text indexes on the Search Indexes page and adds a Keyword search mode to Records.
