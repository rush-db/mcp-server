---
'@rushdb/mcp-server': minor
---

`smartSearch` runs on SQL: RushDB Cloud turns the prompt into one read-only SQL statement and runs it. The tool returns `sql` and a short `name` for the statement instead of `searchQuery`, and takes `skip`/`limit` instead of `currentQuery`. Breaking for clients that read `searchQuery`; requires `@rushdb/javascript-sdk` 3.2.0.
