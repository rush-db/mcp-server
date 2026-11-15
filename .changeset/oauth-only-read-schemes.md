---
'@rushdb/mcp-server': patch
---

Read tools no longer advertise the `noauth` security scheme. Every call to `POST /mcp` needs a bearer token, so they now declare only `oauth2` with `records:read`. Every tool also mirrors its `securitySchemes` in `_meta.securitySchemes`. A session whose token lacks `records:read` (for example an OAuth token granted only `records:write`) no longer sees the read tools.
