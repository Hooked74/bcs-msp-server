/**
 * Тесты: ScheduleApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { ScheduleApi } from "../../src/client/schedule-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("ScheduleApi", () => {
  let fetchCtrl: MockFetchController;
  let api: ScheduleApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new ScheduleApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("getDailySchedule() должен GET с classCode и ticker", async () => {
    const schedule = { isWorkingDay: true, sessions: [] };
    fetchCtrl.respondWith(200, schedule);

    const result = await api.getDailySchedule("TQBR", "SBER");
    expect(result).toEqual(schedule);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/trading-schedule/daily-schedule");
    expect(lastCall.url).toContain("classCode=TQBR");
    expect(lastCall.url).toContain("ticker=SBER");
  });

  it("getStatus() должен GET с classCode", async () => {
    const status = { tradingStatus: "OPEN", sessionType: "main" };
    fetchCtrl.respondWith(200, status);

    const result = await api.getStatus("TQBR");
    expect(result).toEqual(status);

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/trading-schedule/status");
    expect(lastCall.url).toContain("classCode=TQBR");
  });
});
