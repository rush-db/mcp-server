# RushDB MCP Server

### Give your agent a memory layer. Via MCP.

Connect RushDB to any MCP-compatible AI client and your agent gains persistent, structured memory — semantically searchable and graph-traversable, without managing embeddings or schemas.

Works with **ChatGPT**, **Claude.ai**, Claude Desktop, Cursor, Windsurf, Gemini CLI, and any MCP-compatible tool.

---

## Two ways to connect

### Remote OAuth (no installation)

For **ChatGPT**, **Claude.ai**, and other web-based AI clients — connect directly without installing anything locally:

**MCP endpoint:** `https://mcp.rushdb.com/mcp`

Your client redirects to RushDB for OAuth sign-in and receives a scoped token. No API key setup required.

**ChatGPT:**

1. Go to **Settings → Connectors → Add connector**
2. Enter `https://mcp.rushdb.com/mcp`
3. Sign in with your RushDB account

**Claude.ai:**

1. Go to **Settings → Integrations → Add integration**
2. Enter `https://mcp.rushdb.com/mcp`
3. Authorize with your RushDB account

---

### Local (RushDB Cloud API key)

For Claude Desktop, Cursor, Windsurf, VS Code, and other stdio MCP clients:

**1. Get an API key** at [app.rushdb.com](https://app.rushdb.com)

**2. Add to your MCP client config:**

```json
{
  "mcpServers": {
    "rushdb": {
      "command": "npx",
      "args": ["@rushdb/mcp-server"],
      "env": {
        "RUSHDB_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Place this in:

- **Claude Desktop** — `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor** — MCP settings in the Cursor config panel
- **Windsurf** — `~/.codeium/windsurf/mcp_config.json`

**3. That's it.** The agent now has 13 tools for storing, querying, and traversing structured memory.

> `RUSHDB_API_URL` is optional and defaults to `https://api.rushdb.com/api/v1`. It targets the RushDB Platform REST API.

### Local standalone engine (no Cloud account)

Run the Rust engine, then point a local **stdio** MCP client at it. This mode calls the
public engine protocol directly; it does not use a RushDB Cloud API key, dashboard, or OAuth.

```bash
RUSHDB_TOKEN=local-development-token rushdb up --data-dir ./rushdb-data
```

```json
{
  "mcpServers": {
    "rushdb": {
      "command": "npx",
      "args": ["-y", "@rushdb/mcp-server"],
      "env": {
        "RUSHDB_MODE": "direct",
        "RUSHDB_ENGINE_URL": "http://127.0.0.1:3000",
        "RUSHDB_ENGINE_TOKEN": "local-development-token"
      }
    }
  }
}
```

Direct mode offers every tool whose work the engine does: schema discovery, record reads and writes (with
ordering, projections and aggregations), relationships, labels and properties, bulk import and CSV export, text
indexes and keyword search, and external vector indexes with vector search by a `queryVector` you supply.
The RushDB Cloud tools are not listed and are refused if called: `smartSearch` (natural-language search),
the relationship-pattern tools, and anything that needs managed embeddings (a text `query` for vector search,
managed indexes). The MCP HTTP transport is unavailable in direct mode because its OAuth flow belongs to the
platform; run the server through stdio on the same machine as the client.

---

## What an agent can do

After connecting, ask Claude or your agent naturally:

> "Remember that we decided to use Clerk for auth, replacing Auth0, on 2026-04-10."

The agent calls `CreateRecord` to store a structured memory. Later:

> "What auth decisions have we made?"

The agent calls `FindRecords` with a semantic query — no manual searching required.

> "Show me everything related to our auth system."

The agent calls `FindRelationships` to traverse the graph of connected records.

---

## Available tools

### Discovery

| Tool                | What it does                         |
| ------------------- | ------------------------------------ |
| `FindLabels`        | List record labels and record counts |
| `FindProperties`    | List properties across labels        |
| `FindRelationships` | Search relationships between records |

### Records

| Tool                | What it does                                                   |
| ------------------- | -------------------------------------------------------------- |
| `CreateRecord`      | Store a new record                                             |
| `GetRecord`         | Retrieve a record by ID                                        |
| `UpdateRecord`      | Update an existing record                                      |
| `DeleteRecord`      | Delete a record by ID                                          |
| `FindRecords`       | Search records by properties, relationships, or semantic query |
| `BulkCreateRecords` | Create multiple records at once                                |
| `BulkDeleteRecords` | Delete records matching a query                                |

### Relationships

| Tool                          | What it does                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| `AttachRelation`              | Create a relationship between two records                            |
| `DetachRelation`              | Remove a relationship                                                |
| `ListRelationshipPatterns`    | List inferred relationship patterns and analysis status              |
| `AnalyzeRelationshipPatterns` | Queue schema analysis for relationship suggestions                   |
| `ApproveRelationshipPattern`  | Approve and apply a suggested pattern                                |
| `IgnoreRelationshipPattern`   | Ignore a suggested pattern                                           |
| `DeleteRelationshipPattern`   | Delete a saved pattern and optionally its materialized relationships |

### Utilities

| Tool                    | What it does                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `ExportRecords`         | Export records to CSV                                                                               |
| `HelpAddToClient`       | Get setup instructions for your MCP client                                                          |
| `GetQueryBuilderPrompt` | Returns the built-in query builder system prompt (fallback for clients without MCP Prompts support) |

---

## Built-in query builder prompt

RushDB exposes a system prompt via the MCP Prompts API that teaches the agent to query safely — discover labels and properties first, then construct queries.

**How it works:**

1. Client calls `ListPrompts` → finds `rushdb.queryBuilder`
2. Client calls `GetPrompt` → injects it as the session system message
3. Agent now does discovery-first queries automatically

Most MCP clients handle this at session start. If your client doesn't support MCP Prompts, call `GetQueryBuilderPrompt` and inject the result as your system message.

---

## Environment variables

These apply to local (API key) mode only. Remote OAuth connections do not use environment variables.

| Variable         | Required | Description                                             |
| ---------------- | -------- | ------------------------------------------------------- |
| `RUSHDB_API_KEY` | yes      | Your RushDB API key                                     |
| `RUSHDB_API_URL` | no       | API base URL (default: `https://api.rushdb.com/api/v1`) |

For standalone direct mode, use these instead:

| Variable | Required | Description |
| --- | --- | --- |
| `RUSHDB_MODE` | yes | Set to `direct`. |
| `RUSHDB_ENGINE_URL` | yes | Standalone engine base URL, for example `http://127.0.0.1:3000`. |
| `RUSHDB_ENGINE_TOKEN` | yes | Token configured for the standalone engine. |
| `RUSHDB_ENGINE_SCOPE` | no | Tenant on an engine started with `--multitenant`. |

---

## Registry & autodiscovery

- `mcp.yaml` at the repo root enables autodiscovery by MCP registries
- `glama.json` at the repo root contains Glama metadata
- Package: `@rushdb/mcp-server`, command: `npx`

---

## Development

```bash
git clone https://github.com/rush-db/mcp-server
cd mcp-server
npm install
npm run build
```

### Troubleshooting: `rushdb-mcp: command not found` / MCP error `-32000`

This only happens when the MCP client launches the server with a **working directory inside this repo** (e.g. an `.mcp.json` at the repo root used by Claude Code / Cursor). This repo *is* `@rushdb/mcp-server`, so an unversioned `npx @rushdb/mcp-server` (even with `-p`) can resolve to the local package, whose `rushdb-mcp` bin isn't linked in `node_modules/.bin`. The process exits before the MCP handshake, which the client reports as `-32000`.

The published package is unaffected — the config above works as-is **outside** the repo. To run from inside the repo, **pin a version** so npx fetches from the registry instead of resolving the local package:

```json
{
  "mcpServers": {
    "rushdb": {
      "command": "npx",
      "args": ["-y", "-p", "@rushdb/mcp-server@latest", "rushdb-mcp"],
      "env": { "RUSHDB_API_KEY": "your-api-key-here" }
    }
  }
}
```

Alternatively, run the local build directly (uses your in-repo code, must be built first with `npm run build`):

```json
{
  "mcpServers": {
    "rushdb": {
      "command": "node",
      "args": ["build/index.js"],
      "env": { "RUSHDB_API_KEY": "your-api-key-here" }
    }
  }
}
```

---

## License

Apache 2.0
