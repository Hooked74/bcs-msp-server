/**
 * Schedule API — расписание торгов, текущий статус площадок.
 */

import type { HttpClient } from "./http-client.js";

export class ScheduleApi {
  constructor(private readonly http: HttpClient) {}

  /** Дневное расписание торгов */
  async getDailySchedule(
    classCode: string,
    ticker: string,
  ): Promise<unknown> {
    return this.http.request(
      "GET",
      "/trade-api-information-service/api/v1/trading-schedule/daily-schedule",
      { query: { classCode, ticker } },
    );
  }

  /** Текущий торговый статус площадки */
  async getStatus(classCode: string): Promise<unknown> {
    return this.http.request(
      "GET",
      "/trade-api-information-service/api/v1/trading-schedule/status",
      { query: { classCode } },
    );
  }
}
