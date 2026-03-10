# 🪤 Drosera MCP Server

> An unofficial community-built MCP (Model Context Protocol) server for the [Drosera Network](https://drosera.io) — bringing Drosera's full documentation and Trap code generation directly into your AI coding assistant.

Built by a Drosera community contributor to help developers build, deploy, and manage Traps faster — without leaving their editor.

---

## What is this?

If you use **Cursor**, **Claude Desktop**, **VS Code**, or any MCP-compatible AI agent, this server gives your AI assistant:

- 📚 **Full Drosera documentation** embedded locally — no web search, no hallucinations
- 🔨 **Instant Trap code generation** from plain English descriptions
- 🗺️ **Step-by-step setup guides** for any OS
- 📖 **ITrap interface reference** always at hand

Instead of switching between the Drosera docs and your editor, just ask your AI:

> *"Write me a Drosera trap that monitors if an ERC20 total supply changes by more than 10%"*

> *"Walk me through setting up a Drosera project on Mac with npm"*

> *"How do I hydrate a trap?"*

And get accurate, instant answers — powered by the real Drosera docs baked right in.

---

## Tools

| Tool | Description |
|---|---|
| `drosera_write_trap` | Generates a complete Solidity Trap contract + `drosera.toml` from a plain-English description. Template-based — no API key needed. |
| `drosera_setup_guide` | Returns a full step-by-step project setup guide (install, file structure, compile, test, deploy) for your OS and package manager. |
| `drosera_explain_interface` | Explains the `ITrap` interface — `collect()`, `shouldRespond()`, rules, and a working example. |
| `drosera_docs` | Query any topic from the official Drosera docs embedded locally. Works offline. |

### Trap Templates (`drosera_write_trap`)

The trap writer detects your intent from plain English and picks the right template:

| Keywords | Template |
|---|---|
| `owner`, `admin`, `signer` | Ownership change monitor |
| `paused`, `frozen` | Pause state monitor |
| `total supply`, `mint`, `burn` | ERC20 supply change |
| `erc20`, `token balance` | ERC20 balance threshold |
| `eth balance`, `ether` | ETH balance threshold |
| `drop`, `crash`, `sudden`, `spike` | % drop across blocks |
| `threshold`, `below`, `exceed` | Single value threshold |
| anything else | Generic template with clear TODOs |

### Docs Topics (`drosera_docs`)

Pass `"list"` to see all topics, or ask about any of:

`getting started` · `drosera cli` · `creating a trap` · `updating a trap` · `hydrating a trap` · `boosting a trap` · `dryrun` · `kicking an operator` · `private trap` · `bloomboost percentage` · `liveness data` · `recovering drosera.toml` · `configuring alerts` · `operator installation` · `operator register` · `running operator node` · `opt in / opt out` · `run on VPS` · `run with Docker` · `operator monitoring`

---

## Quickstart

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Cursor](https://cursor.sh), Claude Desktop, or any MCP-compatible client

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

### 4. Restart your client and test

In Cursor chat (`Cmd+L`):

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

## Remote Deployment (Railway)

Deploy once, use from anywhere — share the URL with your team.

### Deploy to Railway

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

### Connect Cursor to remote server

Once Railway gives you a URL, update `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "drosera": {
      "type": "http",
      "url": "https://YOUR-APP.up.railway.app/mcp"
    }
  }
}
```

### Verify deployment

```bash
# Health check
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
│   ├── trap-writer.ts    # Template-based Solidity trap generator
│   └── docs.ts           # Full Drosera docs embedded as structured data
├── dist/                 # Compiled output (after npm run build)
├── railway.json          # Railway deployment config
├── tsconfig.json
└── package.json
```

---

## Example Prompts

```
Write me a Drosera trap that triggers if a Uniswap V3 pool
liquidity drops by more than 20% in one block
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
- **Generates valid Trap contracts instantly** using tested templates
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
