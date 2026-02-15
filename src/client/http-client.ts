/**
 * Базовый HTTP-клиент для BCS Trade API.
 *
 * Инкапсулирует авторизацию (refresh → access), автообновление токена
 * и абстракцию `request()` для всех REST-вызовов.
 *
 * Конкретные API-модули наследуются от этого класса через композицию.
 */

import type { AuthTokens } from "./types.js";

// ────────────────────────────────────────────
// Options
// ────────────────────────────────────────────

export interface HttpClientOptions {
  baseUrl: string;
  clientId: string;
  refreshToken: string;
}

// ────────────────────────────────────────────
// Request Options
// ────────────────────────────────────────────

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string>;
}

// ────────────────────────────────────────────
// Client
// ────────────────────────────────────────────

export class HttpClient {
  private readonly baseUrl: string;
  private readonly clientId: string;
  private refreshToken: string;
  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  constructor(opts: HttpClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.clientId = opts.clientId;
    this.refreshToken = opts.refreshToken;
  }

  // ──── Auth ──────────────────────────────────

  async authenticate(): Promise<AuthTokens> {
    const url = `${this.baseUrl}/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      client_id: this.clientId,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auth failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as AuthTokens;
    this.accessToken = data.access_token;
    // 1 min buffer до истечения
    this.accessTokenExpiresAt = Date.now() + data.expires_in * 1000 - 60_000;
    // refresh-токен может ротироваться
    this.refreshToken = data.refresh_token;
    return data;
  }

  // ──── Internal ──────────────────────────────

  private async ensureAuth(): Promise<string> {
    if (!this.accessToken || Date.now() >= this.accessTokenExpiresAt) {
      await this.authenticate();
    }
    return this.accessToken!;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    opts?: RequestOptions,
  ): Promise<T> {
    const token = await this.ensureAuth();

    let url = `${this.baseUrl}${path}`;
    if (opts?.query) {
      url += `?${new URLSearchParams(opts.query).toString()}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const res = await fetch(url, {
      method,
      headers,
      body: opts?.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BCS API ${method} ${path} → ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
  }

  /** Доступ к базовому URL для формирования путей */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
