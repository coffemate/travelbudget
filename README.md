# Travel Budget Monorepo

## 目录结构

```txt
travel-budget/
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  └─ vite.config.ts
├─ worker/
│  ├─ src/
│  │  ├─ index.ts
│  │  ├─ auth/
│  │  ├─ routes/
│  │  ├─ lib/
│  │  └─ utils/
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ wrangler.toml
├─ package.json
└─ README.md
```

## 说明

- 本次仅进行目录结构重构（monorepo/workspaces）。
- Worker 业务逻辑、认证逻辑（Bearer token + Supabase Auth）、API 路径与 RLS 行为保持不变。

## 环境变量（Worker）

在 `worker` 的 Cloudflare 环境配置：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`（可选）

## 本地开发

在根目录执行：

```bash
npm install
npm run dev:frontend
npm run dev:worker
```

前端默认代理 `http://127.0.0.1:8787`（Wrangler dev 默认端口）。

## 部署

```bash
cd worker
npx wrangler deploy
```
