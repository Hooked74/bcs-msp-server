# BCS Trade API — MCP Server

MCP-сервер для работы с торговым API **БКС Инвестиции** (БКС Мир Инвестиций). Позволяет LLM-агентам (Claude, GPT и др.) получать данные о портфеле, искать инструменты, получать котировки и управлять торговыми заявками через протокол [Model Context Protocol](https://modelcontextprotocol.io/).

## Архитектура

```
┌───────────────┐  HTTP / stdio ┌──────────────────┐   HTTPS    ┌──────────────┐
│  MCP Host     │◄────────────►│  bcs-mcp-server  │◄──────────►│  BCS API      │
│  (Claude,     │              │  :7491/mcp        │            │  be.broker.ru│
│   Cursor,     │              │                  │            └──────────────┘
│   VS Code)    │              │  HttpClient       │
└───────────────┘              │   ├─ PortfolioApi  │
                               │   ├─ OrdersApi     │
                               │   ├─ InstrumentsApi│
                               │   ├─ MarketDataApi │
                               │   ├─ ScheduleApi   │
                               │   └─ MarginApi     │
                               └──────────────────┘
```

## Структура проекта

```
bcs-mcp-server/
├── src/
│   ├── index.ts                  # Точка входа
│   ├── config.ts                 # Чтение .env, валидация переменных
│   ├── server.ts                 # Express + Streamable HTTP / stdio транспорт
│   ├── client/
│   │   ├── index.ts              # Реэкспорт всего публичного API
│   │   ├── types.ts              # Типы: AuthTokens, OrderRequest и др.
│   │   ├── http-client.ts        # Базовый HTTP-клиент (auth + request)
│   │   ├── bcs-client.ts         # Фасад — объединяет все API-модули
│   │   ├── portfolio-api.ts      # Портфель и лимиты
│   │   ├── orders-api.ts         # CRUD заявок
│   │   ├── instruments-api.ts    # Поиск инструментов
│   │   ├── market-data-api.ts    # Свечи (OHLCV)
│   │   ├── schedule-api.ts       # Расписание торгов
│   │   └── margin-api.ts         # Маржинальные дисконты
│   ├── tools/
│   │   ├── register.ts           # Регистрация всех tools
│   │   ├── auth.tool.ts          # authenticate
│   │   ├── portfolio.tool.ts     # get_portfolio, get_limits
│   │   ├── orders.tool.ts        # create/modify/cancel/status
│   │   ├── instruments.tool.ts   # search by ticker/type
│   │   ├── market-data.tool.ts   # get_candles
│   │   ├── schedule.tool.ts      # trading schedule/status
│   │   └── margin.tool.ts        # get_discounts
│   └── helpers/
│       └── response.ts           # ok() / err() хелперы
├── tests/
│   ├── helpers/
│   │   ├── mock-fetch.ts         # Мок fetch + фикстуры токенов
│   │   └── response.test.ts      # Тесты ok() / err()
│   ├── client/
│   │   ├── http-client.test.ts   # Auth, request, headers, errors
│   │   ├── bcs-client.test.ts    # Фасад: типы, делегация
│   │   ├── portfolio-api.test.ts
│   │   ├── orders-api.test.ts
│   │   ├── instruments-api.test.ts
│   │   ├── market-data-api.test.ts
│   │   ├── schedule-api.test.ts
│   │   └── margin-api.test.ts
│   └── tools/
│       └── tools.test.ts         # Регистрация + мок-интеграция
├── Dockerfile                      # Multi-stage сборка, EXPOSE 7491
├── docker-compose.yml              # env_file + fallback переменные
├── vitest.config.ts                # Конфигурация тестов
├── .env.example
├── package.json
└── tsconfig.json
```

## Быстрый старт

### Предварительные требования

1. Брокерский счёт в БКС Мир Инвестиций
2. Refresh-токен, полученный в [веб-версии](https://bcs.ru) → Профиль → Управление счетами → Токены API
3. Node.js ≥ 22 (или Docker)

### Установка и запуск (Node.js)

```bash
cd bcs-mcp-server

# Установить зависимости
npm install

# Скопировать и заполнить .env
cp .env.example .env
# Отредактировать .env — вписать BCS_REFRESH_TOKEN

# Собрать TypeScript
npm run build

# Запустить (Streamable HTTP на порту 7491 по умолчанию)
npm start
# → http://localhost:7491/mcp

# Или через stdio (для Claude Desktop напрямую)
MCP_TRANSPORT=stdio node dist/index.js
```

### Запуск через Docker

```bash
cd bcs-mcp-server

# Создать .env
cp .env.example .env
# Вписать BCS_REFRESH_TOKEN в .env

# Собрать и запустить
docker compose up --build
```

## Подключение к AI-агентам

### Claude Desktop

Добавьте в `claude_desktop_config.json`:

**Вариант A — Streamable HTTP (рекомендуется для Docker):**

```json
{
  "mcpServers": {
    "bcs-trade-api": {
      "url": "http://localhost:7491/mcp"
    }
  }
}
```

**Вариант B — stdio (локальный запуск):**

```json
{
  "mcpServers": {
    "bcs-trade-api": {
      "command": "node",
      "args": ["/путь/к/bcs-mcp-server/dist/index.js"],
      "env": {
        "BCS_REFRESH_TOKEN": "ваш_refresh_токен",
        "BCS_CLIENT_ID": "trade-api-read",
        "MCP_TRANSPORT": "stdio"
      }
    }
  }
}
```

### Claude Code

```bash
# Добавить (Streamable HTTP)
claude mcp add --transport http --scope user bcs http://localhost:7491/mcp

# Или stdio
claude mcp add --scope user bcs -- node /путь/к/bcs-mcp-server/dist/index.js

# Проверить подключение
claude mcp list
```

### VS Code (MCP Extension)

Установите [MCP Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp-vscode) и добавьте в `settings.json`:

```json
{
  "mcp.servers": {
    "bcs-trade-api": {
      "url": "http://localhost:7491/mcp",
      "description": "БКС Trade API для работы с портфелем и торговыми заявками"
    }
  }
}
```

### Cursor IDE

В настройках Cursor → Extensions → MCP добавьте сервер:

```json
{
  "mcpServers": {
    "bcs-trade-api": {
      "url": "http://localhost:7491/mcp",
      "name": "BCS Trade API",
      "description": "Торговый API БКС Инвестиции"
    }
  }
}
```

### Continue.dev

В файле `.continue/config.json` добавьте:

```json
{
  "mcpServers": [
    {
      "name": "bcs-trade-api",
      "url": "http://localhost:7491/mcp",
      "description": "BCS Trading API for portfolio and orders management"
    }
  ]
}
```

### Zed Editor

Добавьте в `settings.json` Zed:

```json
{
  "assistant": {
    "mcp_servers": {
      "bcs-trade-api": {
        "command": "node",
        "args": ["/путь/к/bcs-mcp-server/dist/index.js"],
        "env": {
          "BCS_REFRESH_TOKEN": "ваш_refresh_токен",
          "MCP_TRANSPORT": "stdio"
        }
      }
    }
  }
}
```

### Другие MCP-совместимые клиенты

Для любого MCP-клиента используйте один из вариантов:

**Streamable HTTP:**
- URL: `http://localhost:7491/mcp`
- Health check: `http://localhost:7491/health`

**stdio (процесс):**
- Command: `node dist/index.js`
- Env vars: `BCS_REFRESH_TOKEN`, `MCP_TRANSPORT=stdio`

> 💡 **Рекомендация:** Используйте HTTP-транспорт для стабильного соединения, особенно при работе через Docker или удалённые серверы.

## Переменные окружения

| Переменная | Обязательна | По умолчанию | Описание |
|---|---|---|---|
| `BCS_REFRESH_TOKEN` | ✅ | — | Refresh-токен из веб-версии БКС |
| `BCS_CLIENT_ID` | ❌ | `trade-api-read` | `trade-api-read` для чтения, `trade-api-write` для торговли |
| `BCS_BASE_URL` | ❌ | `https://be.broker.ru` | Базовый URL API |
| `MCP_TRANSPORT` | ❌ | `http` | Транспорт: `http` (Streamable HTTP сервер) или `stdio` |
| `MCP_PORT` | ❌ | `7491` | Порт для HTTP-транспорта |

> **Типы токенов:**
> - `trade-api-read` — чтение портфеля, котировок, поиск инструментов
> - `trade-api-write` — всё выше + создание/изменение/отмена заявок

## Доступные MCP Tools

### Авторизация

| Tool | Описание |
|---|---|
| `authenticate` | Получить access-токен из refresh-токена. Вызывается автоматически при истечении, но доступен для ручной проверки. |

### Портфель и лимиты

| Tool | Описание |
|---|---|
| `get_portfolio` | Позиции портфеля: тикеры, количество, стоимость, P/L, доли. |
| `get_limits` | Детальные лимиты: depoLimit (бумаги), moneyLimit (деньги), futureHolding (фьючерсы), futuresLimit (ГО ФОРТС). |

### Торговые заявки

| Tool | Параметры | Описание |
|---|---|---|
| `create_order` | `clientOrderId`, `side` (1/2), `orderType` (1/2), `orderQuantity`, `ticker`, `classCode`, `price?` | Создать рыночную или лимитную заявку |
| `modify_order` | `originalClientOrderId`, `clientOrderId`, `price`, `orderQuantity`, `classCode` | Изменить заявку (отмена + новая) |
| `cancel_order` | `originalClientOrderId`, `clientOrderId` | Отменить заявку |
| `get_order_status` | `originalClientOrderId` | Статус: New/PartiallyFill/Fill/Canceled/Replaced/Rejected |

> ⚠️ Торговые tools требуют `BCS_CLIENT_ID=trade-api-write`

### Поиск инструментов

| Tool | Параметры | Описание |
|---|---|---|
| `search_instruments_by_ticker` | `tickers` (массив строк) | Поиск по тикерам. Возвращает ISIN, номинал, НКД, купоны, даты и пр. |
| `search_instruments_by_type` | `type` (массив типов), `baseAssetTicker?` | Поиск по типу: STOCK, BONDS, ETF, FUTURES и др. |

**Типы инструментов:** `CURRENCY`, `STOCK`, `FOREIGN_STOCK`, `BONDS`, `NOTES`, `DEPOSITARY_RECEIPTS`, `EURO_BONDS`, `MUTUAL_FUNDS`, `ETF`, `FUTURES`, `OPTIONS`, `GOODS`, `INDICES`

### Рыночные данные

| Tool | Параметры | Описание |
|---|---|---|
| `get_candles` | `ticker`, `classCode`, `startDate`, `endDate`, `timeFrame` | Исторические OHLCV-свечи |

**Таймфреймы:** `M1`, `M5`, `M15`, `M30`, `H1`, `H4`, `D`, `W`, `MN`

### Расписание и статус

| Tool | Параметры | Описание |
|---|---|---|
| `get_trading_schedule` | `classCode`, `ticker` | Дневное расписание: сессии, время открытия/закрытия |
| `get_trading_status` | `classCode` | Текущий статус площадки: OPEN/CLOSE, тип сессии |

### Маржинальная торговля

| Tool | Описание |
|---|---|
| `get_discounts` | Маржинальные дисконты (ставки long/short) для всех инструментов |

## Исходный код: описание модулей

### `src/config.ts` — конфигурация

Загружает `.env` через `dotenv`, валидирует обязательные переменные (`BCS_REFRESH_TOKEN`), экспортирует типизированный объект `appConfig`. Приложение завершается с ошибкой, если `.env` не найден и переменная не задана через окружение.

### `src/client/` — API-клиент

Клиент декомпозирован на базовый HTTP-слой и 6 API-модулей:

| Модуль | Класс | Методы |
|---|---|---|
| `http-client.ts` | `HttpClient` | `authenticate()`, `request()` — авто-авторизация, обработка ошибок |
| `portfolio-api.ts` | `PortfolioApi` | `getPortfolio()`, `getLimits()` |
| `orders-api.ts` | `OrdersApi` | `create()`, `modify()`, `cancel()`, `getStatus()` |
| `instruments-api.ts` | `InstrumentsApi` | `searchByTickers()`, `searchByType()` |
| `market-data-api.ts` | `MarketDataApi` | `getCandles()` |
| `schedule-api.ts` | `ScheduleApi` | `getDailySchedule()`, `getStatus()` |
| `margin-api.ts` | `MarginApi` | `getDiscounts()` |

`bcs-client.ts` — фасад, создаёт `HttpClient` и раздаёт его всем подмодулям. Использование:

```typescript
const bcs = new BcsClient({ baseUrl, clientId, refreshToken });

await bcs.portfolio.getPortfolio();
await bcs.orders.create({ ... });
await bcs.instruments.searchByTickers(["SBER"]);
await bcs.marketData.getCandles({ ... });
await bcs.schedule.getDailySchedule("TQBR", "SBER");
await bcs.margin.getDiscounts();
```

`index.ts` — реэкспорт всех публичных классов и типов для удобного импорта: `import { BcsClient, OrdersApi } from "./client/index.js"`.

### `src/tools/*.tool.ts` — MCP tools

Каждая группа tools в отдельном файле:

| Файл | Tools |
|---|---|
| `auth.tool.ts` | `authenticate` |
| `portfolio.tool.ts` | `get_portfolio`, `get_limits` |
| `orders.tool.ts` | `create_order`, `modify_order`, `cancel_order`, `get_order_status` |
| `instruments.tool.ts` | `search_instruments_by_ticker`, `search_instruments_by_type` |
| `market-data.tool.ts` | `get_candles` |
| `schedule.tool.ts` | `get_trading_schedule`, `get_trading_status` |
| `margin.tool.ts` | `get_discounts` |

`register.ts` собирает все tools и регистрирует их на сервере одним вызовом.

### `src/server.ts` — транспорт

Поддерживает два режима:
- **Streamable HTTP** — Express HTTP-сервер на порту 7491. Клиент взаимодействует через единый эндпоинт `POST/GET/DELETE /mcp`. Сессии управляются через заголовок `mcp-session-id`. Есть `GET /health`.
- **stdio** — классический stdio-транспорт для MCP.

### `src/index.ts` — точка входа

Загружает конфиг и запускает нужный транспорт.

## Тестирование

Тесты написаны на [Vitest](https://vitest.dev/). Все API-вызовы мокаются через подмену `globalThis.fetch` — реальные HTTP-запросы не выполняются.

```bash
# Запустить все тесты
npm test

# Watch-режим
npm run test:watch
```

**46 тестов** в 10 файлах:

| Файл | Тестов | Что проверяет |
|---|---|---|
| `http-client.test.ts` | 9 | Auth, request, query params, body, errors, headers |
| `bcs-client.test.ts` | 3 | Фасад: типы подмодулей, делегация, shared http |
| `portfolio-api.test.ts` | 2 | getPortfolio, getLimits |
| `orders-api.test.ts` | 4 | create, modify, cancel, getStatus |
| `instruments-api.test.ts` | 3 | searchByTickers, searchByType, OPTIONS |
| `market-data-api.test.ts` | 1 | getCandles с параметрами |
| `schedule-api.test.ts` | 2 | getDailySchedule, getStatus |
| `margin-api.test.ts` | 1 | getDiscounts |
| `response.test.ts` | 6 | ok/err хелперы |
| `tools.test.ts` | 15 | Регистрация tools, мок-интеграция всех 13 API |

## Маппинг API эндпоинтов

| MCP Tool | HTTP метод | Эндпоинт BCS API |
|---|---|---|
| `authenticate` | POST | `/trade-api-keycloak/realms/tradeapi/protocol/openid-connect/token` |
| `get_portfolio` | GET | `/trade-api-bff-portfolio/api/v1/portfolio` |
| `get_limits` | GET | `/trade-api-bff-limit/api/v1/limits` |
| `create_order` | POST | `/trade-api-bff-operations/api/v1/orders` |
| `modify_order` | POST | `/trade-api-bff-operations/api/v1/orders/{id}` |
| `cancel_order` | POST | `/trade-api-bff-operations/api/v1/orders/{id}/cancel` |
| `get_order_status` | GET | `/trade-api-bff-operations/api/v1/orders/{id}` |
| `search_instruments_by_ticker` | POST | `/trade-api-information-service/api/v1/instruments/by-tickers` |
| `search_instruments_by_type` | GET | `/trade-api-information-service/api/v1/instruments/by-type` |
| `get_candles` | GET | `/trade-api-market-data-connector/api/v1/candles-chart` |
| `get_trading_schedule` | GET | `/trade-api-information-service/api/v1/trading-schedule/daily-schedule` |
| `get_trading_status` | GET | `/trade-api-information-service/api/v1/trading-schedule/status` |
| `get_discounts` | GET | `/trade-api-bff-marginal-indicators/api/v1/instruments-discounts` |

## Токены и безопасность

- **Refresh-токен** живёт 90 суток. Получается в веб-версии БКС.
- **Access-токен** живёт 24 часа. Сервер обновляет его автоматически.
- Токены **не логируются** — только статус авторизации и scope.
- При удалении refresh-токена в веб-версии все access-токены аннулируются (для write-токенов — за несколько минут, для read — через 24 часа максимум).

## Коды ошибок API

| HTTP код | Код | Описание |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Ошибка валидации параметров |
| 400 | `BAD_REQUEST` | Неверный запрос |
| 401 | `UNAUTHORIZED` | Невалидный или истёкший токен |
| 404 | `NOT_FOUND` | Данные не найдены |
| 5xx | `INTERNAL_SERVER_ERROR` | Ошибка на стороне БКС |

## Примечания

- **WebSocket-стриминг** (стакан, котировки, обезличенные сделки, последняя свеча, маржинальные показатели) не реализован в текущей версии, т.к. MCP tools — синхронный request/response паттерн. Для стриминга рекомендуется использовать WebSocket API БКС напрямую.
- Все даты передаются в формате **ISO 8601** (пример: `2025-02-15T09:00:00Z`).
- Цены для **облигаций** указываются в процентах от номинала на Мосбирже.
- `classCode` (борд) можно найти в документации API Мосбиржи или через tool `search_instruments_by_ticker`.

## Лицензия

MIT
