/**
 * Margin API — маржинальные дисконты.
 */

import type { HttpClient } from "./http-client.js";

export class MarginApi {
  constructor(private readonly http: HttpClient) {}

  /** Получить маржинальные дисконты (ставки long/short) */
  async getDiscounts(): Promise<unknown> {
    return this.http.request(
      "GET",
      "/trade-api-bff-marginal-indicators/api/v1/instruments-discounts",
    );
  }
}
