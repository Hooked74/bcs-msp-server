/**
 * Конфигурация приложения.
 *
 * Загружает .env (если есть) через dotenv, валидирует обязательные
 * переменные и экспортирует типизированный объект Config.
 */

import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Загружаем .env из корня проекта (или из CWD в Docker)
loadDotenv({ path: resolve(process.cwd(), ".env") });

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type TransportType = "stdio" | "http";

export interface Config {
  /** Refresh-токен из веб-версии БКС */
  bcsRefreshToken: string;
  /** Тип клиента: trade-api-read | trade-api-write */
  bcsClientId: string;
  /** Базовый URL торгового API */
  bcsBaseUrl: string;
  /** Транспорт MCP: "http" (Streamable HTTP) или "stdio" */
  transport: TransportType;
  /** Порт для HTTP-транспорта */
  port: number;
}

// ────────────────────────────────────────────
// Validation & export
// ────────────────────────────────────────────

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `ERROR: Переменная окружения ${name} не задана.\n` +
        "Скопируйте .env.example в .env и заполните значения."
    );
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const appConfig: Config = {
  bcsRefreshToken: requiredEnv("BCS_REFRESH_TOKEN"),
  bcsClientId: optionalEnv("BCS_CLIENT_ID", "trade-api-read"),
  bcsBaseUrl: optionalEnv("BCS_BASE_URL", "https://be.broker.ru"),
  transport: (optionalEnv("MCP_TRANSPORT", "http") as TransportType),
  port: Number(optionalEnv("MCP_PORT", "7491")),
};
