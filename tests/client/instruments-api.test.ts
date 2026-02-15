/**
 * Тесты: InstrumentsApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { InstrumentsApi } from "../../src/client/instruments-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("InstrumentsApi", () => {
  let fetchCtrl: MockFetchController;
  let api: InstrumentsApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new InstrumentsApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("searchByTickers() должен POST с массивом тикеров", async () => {
    const mockInstruments = [{ ticker: "SBER", isin: "RU0009029540" }];
    fetchCtrl.respondWith(200, mockInstruments);

    const result = await api.searchByTickers(["SBER", "GAZP"]);
    expect(result).toEqual(mockInstruments);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/instruments/by-tickers");
    expect(lastCall.init?.method).toBe("POST");
    expect(JSON.parse(lastCall.init?.body as string)).toEqual({
      tickers: ["SBER", "GAZP"],
    });
  });

  it("searchByType() должен GET с query-параметром type", async () => {
    fetchCtrl.respondWith(200, []);

    await api.searchByType(["STOCK", "ETF"]);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("type=STOCK%2CETF");
    expect(lastCall.init?.method).toBe("GET");
  });

  it("searchByType() с baseAssetTicker для опционов", async () => {
    fetchCtrl.respondWith(200, []);

    await api.searchByType(["OPTIONS"], "Si");

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("type=OPTIONS");
    expect(lastCall.url).toContain("baseAssetTicker=Si");
  });
});
