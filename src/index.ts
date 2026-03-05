import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerDroseraTools, registerDocsTool } from "./tools.js";
import express from "express";
import cors from "cors";

// ── Factory — each connection gets its own isolated server instance ──────────
function createServer(): McpServer {
  const server = new McpServer({
    name: "drosera-mcp-server",
    version: "1.0.0",
  });
  registerDroseraTools(server);
  registerDocsTool(server);
  return server;
}

// ── STDIO — for local clients (Cursor, Claude Desktop, VS Code) ──────────────
async function startStdio() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[drosera-mcp] stdio transport ready");
}

// ── HTTP — for remote clients (Railway, Fly.io, n8n, LangChain) ─────────────
async function startHttp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check — used by Railway/Render/Fly to confirm the service is alive
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "drosera-mcp-server" });
  });

  // MCP endpoint — Streamable HTTP (modern clients)
  app.post("/mcp", async (req, res) => {
    try {
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("[drosera-mcp] HTTP error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.error(`[drosera-mcp] HTTP transport ready on port ${port}`);
    console.error(`[drosera-mcp] Health: http://localhost:${port}/health`);
    console.error(`[drosera-mcp] MCP endpoint: http://localhost:${port}/mcp`);
  });
}

// ── Entry point — TRANSPORT env var controls which mode runs ─────────────────
// TRANSPORT=stdio   → local only  (Cursor, Claude Desktop)
// TRANSPORT=http    → remote only (Railway, Fly.io)
// TRANSPORT=both    → both at once (default)

const mode = process.env.TRANSPORT ?? "both";

if (mode === "stdio") {
  startStdio().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
} else if (mode === "http") {
  startHttp().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
} else {
  // "both" — stdio for local, HTTP for remote, simultaneously
  Promise.all([startStdio(), startHttp()]).catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}