/**
 * Tools: get_portfolio, get_limits
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

export function registerPortfolioTools(
  server: McpServer,
  bcs: BcsClient,
): void {
  server.tool(
    "get_portfolio",
    "Получить информацию о портфеле: позиции, стоимости, P/L, доли. Возвращает массив positions со всеми активами на брокерском счёте.",
    {},
    async () => {
      try {
        return ok(await bcs.portfolio.getPortfolio());
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_limits",
    "Получить лимиты: depoLimit (акции/облигации/валюты), moneyLimit (денежные средства), futureHolding (фьючерсы), futuresLimit (лимиты ФОРТС).",
    {},
    async () => {
      try {
        return ok(await bcs.portfolio.getLimits());
      } catch (e) {
        return err(e);
      }
    },
  );
}
