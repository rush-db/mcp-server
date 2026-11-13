---
'@rushdb/mcp-server': patch
---

Report tool errors as they are. In HTTP (OAuth) mode every failed call used to say "you haven't configured your RushDB credentials", because the server checked `RUSHDB_API_KEY` in its own environment; it now uses the request's credentials and maps the upstream status (400, 401, 403, 404, 5xx) as stdio mode does. Every error result now sets `isError: true`.

A key that `/tokens/current` rejects (401/403) now stops stdio start-up with a message, and gets a 401 in HTTP mode, instead of starting with every tool listed. Network errors still fall back to full scopes.
