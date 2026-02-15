/**
 * Типы для BCS Trade API.
 */

// ────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  "not-before-policy": number;
  session_state: string;
  scope: string;
}

// ────────────────────────────────────────────
// Orders
// ────────────────────────────────────────────

export interface OrderRequest {
  clientOrderId: string;
  side: 1 | 2; // 1 = Buy, 2 = Sell
  orderType: 1 | 2; // 1 = Market, 2 = Limit
  orderQuantity: number;
  ticker: string;
  classCode: string;
  price?: number; // обязательно для лимитных
}

export interface ModifyOrderRequest {
  clientOrderId: string;
  price: number;
  orderQuantity: number;
  classCode: string;
}

// ────────────────────────────────────────────
// Market Data
// ────────────────────────────────────────────

export type TimeFrame =
  | "M1"
  | "M5"
  | "M15"
  | "M30"
  | "H1"
  | "H4"
  | "D"
  | "W"
  | "MN";

export interface CandlesRequest {
  classCode: string;
  ticker: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  timeFrame: TimeFrame;
}

// ────────────────────────────────────────────
// Instruments
// ────────────────────────────────────────────

export type InstrumentType =
  | "CURRENCY"
  | "STOCK"
  | "FOREIGN_STOCK"
  | "BONDS"
  | "NOTES"
  | "DEPOSITARY_RECEIPTS"
  | "EURO_BONDS"
  | "MUTUAL_FUNDS"
  | "ETF"
  | "FUTURES"
  | "OPTIONS"
  | "GOODS"
  | "INDICES";
