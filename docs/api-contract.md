# TravelBudget API 接口契约清单（v1）

> Base URL: `/api`
>
> 鉴权：除 `/health` 外均需 `Authorization: Bearer <clerk_jwt>`。

## 统一约定

- `Content-Type: application/json`
- 路径参数 `tripId`、`expenseId` 必须是 UUID。
- 错误响应格式：

```json
{
  "message": "error message"
}
```

---

## Health

### GET `/health`
- 说明：服务健康检查
- 响应：

```json
{
  "status": "ok"
}
```

---

## Trips

### POST `/trips`
- 说明：创建行程
- 请求体：

```json
{
  "name": "Tokyo Trip",
  "description": "optional",
  "start_date": "2026-04-01",
  "end_date": "2026-04-10",
  "base_currency": "JPY",
  "total_budget": 100000
}
```

- 必填字段：`name`, `start_date`, `end_date`, `base_currency`, `total_budget`
- 响应：`Trip`

### GET `/trips/:tripId`
- 说明：获取单个行程
- 响应：`Trip`

### PUT `/trips/:tripId`
- 说明：更新行程（当前支持名称与总预算）
- 请求体：

```json
{
  "name": "Tokyo Trip Updated",
  "total_budget": 120000
}
```

- 必填字段：`name`, `total_budget`
- 响应：`Trip`

### DELETE `/trips/:tripId`
- 说明：删除行程
- 响应：

```json
{
  "success": true
}
```

### POST `/trips/:tripId/expenses`
- 说明：新增支出
- 请求体：

```json
{
  "amount": 300,
  "currency": "USD",
  "fx_rate_to_base": 7.2,
  "category": "food",
  "spent_at": "2026-04-02T12:30:00.000Z",
  "note": "optional",
  "paid_by": "optional-user-uuid",
  "idempotency_key": "client-generated-unique-key"
}
```

- 必填字段：`amount`, `currency`, `fx_rate_to_base`, `category`, `spent_at`, `idempotency_key`
- 响应：

```json
{
  "expense": { "...": "Expense" },
  "trip": { "...": "Trip" },
  "deduced": true
}
```

### GET `/trips/:tripId/expenses`
- 说明：查询行程支出列表
- 响应：`Expense[]`

---

## Expenses

### PATCH `/expenses/:expenseId`
- 说明：更新支出
- 请求体：

```json
{
  "amount": 260,
  "currency": "USD",
  "fx_rate_to_base": 7.2,
  "category": "transport",
  "spent_at": "2026-04-02T15:00:00.000Z",
  "note": "optional",
  "paid_by": "optional-user-uuid"
}
```

- 必填字段：`amount`, `currency`, `fx_rate_to_base`, `category`, `spent_at`
- 响应：

```json
{
  "expense": { "...": "Expense" },
  "trip": { "...": "Trip" }
}
```

### DELETE `/expenses/:expenseId`
- 说明：删除（软删除）支出，并返还预算
- 响应：

```json
{
  "success": true,
  "trip": { "...": "Trip" }
}
```

---

## 数据结构

### Trip

```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "string",
  "description": "string | null",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "base_currency": "CNY",
  "total_budget": "number",
  "remaining_budget": "number",
  "created_at": "timestamp"
}
```

### Expense

```json
{
  "id": "uuid",
  "trip_id": "uuid",
  "created_by": "uuid",
  "paid_by": "uuid | null",
  "amount": "number",
  "currency": "string(3)",
  "fx_rate_to_base": "number",
  "amount_in_base": "number",
  "category": "string",
  "spent_at": "timestamp",
  "note": "string | null",
  "idempotency_key": "string",
  "is_voided": "boolean",
  "created_at": "timestamp"
}
```
