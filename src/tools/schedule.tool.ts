/**
 * Tools: get_trading_schedule, get_trading_status
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

export function registerScheduleTools(
  server: McpServer,
  bcs: BcsClient,
): void {
  server.tool(
    "get_trading_schedule",
    "Получить дневное расписание торгов: сессии, время открытия/закрытия, признак рабочего дня.",
    {
      classCode: z.string().describe("Код класса, например TQBR"),
      ticker: z.string().describe("Тикер инструмента"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.schedule.getDailySchedule(params.classCode, params.ticker),
        );
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "get_trading_status",
    "Получить текущий торговый статус площадки: тип сессии, OPEN/CLOSE.",
    {
      classCode: z
        .string()
        .describe("Код класса, например TQBR (регистрозависимый)"),
    },
    async (params) => {
      try {
        return ok(await bcs.schedule.getStatus(params.classCode));
      } catch (e) {
        return err(e);
      }
    },
  );
}
