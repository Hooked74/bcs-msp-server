/**
 * Создание и конфигурация MCP-сервера.
 *
 * Поддерживает два транспорта:
 *  - "sse"   — HTTP + SSE на указанном порту (по умолчанию 7491)
 *  - "stdio" — стандартный ввод/вывод (для локального запуска)
 */

import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { appConfig } from "./config.js";
import { BcsClient } from "./client/index.js";
import { registerAllTools } from "./tools/register.js";

// ────────────────────────────────────────────
// Factory
// ────────────────────────────────────────────

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "bcs-trade-api",
    version: "1.0.0",
  });

  const bcs = new BcsClient({
    baseUrl: appConfig.bcsBaseUrl,
    clientId: appConfig.bcsClientId,
    refreshToken: appConfig.bcsRefreshToken,
  });

  registerAllTools(server, bcs);

  return server;
}

// ────────────────────────────────────────────
// SSE transport (HTTP)
// ────────────────────────────────────────────

export async function startSseTransport(): Promise<void> {
  const { port } = appConfig;
  const app = express();

  // Храним активные SSE-транспорты по sessionId
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint — клиент подключается сюда (GET)
  app.get("/sse", async (_req: Request, res: Response) => {
    const server = createMcpServer();
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;

    transports.set(sessionId, transport);

    res.on("close", () => {
      transports.delete(sessionId);
    });

    await server.connect(transport);
  });

  // Message endpoint — клиент шлёт JSON-RPC сюда (POST)
  app.post("/messages", express.json(), async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId query parameter" });
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", transport: "sse", port });
  });

  app.listen(port, () => {
    console.error(`BCS MCP Server запущен (SSE) → http://localhost:${port}/sse`);
    console.error(`Health check → http://localhost:${port}/health`);
  });
}

// ────────────────────────────────────────────
// Stdio transport
// ────────────────────────────────────────────

export async function startStdioTransport(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("BCS MCP Server запущен (stdio)");
}
