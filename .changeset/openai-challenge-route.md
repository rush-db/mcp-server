---
'@rushdb/mcp-server': patch
---

Serve the OpenAI domain verification token at `/.well-known/openai-apps-challenge` in HTTP mode. The `/.well-known/*` proxy to platform core was registered first and answered this path with the dashboard's HTML. The token now comes from the `OPENAI_APPS_CHALLENGE_TOKEN` environment variable and is served as plain text; without it the path returns 404.
