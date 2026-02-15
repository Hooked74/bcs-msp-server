/**
 * Orders API — создание, изменение, отмена и статус заявок.
 */

import type { HttpClient } from "./http-client.js";
import type { ModifyOrderRequest, OrderRequest } from "./types.js";

export class OrdersApi {
  constructor(private readonly http: HttpClient) {}

  /** Создать торговую заявку */
  async create(order: OrderRequest): Promise<unknown> {
    return this.http.request("POST", "/trade-api-bff-operations/api/v1/orders", {
      body: order,
    });
  }

  /** Изменить существующую заявку (отмена + новая) */
  async modify(
    originalClientOrderId: string,
    data: ModifyOrderRequest,
  ): Promise<unknown> {
    return this.http.request(
      "POST",
      `/trade-api-bff-operations/api/v1/orders/${originalClientOrderId}`,
      { body: data },
    );
  }

  /** Отменить заявку */
  async cancel(
    originalClientOrderId: string,
    clientOrderId: string,
  ): Promise<unknown> {
    return this.http.request(
      "POST",
      `/trade-api-bff-operations/api/v1/orders/${originalClientOrderId}/cancel`,
      { body: { clientOrderId } },
    );
  }

  /** Получить статус заявки */
  async getStatus(originalClientOrderId: string): Promise<unknown> {
    return this.http.request(
      "GET",
      `/trade-api-bff-operations/api/v1/orders/${originalClientOrderId}`,
    );
  }
}
