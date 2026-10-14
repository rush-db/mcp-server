---
'@rushdb/mcp-server': minor
---

Embedding indexes have names. A name is unique within a project, defaults to
`<label>.<property>.<model>.<dimensions>.<similarity>`, and is returned when indexes are listed.
Search (`index`), inline vectors (`index`), stats, vector upsert and delete accept an index's name
as well as its id. The dashboard asks for the name in a second step when creating an index,
prefilled with the default.
