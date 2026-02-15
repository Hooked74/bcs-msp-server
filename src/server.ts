/**
 * Создание и конфигурация MCP-сервера.
 *
 * Поддерживает два транспорта:
 *  - "http"  — Streamable HTTP на указанном порту (по умолчанию 7491)
 *  - "stdio" — стандартный ввод/вывод (для локального запуска)
 */

import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

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
// Streamable HTTP transport
// ────────────────────────────────────────────

export async function startHttpTransport(): Promise<void> {
  const { port } = appConfig;
  const app = express();
  app.use(express.json());

  // Храним активные транспорты по sessionId
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // MCP endpoint — основной маршрут для всех MCP-запросов (POST)
  app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      // Переиспользуем существующий транспорт
      transport = transports.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Новый запрос инициализации — создаём сервер и транспорт
      const server = createMcpServer();

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports.set(id, transport);
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) transports.delete(sid);
      };

      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  });

  // GET /mcp — SSE stream для server-initiated нотификаций
  app.get("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid or missing session ID" },
        id: null,
      });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // DELETE /mcp — закрытие сессии
  app.delete("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !transports.has(sessionId)) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Invalid or missing session ID" },
        id: null,
      });
      return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  });

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", transport: "streamable-http", port });
  });

  app.listen(port, () => {
    console.error(
      `BCS MCP Server запущен (Streamable HTTP) → http://localhost:${port}/mcp`
    );
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
