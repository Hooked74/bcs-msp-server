#!/usr/bin/env node

/**
 * BCS MCP Server — точка входа.
 *
 * Загружает конфигурацию (.env), выбирает транспорт и запускает сервер.
 */

import { appConfig } from "./config.js";
import { startSseTransport, startStdioTransport } from "./server.js";

async function main(): Promise<void> {
  if (appConfig.transport === "stdio") {
    await startStdioTransport();
  } else {
    await startSseTransport();
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
