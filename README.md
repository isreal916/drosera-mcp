# 🪤 Drosera MCP Server

> An unofficial community-built MCP (Model Context Protocol) server for the [Drosera Network](https://drosera.io) — bringing Drosera's full documentation and Trap code generation directly into your AI coding assistant.

Built by a Drosera community contributor to help developers build, deploy, and manage Traps faster — without leaving their editor.

---

## What is this?

If you use **Cursor**, **Claude Desktop**, **VS Code Copilot**, or any MCP-compatible AI agent, this server gives your AI assistant:

- 📚 **Full Drosera documentation** embedded locally — no web search, no hallucinations
- 🔨 **Instant Trap code generation** from plain English descriptions
- 🧠 **AI-improvable scaffolds** — your AI agent reads the output and generates custom logic from 8 built-in reference patterns
- 🗺️ **Step-by-step setup guides** for any OS
- 📖 **ITrap interface reference** always at hand

Instead of switching between the Drosera docs and your editor, just ask your AI:

> *"Write me a Drosera trap that monitors a Chainlink oracle for price deviation"*

> *"Walk me through setting up a Drosera project on Mac with npm"*

> *"How do I hydrate a trap?"*

And get accurate, instant answers — powered by real Drosera docs baked right in.

---

## How Trap Generation Works

### Known patterns → instant working contract
If your description matches one of 8 known patterns, you get a **complete, compilable Solidity contract** immediately — no further AI needed.

### Custom ideas → rich scaffold + AI improvisation
If your idea is unique (e.g. *"monitor a Uniswap V3 pool's tick range"*), the tool returns a **rich scaffold** containing:
- The full ITrap structure with all rules documented inline
- All 8 reference patterns as commented code examples at the bottom
- Your goal embedded in the `@notice` comment

Your AI agent (Cursor, Copilot, Claude) reads this output and **implements the custom logic itself** using the reference patterns. No API key needed on the server.

**Example workflow in Cursor:**
```
1. Use drosera_write_trap — monitor Chainlink ETH/USD for 5% price deviation

2. [MCP returns scaffold + 8 reference patterns]

3. Tell Cursor: "Implement the TODO sections using Pattern 2 
   from the reference examples at the bottom"

4. Cursor generates the full working contract
```

---

## Tools

| Tool | Description |
|---|---|
| `drosera_write_trap` | Generates a Solidity Trap contract + `drosera.toml` from plain English. Known patterns → complete contract. Custom ideas → rich scaffold for your AI to implement. |
| `drosera_setup_guide` | Full step-by-step project setup (install, file structure, compile, test, deploy) for your OS and package manager. |
| `drosera_explain_interface` | Explains the `ITrap` interface — `collect()`, `shouldRespond()`, rules, and a working example. |
| `drosera_docs` | Query any topic from the official Drosera docs embedded locally. Works offline. |

### Trap Templates (`drosera_write_trap`)

**8 instant templates** — matched by keywords in your description:

| Keywords | Template |
|---|---|
| `owner`, `admin`, `signer` | Ownership change monitor |
| `paused`, `frozen` | Pause state monitor |
| `total supply`, `mint`, `burn` | ERC20 supply change |
| `erc20`, `token balance` | ERC20 balance threshold |
| `eth balance`, `ether` | ETH balance threshold |
| `drop`, `crash`, `sudden`, `spike` | % drop across blocks |
| `threshold`, `below`, `exceed` | Single value threshold |
| **anything else** | **Rich scaffold + 8 reference patterns for your AI to implement** |

**8 reference patterns** included in every custom scaffold:

1. Single value threshold
2. Percentage drop across two blocks
3. Address / ownership change
4. Boolean state change (paused, frozen)
5. Multi-field snapshot (price + liquidity + owner)
6. ERC20 balance monitor
7. ERC20 total supply change
8. Event log monitoring (Transfer, Swap, etc.)

### Docs Topics (`drosera_docs`)

Pass `"list"` to see all topics, or ask about any of:

`getting started` · `drosera cli` · `creating a trap` · `updating a trap` · `hydrating a trap` · `boosting a trap` · `dryrun` · `kicking an operator` · `private trap` · `bloomboost percentage` · `liveness data` · `recovering drosera.toml` · `configuring alerts` · `operator installation` · `operator register` · `running operator node` · `opt in / opt out` · `run on VPS` · `run with Docker` · `operator monitoring`

---

## Quickstart

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Cursor](https://cursor.sh), Claude Desktop, VS Code, or any MCP-compatible client

### 1. Clone and build

```bash
git clone https://github.com/YOUR_USERNAME/drosera-mcp-server
cd drosera-mcp-server
npm install
npm run build
```

### 2. Confirm it works

```bash
node dist/index.js
# Should print: [drosera-mcp] stdio transport ready
# Ctrl+C to stop
```

### 3. Add to your AI client

**Cursor** — edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "drosera": {
      "command": "node",
      "args": ["/absolute/path/to/drosera-mcp-server/dist/index.js"],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "drosera": {
      "command": "node",
      "args": ["/absolute/path/to/drosera-mcp-server/dist/index.js"],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

**VS Code** — edit `.vscode/mcp.json` in your project:

```json
{
  "servers": {
    "drosera": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/drosera-mcp-server/dist/index.js"]
    }
  }
}
```

### 4. Skip the setup — use the hosted version

Already deployed on Railway. Just paste this into your config and go:

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "drosera": {
      "type": "http",
      "url": "https://drosera-mcp.up.railway.app/mcp"
    }
  }
}
```

**Claude Desktop:**
```json
{
  "mcpServers": {
    "drosera": {
      "type": "http",
      "url": "https://drosera-mcp.up.railway.app/mcp"
    }
  }
}
```

No Node.js, no cloning, no building required.

### 5. Restart your client and test

```
Use the drosera_docs tool — list all topics
```

```
Use drosera_write_trap to write a trap that monitors if a multisig loses a signer
```

```
Use drosera_setup_guide for Mac with npm
```

---

## Self-Hosting on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set transport to HTTP only
railway variables set TRANSPORT=http
```

Verify it's live:
```bash
curl https://YOUR-APP.up.railway.app/health
# → {"status":"ok","server":"drosera-mcp-server"}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TRANSPORT` | `both` | `stdio` = local only, `http` = remote only, `both` = both at once |
| `PORT` | `3000` | HTTP port (Railway sets this automatically) |

---

## Project Structure

```
drosera-mcp-server/
├── src/
│   ├── index.ts          # Entry point — stdio + HTTP transports
│   ├── tools.ts          # MCP tool definitions
│   ├── trap-writer.ts    # Template engine + 8 reference patterns
│   └── docs.ts           # Full Drosera docs embedded as structured data
├── dist/                 # Compiled output (after npm run build)
├── railway.json          # Railway deployment config
├── tsconfig.json
└── package.json
```

---

## Example Prompts

```
Write me a Drosera trap that monitors a Chainlink oracle 
for more than 5% price deviation in one block
```

```
Write a trap that watches a Uniswap V3 pool for abnormal 
liquidity removal
```

```
How do I set up a private trap with a custom operator whitelist?
```

```
Show me the full drosera.toml config options
```

```
Walk me through running a Drosera operator on a VPS with Docker
```

```
What's the difference between hydrating and bloom boosting a trap?
```

```
How do I recover my drosera.toml if I lost it?
```

```
Write a trap monitoring ERC20 balance for 0x1234...abcd
then give me the Mac setup guide
```

---

## Why This Exists

The Drosera docs are excellent but spread across many pages. When you're in the middle of writing a trap, you don't want to break your flow to search the docs — you want the answer right inside your editor.

This MCP server:
- **Embeds the complete Drosera docs** so your AI never has to search the web
- **Generates valid Trap contracts instantly** from 8 proven templates
- **Provides rich scaffolds** with reference patterns so your AI can implement any custom trap idea
- **Works fully offline** — no external API calls, no API keys required
- **Stays accurate** — docs are baked in from the official source, not scraped

---

## Contributing

PRs welcome. Most useful contributions:

- **New trap templates** in `src/trap-writer.ts` — add more patterns
- **Doc updates** in `src/docs.ts` — when Drosera docs change, update here
- **New tools** in `src/tools.ts` — ideas: `drosera_toml_validate`, `drosera_estimate_gas`

---

## Disclaimer

This is an **unofficial community project** and is not affiliated with or endorsed by the Drosera team. Always refer to the [official Drosera documentation](https://docs.drosera.io) for the most up-to-date information.

---

## License

MIT

---

*Built with ❤️ for the Drosera community*