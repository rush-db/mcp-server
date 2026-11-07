---
'@rushdb/mcp-server': minor
---

Add the `updateRelation` tool to change the properties of existing relationships

- **What it does:** updates the relationships of one `relationType` from `sourceId` to each target.
  - `set` writes values; `unset` removes properties.
  - `types` marks values JSON can't type: `{ "since": "datetime" }` stores an ISO string as a datetime.
  - `direction: "incoming"` reverses the pair.
  - Pairs without such a relationship are skipped, and the result reports how many relationships were `updated`.
- **Availability:** works on RushDB Cloud and on a self-hosted engine (direct mode).
- **Requirements:** RushDB 3.0.4 or newer, and `@rushdb/javascript-sdk` with `relationships.update`.
