/**
 * Регистрация всех MCP tools на сервере.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BcsClient } from "../client/index.js";

import { registerAuthTool } from "./auth.tool.js";
import { registerPortfolioTools } from "./portfolio.tool.js";
import { registerOrderTools } from "./orders.tool.js";
import { registerInstrumentTools } from "./instruments.tool.js";
import { registerMarketDataTools } from "./market-data.tool.js";
import { registerScheduleTools } from "./schedule.tool.js";
import { registerMarginTools } from "./margin.tool.js";

export function registerAllTools(server: McpServer, bcs: BcsClient): void {
  registerAuthTool(server, bcs);
  registerPortfolioTools(server, bcs);
  registerOrderTools(server, bcs);
  registerInstrumentTools(server, bcs);
  registerMarketDataTools(server, bcs);
  registerScheduleTools(server, bcs);
  registerMarginTools(server, bcs);
}
