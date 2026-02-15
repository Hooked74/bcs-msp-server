/**
 * BcsClient — фасад, объединяющий все API-модули.
 *
 * Создаёт единый HttpClient и раздаёт его подмодулям.
 */

import { HttpClient, type HttpClientOptions } from "./http-client.js";
import { PortfolioApi } from "./portfolio-api.js";
import { OrdersApi } from "./orders-api.js";
import { InstrumentsApi } from "./instruments-api.js";
import { MarketDataApi } from "./market-data-api.js";
import { ScheduleApi } from "./schedule-api.js";
import { MarginApi } from "./margin-api.js";

export class BcsClient {
  /** Базовый HTTP-клиент (auth + request) */
  readonly http: HttpClient;
  /** Портфель и лимиты */
  readonly portfolio: PortfolioApi;
  /** CRUD заявок */
  readonly orders: OrdersApi;
  /** Поиск инструментов */
  readonly instruments: InstrumentsApi;
  /** Рыночные данные (свечи) */
  readonly marketData: MarketDataApi;
  /** Расписание и статус торгов */
  readonly schedule: ScheduleApi;
  /** Маржинальные показатели */
  readonly margin: MarginApi;

  constructor(opts: HttpClientOptions) {
    this.http = new HttpClient(opts);
    this.portfolio = new PortfolioApi(this.http);
    this.orders = new OrdersApi(this.http);
    this.instruments = new InstrumentsApi(this.http);
    this.marketData = new MarketDataApi(this.http);
    this.schedule = new ScheduleApi(this.http);
    this.margin = new MarginApi(this.http);
  }

  /** Прямой вызов аутентификации (делегирует HttpClient) */
  authenticate() {
    return this.http.authenticate();
  }
}
