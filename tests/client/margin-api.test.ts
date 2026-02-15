/**
 * Тесты: MarginApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { MarginApi } from "../../src/client/margin-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("MarginApi", () => {
  let fetchCtrl: MockFetchController;
  let api: MarginApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new MarginApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("getDiscounts() должен GET на /instruments-discounts", async () => {
    const discounts = [{ ticker: "SBER", longRate: 0.15, shortRate: 0.25 }];
    fetchCtrl.respondWith(200, discounts);

    const result = await api.getDiscounts();
    expect(result).toEqual(discounts);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/instruments-discounts");
  });
});
