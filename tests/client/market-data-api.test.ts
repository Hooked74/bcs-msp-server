/**
 * Тесты: MarketDataApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { MarketDataApi } from "../../src/client/market-data-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("MarketDataApi", () => {
  let fetchCtrl: MockFetchController;
  let api: MarketDataApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new MarketDataApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("getCandles() должен GET с параметрами свечей", async () => {
    const candles = [{ open: 250, high: 260, low: 248, close: 255, volume: 1000 }];
    fetchCtrl.respondWith(200, candles);

    const result = await api.getCandles({
      classCode: "TQBR",
      ticker: "SBER",
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-02-15T23:59:59Z",
      timeFrame: "D",
    });

    expect(result).toEqual(candles);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/candles-chart");
    expect(lastCall.url).toContain("ticker=SBER");
    expect(lastCall.url).toContain("timeFrame=D");
    expect(lastCall.url).toContain("classCode=TQBR");
  });
});
