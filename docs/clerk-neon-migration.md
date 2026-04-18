# Supabase -> Neon + Clerk 迁移说明

## 1) 数据库层（pg + Neon）

后端统一使用 `pg` 连接 Neon：

```js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

## 2) 后端 Clerk 鉴权接入

在业务鉴权中间件中统一读取用户（Bearer JWT）：

```js
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.slice(7);
  const payload = await verifyClerkJwt(token);
  const userId = payload.sub;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  req.user = { id: userId };
  return next();
}
```

## 3) 前端 Clerk 接入

前端通过 Clerk Browser SDK（CDN）初始化并管理 session：

```js
await loadClerkScript();
const clerk = new window.Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
await clerk.load();
```

请求 API 时自动附加 Clerk token：

```js
const token = await clerk.session?.getToken();
config.headers.Authorization = `Bearer ${token}`;
```

## 4) Expenses CRUD（参数化 SQL）

### Create
```sql
INSERT INTO public.expenses
(trip_id, created_by, paid_by, amount, currency, fx_rate_to_base, amount_in_base, category, spent_at, note, idempotency_key)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;
```

### Read
```sql
SELECT * FROM public.expenses
WHERE trip_id = $1 AND is_voided = false
ORDER BY spent_at DESC, created_at DESC;
```

### Update
```sql
UPDATE public.expenses
SET amount = $1, currency = $2, fx_rate_to_base = $3, amount_in_base = $4,
    category = $5, spent_at = $6, note = $7, paid_by = $8
WHERE id = $9
RETURNING *;
```

### Delete（软删除）
```sql
UPDATE public.expenses
SET is_voided = true, voided_at = now()
WHERE id = $1;
```

## 5) 替换点总结

- 删除 Supabase 依赖与 client 初始化（前后端）。
- 环境变量从 `SUPABASE_*` 切换到 `DATABASE_URL` + `CLERK_*`。
- 鉴权用户来源从 `supabase.auth.getUser(token)` 改为 Clerk JWT 校验后的 `payload.sub`。
- 数据库 schema 去除 `auth.users` 外键依赖，改用 Clerk `userId`（text）。
- 所有业务查询继续参数化，且按当前用户隔离数据。
