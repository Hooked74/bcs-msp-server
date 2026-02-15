/**
 * Тесты: PortfolioApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { PortfolioApi } from "../../src/client/portfolio-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("PortfolioApi", () => {
  let fetchCtrl: MockFetchController;
  let api: PortfolioApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new PortfolioApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("getPortfolio() должен вызвать GET /trade-api-bff-portfolio/api/v1/portfolio", async () => {
    const mockPortfolio = { positions: [{ ticker: "SBER", qty: 100 }] };
    fetchCtrl.respondWith(200, mockPortfolio);

    const result = await api.getPortfolio();
    expect(result).toEqual(mockPortfolio);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/trade-api-bff-portfolio/api/v1/portfolio");
  });

  it("getLimits() должен вызвать GET /trade-api-bff-limit/api/v1/limits", async () => {
    const mockLimits = { depoLimit: [], moneyLimit: [] };
    fetchCtrl.respondWith(200, mockLimits);

    const result = await api.getLimits();
    expect(result).toEqual(mockLimits);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/trade-api-bff-limit/api/v1/limits");
  });
});
