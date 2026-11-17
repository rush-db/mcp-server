---
'@rushdb/mcp-server': minor
---

Prepare the hosted MCP server for directory listings: accurate auth schemes, complete tool annotations and domain verification.

- **Tool annotations.** Every tool now has a `title`, and its annotations set `readOnlyHint`, `destructiveHint` and `openWorldHint` explicitly, plus `idempotentHint` where repeating a call has no further effect. Tools that overwrite existing data are now marked destructive: `updateRecord`, `updateRelation`, `upsertEmbeddingVectors` and `syncConnection` (`setRecord` already was). `syncConnection` is also open-world, since it pulls from the connected external source. Clients may ask for confirmation before these calls more often. The `createRecord` and `bulkCreateRecords` descriptions now say that upsert options change matching records in place.
- **Security schemes.** Read tools no longer advertise the `noauth` security scheme. Every call to `POST /mcp` needs a bearer token, so they now declare only `oauth2` with `records:read`. Every tool also mirrors its `securitySchemes` in `_meta.securitySchemes`. A session without `records:read` or `records:write` no longer sees the read tools. An OAuth session granted `records:write` also gets the read tools: write implies read, as it already did for API keys.
- **OpenAI domain verification.** HTTP mode serves the verification token at `/.well-known/openai-apps-challenge`. The `/.well-known/*` proxy to platform core was registered first and answered this path with the dashboard's HTML. The token now comes from the `OPENAI_APPS_CHALLENGE_TOKEN` environment variable and is served as plain text; without it the path returns 404.
- `chatgpt-app-submission.json` is removed from the repository (it was never part of the npm package). Directory submission material now lives in `rush-db/agent-plugins`.
