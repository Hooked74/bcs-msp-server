/**
 * Market Data API — исторические свечи (OHLCV).
 */

import type { HttpClient } from "./http-client.js";
import type { CandlesRequest } from "./types.js";

export class MarketDataApi {
  constructor(private readonly http: HttpClient) {}

  /** Получить исторические свечи */
  async getCandles(params: CandlesRequest): Promise<unknown> {
    return this.http.request(
      "GET",
      "/trade-api-market-data-connector/api/v1/candles-chart",
      {
        query: {
          classCode: params.classCode,
          ticker: params.ticker,
          startDate: params.startDate,
          endDate: params.endDate,
          timeFrame: params.timeFrame,
        },
      },
    );
  }
}
