/**
 * Tool: get_candles
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

const TIME_FRAMES = [
  "M1", "M5", "M15", "M30", "H1", "H4", "D", "W", "MN",
] as const;

export function registerMarketDataTools(
  server: McpServer,
  bcs: BcsClient,
): void {
  server.tool(
    "get_candles",
    "Получить исторические свечи (OHLCV). Таймфреймы: M1, M5, M15, M30, H1, H4, D, W, MN.",
    {
      ticker: z.string().describe("Тикер инструмента"),
      classCode: z.string().describe("Код класса (борд), например TQBR"),
      startDate: z
        .string()
        .describe("Начало периода ISO 8601, например 2025-01-01T00:00:00Z"),
      endDate: z
        .string()
        .describe("Конец периода ISO 8601, например 2025-02-15T23:59:59Z"),
      timeFrame: z.enum(TIME_FRAMES).describe("Таймфрейм свечи"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.marketData.getCandles({
            ticker: params.ticker,
            classCode: params.classCode,
            startDate: params.startDate,
            endDate: params.endDate,
            timeFrame: params.timeFrame,
          }),
        );
      } catch (e) {
        return err(e);
      }
    },
  );
}
