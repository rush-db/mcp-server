---
'@rushdb/mcp-server': major
---

3.0: runs on `@rushdb/javascript-sdk` 3 (RushDB Cloud on the Rust engine, or a standalone engine in
direct mode). Breaking: `detachRelation` no longer accepts `transactionId` (detach cannot be staged
in a transaction), and without `relationType` it removes relationships of every type.
