/**
 * Tools: create_order, modify_order, cancel_order, get_order_status
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

export function registerOrderTools(server: McpServer, bcs: BcsClient): void {
  // ── create_order ────────────────────────────

  server.tool(
    "create_order",
    "Создать торговую заявку на Мосбирже. Поддерживает рыночные и лимитные заявки на покупку/продажу. Требует права 'trade-api-write'.",
    {
      clientOrderId: z
        .string()
        .uuid()
        .describe("Уникальный UUID заявки, сгенерированный клиентом"),
      side: z
        .enum(["1", "2"])
        .describe("Направление: 1 = Покупка, 2 = Продажа"),
      orderType: z
        .enum(["1", "2"])
        .describe("Тип: 1 = Рыночная, 2 = Лимитная"),
      orderQuantity: z
        .number()
        .int()
        .positive()
        .describe("Количество в штуках (целое > 0)"),
      ticker: z.string().describe("Тикер инструмента, например SBER"),
      classCode: z
        .string()
        .describe("Код класса бумаги (борд), например TQBR"),
      price: z
        .number()
        .positive()
        .optional()
        .describe("Цена (обязательна для лимитных заявок)"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.orders.create({
            clientOrderId: params.clientOrderId,
            side: Number(params.side) as 1 | 2,
            orderType: Number(params.orderType) as 1 | 2,
            orderQuantity: params.orderQuantity,
            ticker: params.ticker,
            classCode: params.classCode,
            price: params.price,
          }),
        );
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── modify_order ────────────────────────────

  server.tool(
    "modify_order",
    "Изменить существующую заявку (отмена старой + создание новой). Требует права 'trade-api-write'.",
    {
      originalClientOrderId: z
        .string()
        .uuid()
        .describe("UUID исходной заявки, которую нужно заменить"),
      clientOrderId: z
        .string()
        .uuid()
        .describe("Новый UUID для заменяющей заявки"),
      price: z
        .number()
        .positive()
        .describe("Новая цена (> 0, до 8 знаков после запятой)"),
      orderQuantity: z.number().int().positive().describe("Новое количество"),
      classCode: z.string().describe("Код класса бумаги"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.orders.modify(params.originalClientOrderId, {
            clientOrderId: params.clientOrderId,
            price: params.price,
            orderQuantity: params.orderQuantity,
            classCode: params.classCode,
          }),
        );
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── cancel_order ────────────────────────────

  server.tool(
    "cancel_order",
    "Отменить существующую заявку. Требует права 'trade-api-write'.",
    {
      originalClientOrderId: z
        .string()
        .uuid()
        .describe("UUID исходной заявки для отмены"),
      clientOrderId: z
        .string()
        .uuid()
        .describe("Новый UUID для запроса отмены"),
    },
    async (params) => {
      try {
        return ok(
          await bcs.orders.cancel(
            params.originalClientOrderId,
            params.clientOrderId,
          ),
        );
      } catch (e) {
        return err(e);
      }
    },
  );

  // ── get_order_status ────────────────────────

  server.tool(
    "get_order_status",
    "Получить статус заявки: orderStatus (0=New, 1=PartiallyFill, 2=Fill, 4=Canceled, 5=Replaced, 8=Rejected).",
    {
      originalClientOrderId: z
        .string()
        .uuid()
        .describe("UUID заявки, статус которой нужно проверить"),
    },
    async (params) => {
      try {
        return ok(await bcs.orders.getStatus(params.originalClientOrderId));
      } catch (e) {
        return err(e);
      }
    },
  );
}
