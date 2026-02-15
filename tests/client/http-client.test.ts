/**
 * Тесты: HttpClient — аутентификация и базовые запросы.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("HttpClient", () => {
  let fetchCtrl: MockFetchController;
  let client: HttpClient;

  beforeEach(() => {
    fetchCtrl = mockFetch();
    client = new HttpClient(DEFAULT_CLIENT_OPTS);
  });

  afterEach(() => {
    fetchCtrl.restore();
  });

  // ──── authenticate ────────────────────────

  describe("authenticate()", () => {
    it("должен отправить POST с refresh_token и вернуть токены", async () => {
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);

      const tokens = await client.authenticate();

      expect(tokens.access_token).toBe("test-access-token-xyz");
      expect(tokens.scope).toBe("read");
      expect(fetchCtrl.calls).toHaveLength(1);

      const call = fetchCtrl.calls[0];
      expect(call.url).toContain("/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token");
      expect(call.init?.method).toBe("POST");
    });

    it("должен выбросить ошибку при неуспешной авторизации", async () => {
      fetchCtrl.respondWithText(401, "Invalid token");

      await expect(client.authenticate()).rejects.toThrow("Auth failed (401)");
    });

    it("должен обновить refresh-токен после ротации", async () => {
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);

      await client.authenticate();

      // Внутреннее состояние обновлено — при следующем authenticate
      // будет использоваться новый refresh_token.
      // Проверяем через второй вызов.
      fetchCtrl.respondWith(200, {
        ...MOCK_AUTH_TOKENS,
        refresh_token: "second-rotation",
      });
      await client.authenticate();

      const body = fetchCtrl.calls[1].init?.body as string;
      expect(body).toContain("test-refresh-token-rotated");
    });
  });

  // ──── request ─────────────────────────────

  describe("request()", () => {
    it("должен автоматически авторизоваться при первом запросе", async () => {
      // Первый вызов — auth
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);

      // request() сделает ensureAuth → authenticate, затем сам запрос
      // Нужно переключить ответ после auth
      const originalFetch = globalThis.fetch;
      let callCount = 0;
      globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
        callCount++;
        if (callCount === 1) {
          // auth call
          return {
            ok: true,
            status: 200,
            json: async () => MOCK_AUTH_TOKENS,
            text: async () => JSON.stringify(MOCK_AUTH_TOKENS),
          } as Response;
        }
        // actual API call
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: "portfolio" }),
          text: async () => JSON.stringify({ data: "portfolio" }),
        } as Response;
      };

      const result = await client.request("GET", "/api/v1/test");
      expect(result).toEqual({ data: "portfolio" });
      expect(callCount).toBe(2);

      globalThis.fetch = originalFetch;
    });

    it("должен добавлять query-параметры в URL", async () => {
      // Pre-auth
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
      await client.authenticate();

      // Actual request
      fetchCtrl.respondWith(200, { result: "ok" });
      await client.request("GET", "/api/test", {
        query: { classCode: "TQBR", ticker: "SBER" },
      });

      const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
      expect(lastCall.url).toContain("classCode=TQBR");
      expect(lastCall.url).toContain("ticker=SBER");
    });

    it("должен отправлять JSON body в POST-запросах", async () => {
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
      await client.authenticate();

      fetchCtrl.respondWith(200, { id: "order-1" });
      await client.request("POST", "/api/orders", {
        body: { ticker: "GAZP", qty: 10 },
      });

      const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
      expect(lastCall.init?.method).toBe("POST");
      expect(lastCall.init?.body).toBe(JSON.stringify({ ticker: "GAZP", qty: 10 }));
    });

    it("должен выбросить ошибку при HTTP-ошибке API", async () => {
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
      await client.authenticate();

      fetchCtrl.respondWithText(404, "Not found");

      await expect(
        client.request("GET", "/api/missing"),
      ).rejects.toThrow("BCS API GET /api/missing → 404");
    });

    it("должен добавлять Bearer-токен в заголовки", async () => {
      fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
      await client.authenticate();

      fetchCtrl.respondWith(200, {});
      await client.request("GET", "/api/test");

      const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
      const headers = lastCall.init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-access-token-xyz");
    });
  });

  // ──── getBaseUrl ──────────────────────────

  describe("getBaseUrl()", () => {
    it("должен возвращать базовый URL без trailing slash", () => {
      const c = new HttpClient({
        ...DEFAULT_CLIENT_OPTS,
        baseUrl: "https://example.com/",
      });
      expect(c.getBaseUrl()).toBe("https://example.com");
    });
  });
});
