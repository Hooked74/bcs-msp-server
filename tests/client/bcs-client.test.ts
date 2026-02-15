/**
 * Тесты: BcsClient — фасад, объединяющий все API-модули.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { BcsClient } from "../../src/client/bcs-client.js";
import { PortfolioApi } from "../../src/client/portfolio-api.js";
import { OrdersApi } from "../../src/client/orders-api.js";
import { InstrumentsApi } from "../../src/client/instruments-api.js";
import { MarketDataApi } from "../../src/client/market-data-api.js";
import { ScheduleApi } from "../../src/client/schedule-api.js";
import { MarginApi } from "../../src/client/margin-api.js";
import { HttpClient } from "../../src/client/http-client.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("BcsClient (фасад)", () => {
  let fetchCtrl: MockFetchController;
  let client: BcsClient;

  beforeEach(() => {
    fetchCtrl = mockFetch();
    client = new BcsClient(DEFAULT_CLIENT_OPTS);
  });

  afterEach(() => fetchCtrl.restore());

  it("должен создать все подмодули правильных типов", () => {
    expect(client.http).toBeInstanceOf(HttpClient);
    expect(client.portfolio).toBeInstanceOf(PortfolioApi);
    expect(client.orders).toBeInstanceOf(OrdersApi);
    expect(client.instruments).toBeInstanceOf(InstrumentsApi);
    expect(client.marketData).toBeInstanceOf(MarketDataApi);
    expect(client.schedule).toBeInstanceOf(ScheduleApi);
    expect(client.margin).toBeInstanceOf(MarginApi);
  });

  it("authenticate() должен делегировать вызов HttpClient", async () => {
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);

    const tokens = await client.authenticate();
    expect(tokens.access_token).toBe("test-access-token-xyz");
  });

  it("подмодули должны использовать общий HttpClient", async () => {
    // auth
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await client.authenticate();

    // Вызов через portfolio → тот же http
    fetchCtrl.respondWith(200, { positions: [] });
    await client.portfolio.getPortfolio();

    // Все вызовы прошли через один и тот же baseUrl
    for (const call of fetchCtrl.calls) {
      expect(call.url).toContain("test-api.example.com");
    }
  });
});
