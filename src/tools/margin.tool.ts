/**
 * Tool: get_discounts
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

export function registerMarginTools(server: McpServer, bcs: BcsClient): void {
  server.tool(
    "get_discounts",
    "Получить маржинальные дисконты (ставки long/short) для всех инструментов.",
    {},
    async () => {
      try {
        return ok(await bcs.margin.getDiscounts());
      } catch (e) {
        return err(e);
      }
    },
  );
}
