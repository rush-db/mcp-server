---
'@rushdb/mcp-server': patch
---

The RushDB engine is the only data store; what remained of the Neo4j-backed platform is removed.

- Projects no longer carry a `customDb` (bring-your-own Neo4j) connection: the `projects.custom_db`
  column is dropped (migration `0010_drop_project_custom_db`), `GET /sdk/settings` no longer
  returns `customDb`, `DELETE /projects/:id` no longer takes `shouldStoreCustomDbData`, and the
  dashboard drops the "External Instance" badge. Every project is metered the same way.
- `POST /query/raw` returns `{ records }` (the always-empty `summary` is gone). Raw queries are
  openCypher run by the engine, which must have the `cypher` language enabled.
- A write sent with `x-transaction-id` defers its side effects (recount, schema refresh,
  relationship automation) to `POST /tx/:txId/commit`, and a failed request inside a transaction
  rolls the transaction back. Both checks keyed off a Neo4j transaction object that was no longer
  attached, so neither ran.
- `RUSHDB_TRANSACTION_TIMEOUT_MS` no longer falls back to `NEO4J_TRANSACTION_TIMEOUT_MS`.
- The CLI `db-restore` command now recounts the project after the restore; it never ran before.
- Deploy templates (Compose, Helm, Fly) run the engine with `--multitenant --languages cypher`,
  which Core requires: it scopes every request to its project. Heroku's `app.json` sets
  `RUST_ENGINE_URL` / `RUST_ENGINE_TOKEN`, the variables Core reads.
- SDK: `serverSettings` drops `customDB` / `managedDB`; doc comments no longer mention Neo4j.
