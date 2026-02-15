/**
 * Tool: authenticate
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BcsClient } from "../client/index.js";
import { ok, err } from "../helpers/response.js";

export function registerAuthTool(server: McpServer, bcs: BcsClient): void {
  server.tool(
    "authenticate",
    "Получить access-токен из refresh-токена. Вызывается автоматически при истечении, но можно вызвать вручную для проверки.",
    {},
    async () => {
      try {
        const tokens = await bcs.authenticate();
        return ok({
          message: "Авторизация прошла успешно",
          expires_in: tokens.expires_in,
          scope: tokens.scope,
        });
      } catch (e) {
        return err(e);
      }
    },
  );
}
