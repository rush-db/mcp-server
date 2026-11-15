---
'@rushdb/mcp-server': patch
---

Read tools no longer advertise the `noauth` security scheme. Every call to `POST /mcp` needs a bearer token, so they now declare only `oauth2` with `records:read`. Every tool also mirrors its `securitySchemes` in `_meta.securitySchemes`. A session without `records:read` or `records:write` no longer sees the read tools. An OAuth session granted `records:write` also gets the read tools: write implies read, as it already did for API keys.
