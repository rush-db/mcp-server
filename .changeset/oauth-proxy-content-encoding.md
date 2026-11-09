---
'@rushdb/mcp-server': patch
---

Fix OAuth sign-in through the hosted server: the OAuth proxy no longer forwards the upstream `content-encoding` header on a body it has already decompressed, so clients can read the token response.
