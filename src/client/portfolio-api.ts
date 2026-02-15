/**
 * Portfolio API — позиции портфеля.
 */

import type { HttpClient } from "./http-client.js";

export class PortfolioApi {
  constructor(private readonly http: HttpClient) {}

  /** Получить позиции портфеля */
  async getPortfolio(): Promise<unknown> {
    return this.http.request("GET", "/trade-api-bff-portfolio/api/v1/portfolio");
  }

  /** Получить лимиты: depo, money, futures */
  async getLimits(): Promise<unknown> {
    return this.http.request("GET", "/trade-api-bff-limit/api/v1/limits");
  }
}
