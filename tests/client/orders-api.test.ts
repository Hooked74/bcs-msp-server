/**
 * Тесты: OrdersApi
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { HttpClient } from "../../src/client/http-client.js";
import { OrdersApi } from "../../src/client/orders-api.js";
import {
  mockFetch,
  type MockFetchController,
  MOCK_AUTH_TOKENS,
  DEFAULT_CLIENT_OPTS,
} from "../helpers/mock-fetch.js";

describe("OrdersApi", () => {
  let fetchCtrl: MockFetchController;
  let api: OrdersApi;

  beforeEach(async () => {
    fetchCtrl = mockFetch();
    const http = new HttpClient(DEFAULT_CLIENT_OPTS);
    fetchCtrl.respondWith(200, MOCK_AUTH_TOKENS);
    await http.authenticate();
    api = new OrdersApi(http);
  });

  afterEach(() => fetchCtrl.restore());

  it("create() должен POST на /orders с телом заявки", async () => {
    fetchCtrl.respondWith(200, { orderId: "abc-123" });

    const order = {
      clientOrderId: "550e8400-e29b-41d4-a716-446655440000",
      side: 1 as const,
      orderType: 2 as const,
      orderQuantity: 10,
      ticker: "SBER",
      classCode: "TQBR",
      price: 250.5,
    };

    const result = await api.create(order);
    expect(result).toEqual({ orderId: "abc-123" });

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/trade-api-bff-operations/api/v1/orders");
    expect(lastCall.init?.method).toBe("POST");
    expect(JSON.parse(lastCall.init?.body as string)).toEqual(order);
  });

  it("modify() должен POST на /orders/{id} с новыми параметрами", async () => {
    fetchCtrl.respondWith(200, { status: "replaced" });

    await api.modify("original-uuid", {
      clientOrderId: "new-uuid",
      price: 260,
      orderQuantity: 5,
      classCode: "TQBR",
    });

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/orders/original-uuid");
    expect(lastCall.init?.method).toBe("POST");
  });

  it("cancel() должен POST на /orders/{id}/cancel", async () => {
    fetchCtrl.respondWith(200, { status: "canceled" });

    await api.cancel("order-to-cancel", "cancel-request-uuid");

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/orders/order-to-cancel/cancel");
    expect(JSON.parse(lastCall.init?.body as string)).toEqual({
      clientOrderId: "cancel-request-uuid",
    });
  });

  it("getStatus() должен GET на /orders/{id}", async () => {
    fetchCtrl.respondWith(200, { orderStatus: 2, avgPrice: 255.3 });

    const result = await api.getStatus("my-order-uuid");
    expect(result).toEqual({ orderStatus: 2, avgPrice: 255.3 });

    const lastCall = fetchCtrl.calls[fetchCtrl.calls.length - 1];
    expect(lastCall.url).toContain("/orders/my-order-uuid");
    expect(lastCall.init?.method).toBe("GET");
  });
});
