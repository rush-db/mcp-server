---
'@rushdb/mcp-server': minor
---

Tools for synced company data and background imports (RushDB Cloud only, not offered in direct mode): `listConnections` and `getConnection` show where a label's records come from and how fresh they are (status, schedule, last success and error, per-stream record count and last sync), `listImports` and `getImport` follow import runs (file imports and connection syncs), and the write tool `syncConnection` refreshes a connection now (every enabled stream or the ones named, `full` to re-read everything). The system prompt tells the agent to check freshness before answering about recent data and to offer a sync rather than start one unasked. Needs `@rushdb/javascript-sdk` with `db.connections` and `db.imports`.
