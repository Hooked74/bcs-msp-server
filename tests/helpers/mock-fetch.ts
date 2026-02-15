/**
 * Общие мок-фабрики для тестов.
 *
 * mockFetch() — подменяет глобальный fetch и возвращает контроллер
 * для задания ответов.
 */

import { vi } from "vitest";

// ────────────────────────────────────────────
// Fetch mock
// ────────────────────────────────────────────

export interface MockFetchController {
  /** Задать следующий ответ fetch */
  respondWith(status: number, body: unknown): void;
  /** Задать текстовый ответ (для ошибок) */
  respondWithText(status: number, text: string): void;
  /** Получить все вызовы */
  calls: Array<{ url: string; init?: RequestInit }>;
  /** Восстановить оригинальный fetch */
  restore: () => void;
}

export function mockFetch(): MockFetchController {
  let nextStatus = 200;
  let nextBody: unknown = {};
  let nextIsText = false;
  const calls: MockFetchController["calls"] = [];

  const originalFetch = globalThis.fetch;

  const fakeFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, init });

    return {
      ok: nextStatus >= 200 && nextStatus < 300,
      status: nextStatus,
      text: async () => (nextIsText ? (nextBody as string) : JSON.stringify(nextBody)),
      json: async () => nextBody,
      headers: new Headers(),
    } as Response;
  });

  globalThis.fetch = fakeFetch;

  return {
    respondWith(status: number, body: unknown) {
      nextStatus = status;
      nextBody = body;
      nextIsText = false;
    },
    respondWithText(status: number, text: string) {
      nextStatus = status;
      nextBody = text;
      nextIsText = true;
    },
    calls,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

// ────────────────────────────────────────────
// Auth token fixture
// ────────────────────────────────────────────

export const MOCK_AUTH_TOKENS = {
  access_token: "test-access-token-xyz",
  expires_in: 86400,
  refresh_expires_in: 7776000,
  refresh_token: "test-refresh-token-rotated",
  token_type: "Bearer",
  "not-before-policy": 0,
  session_state: "session-123",
  scope: "read",
};

export const DEFAULT_CLIENT_OPTS = {
  baseUrl: "https://test-api.example.com",
  clientId: "trade-api-read",
  refreshToken: "initial-refresh-token",
};
