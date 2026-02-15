/**
 * Instruments API — поиск инструментов по тикерам и типу.
 */

import type { HttpClient } from "./http-client.js";
import type { InstrumentType } from "./types.js";

export class InstrumentsApi {
  constructor(private readonly http: HttpClient) {}

  /** Поиск по массиву тикеров */
  async searchByTickers(tickers: string[]): Promise<unknown> {
    return this.http.request(
      "POST",
      "/trade-api-information-service/api/v1/instruments/by-tickers",
      { body: { tickers } },
    );
  }

  /** Поиск по типу инструмента */
  async searchByType(
    type: InstrumentType[],
    baseAssetTicker?: string,
  ): Promise<unknown> {
    const query: Record<string, string> = { type: type.join(",") };
    if (baseAssetTicker) query.baseAssetTicker = baseAssetTicker;
    return this.http.request(
      "GET",
      "/trade-api-information-service/api/v1/instruments/by-type",
      { query },
    );
  }
}
