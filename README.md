# TravelBudget API (Cloudflare Workers)

## 新目录结构

```txt
src/
  index.ts
  types.ts
  auth/
    requireAuth.ts
  routes/
    trips.ts
    expenses.ts
  lib/
    supabase.ts
  utils/
    http.ts
wrangler.toml
tsconfig.json
package.json
```

## 迁移说明

- 已从 Node.js + Express 迁移到 Cloudflare Workers `fetch(Request)` 入口。
- API 路径保持兼容：
  - `/health`
  - `/api/trips`
  - `/api/expenses`
- 前端仍使用 Supabase Auth 登录，并继续发送 `Authorization: Bearer <access_token>`。
- Worker 中 `requireAuth` 会先本地验 JWT（`jose` + JWKS/可选 shared secret），失败再回退 `supabase.auth.getUser(token)`。
- 业务查询使用 **用户 token + anon key** 创建 Supabase Client，避免 service role，确保 RLS 生效。

## 环境变量

在 Cloudflare Worker 环境中配置：

- `SUPABASE_URL`：Supabase 项目 URL
- `SUPABASE_ANON_KEY`：Supabase anon key
- `SUPABASE_JWT_SECRET`：可选。配置后优先本地 HMAC 验签（提升鉴权性能）

## 本地开发

```bash
npm install
npm run dev
```

## 部署

```bash
npm run deploy
```
