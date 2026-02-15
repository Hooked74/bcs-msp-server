/**
 * Хелперы для формирования MCP-ответов (content[]).
 */

/** Успешный ответ — JSON-сериализация данных */
export function ok(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

/** Ответ с ошибкой */
export function err(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return {
    content: [{ type: "text" as const, text: `Ошибка: ${msg}` }],
    isError: true,
  };
}
