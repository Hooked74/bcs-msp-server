/**
 * Tools: search_instruments_by_ticker, search_instruments_by_type
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BcsClient } from "../client/index.js";
import type { InstrumentType } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

const INSTRUMENT_TYPES = [
  "CURRENCY",
  "STOCK",
  "FOREIGN_STOCK",
  "BONDS",
  "NOTES",
  "DEPOSITARY_RECEIPTS",
  "EURO_BONDS",
  "MUTUAL_FUNDS",
  "ETF",
  "FUTURES",
  "OPTIONS",
  "GOODS",
  "INDICES",
] as const;

export function registerInstrumentTools(
  server: McpServer,
  bcs: BcsClient,
): void {
  server.tool(
    "search_instruments_by_ticker",
    "Найти инструменты по тикерам. Возвращает ISIN, номинал, НКД, купонную ставку, дату погашения и др.",
    {
      tickers: z
        .array(z.string())
        .min(1)
        .describe('Массив тикеров, например ["SBER", "GAZP"]'),
    },
    async (params) => {
      try {
        return ok(await bcs.instruments.searchByTickers(params.tickers));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "search_instruments_by_type",
    "Найти инструменты по типу: STOCK, BONDS, ETF, FUTURES, OPTIONS и др. Для OPTIONS обязателен baseAssetTicker.",
    {
      type: z
        .array(z.enum(INSTRUMENT_TYPES))
        .min(1)
        .describe("Типы инструментов для поиска"),
      baseAssetTicker: z
        .string()
        .optional()
        .describe("Тикер базового актива (обязателен для OPTIONS)"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.instruments.searchByType(
            params.type as InstrumentType[],
            params.baseAssetTicker,
          ),
        );
      } catch (e) {
        return err(e);
      }
    },
  );
}
