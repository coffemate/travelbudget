# Travel Budget

一个基于 **Vue + Cloudflare Workers + Supabase(Auth + RLS)** 的旅行预算管理项目。  
本 README 面向第一次接触该项目的新同学，按文档执行可从零完成本地运行与线上部署。

---

## 1. 项目介绍

### 1.1 功能简介

Travel Budget 用于管理一次旅行中的预算与支出，核心能力包括：

- 用户注册/登录（Supabase Auth）
- 创建与维护旅行（Trip）
- 在旅行下新增、查询、编辑、删除支出（Expense）
- 通过 RLS（Row Level Security）确保用户只能访问自己的数据

### 1.2 技术架构图

```text
用户浏览器
  ↓
Cloudflare Pages (前端静态站点)
  ↓  /api/*
Cloudflare Worker (后端 API)
  ↓
Supabase (PostgreSQL + Auth + RLS)
```

本地开发链路：

```text
浏览器 (http://127.0.0.1:5173)
  ↓
Vite Dev Server
  ↓  proxy /api/*
Cloudflare Worker Local (http://localhost:8787)
  ↓
Supabase
```

---

## 2. 环境要求

请先安装并确认以下工具可用：

- **Node.js**: 建议 `>= 20.x`（推荐 LTS）
- **npm**: 建议 `>= 10.x`
- **Git**: 任意近两年版本均可
- **Cloudflare 账号**: 用于 Worker/Pages 部署
- **Supabase 账号**: 用于数据库与认证

检查命令：

```bash
node -v
npm -v
git --version
```

---

## 3. 克隆项目

> 将 `<your-repo-url>` 替换为你的仓库地址。

```bash
git clone <your-repo-url>
cd travel-budget
```

如果你的目录名不是 `travel-budget`，请以实际目录名为准。

---

## 4. 安装依赖（必须按顺序执行）

### 4.1 根目录安装

```bash
npm install
```

作用：

- 安装 monorepo/workspaces 依赖关系
- 使 `npm run dev:frontend`、`npm run dev:worker` 可在根目录直接使用

### 4.2 安装 frontend 依赖

```bash
cd frontend
npm install
cd ..
```

作用：

- 安装 Vue/Vite/Axios/Supabase JS 等前端依赖

### 4.3 安装 worker 依赖

```bash
cd worker
npm install
cd ..
```

作用：

- 安装 Wrangler、Supabase JS、Worker 类型等后端依赖

> 虽然根目录已使用 workspaces，仍建议首次按上面三步执行，避免某些本地环境下子包依赖缺失。

---

## 5. Supabase 配置（从零）

### 5.1 创建 Supabase 项目

1. 登录 Supabase Dashboard
2. 点击 **New Project**
3. 选择组织、输入项目名、数据库密码、Region
4. 等待项目创建完成

### 5.2 获取关键配置

在 Supabase Dashboard 中进入：

- **Settings → API**

获取以下值：

1. **Project URL**
   - 用途：前后端连接 Supabase 的基础地址
2. **anon public key**（anon key）
   - 用途：前端与 Worker 以匿名 key 初始化 Supabase client
3. **JWT Secret**（可选但建议）
   - 用途：Worker 本地校验 token（`SUPABASE_JWT_SECRET`）

---

## 6. 前端环境变量配置

### 6.1 开发环境：`frontend/.env.development`

创建文件并写入：

```bash
cat > frontend/.env.development << 'EOF'
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8787
EOF
```

变量说明：

- `VITE_SUPABASE_URL`：前端 Supabase 项目地址
- `VITE_SUPABASE_ANON_KEY`：前端 Supabase 公钥
- `VITE_API_URL=/api`：前端所有 API 走相对路径，交给 Vite proxy
- `VITE_API_PROXY_TARGET`：本地代理目标（Worker 本地端口）

### 6.2 生产环境：`frontend/.env.production`

创建文件并写入：

```bash
cat > frontend/.env.production << 'EOF'
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_API_URL=https://your-worker.workers.dev
EOF
```

变量说明：

- `VITE_API_URL`：线上前端直接访问线上 Worker 域名

---

## 7. Worker 环境变量配置

### 7.1 本地开发变量：`worker/.dev.vars`

创建文件：

```bash
cat > worker/.dev.vars << 'EOF'
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_JWT_SECRET=<your-jwt-secret>
EOF
```

### 7.2 重要格式要求

不要加引号：

错误示例：

```env
SUPABASE_URL="https://xxx.supabase.co"
```

正确示例：

```env
SUPABASE_URL=https://xxx.supabase.co
```

> `.dev.vars` 仅用于本地 wrangler dev；线上变量在 Cloudflare 控制台配置（见第 13 节）。

---

## 8. Cloudflare 本地开发（Worker）

### 8.1 安装 Wrangler

```bash
npm install -g wrangler
```

### 8.2 登录 Cloudflare

```bash
wrangler login
```

浏览器会打开授权页面，完成授权即可。

### 8.3 启动 Worker

```bash
cd worker
npm run dev
```

或：

```bash
cd worker
npx wrangler dev
```

默认端口：`8787`

---

## 9. 启动前端

```bash
cd frontend
npm run dev
```

默认端口：`5173`（通常访问 `http://127.0.0.1:5173`）

请求流说明：

```text
浏览器
  ↓ /api/*
Vite
  ↓ proxy
Worker(local:8787)
```

---

## 10. Vite 代理配置说明

项目当前 `frontend/vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

为什么前端使用 `/api` 而不是硬编码 `http://localhost:8787`：

1. 避免浏览器跨域（CORS）问题
2. 本地与线上调用方式统一（调用路径不变）
3. 业务代码中不需要关心端口和环境差异

---

## 11. 数据库初始化（Supabase SQL）

### 11.1 SQL 脚本位置

- `docs/supabase-schema.sql`

脚本包含：

- `trips` 表
- `expenses` 表
- `trip_members` 表（扩展用）
- `updated_at` trigger
- RLS skeleton 注释模板

### 11.2 执行步骤

1. 打开 Supabase Dashboard
2. 进入 **SQL Editor**
3. 新建 Query
4. 粘贴 `docs/supabase-schema.sql` 全部内容
5. 点击 **Run** 执行

### 11.3 RLS 策略

当前脚本里 RLS 是 skeleton（注释示例）。你需要在 SQL Editor 中根据业务要求启用并创建策略：

- `alter table ... enable row level security;`
- `create policy ...`

> 若不启用正确策略，可能出现 401/403 或查询为空。

---

## 12. 本地运行检查清单

启动后，请逐项确认：

- [ ] Worker 启动成功（终端出现 wrangler 监听日志）
- [ ] 前端启动成功（Vite 输出本地访问地址）
- [ ] 能注册/登录成功
- [ ] `GET /api/trips` 返回正常
- [ ] expenses 相关接口可正常新增/查询/编辑/删除
- [ ] 浏览器 Network 中无持续 401
- [ ] 浏览器 Network 中无持续 500

建议额外检查：

- 在 Network 里确认请求 URL 为 `http://127.0.0.1:5173/api/...`（而不是旧 Node 地址）

---

## 13. Cloudflare Worker 部署（后端）

### 13.1 部署命令

```bash
cd worker
wrangler deploy
```

### 13.2 部署后查看位置

Cloudflare 控制台：

- **Workers & Pages**
- 选择你的 Worker（例如 `travelbudget-api`）
- 查看 `*.workers.dev` 域名

> 将该域名写入前端生产变量 `VITE_API_URL`。

---

## 14. Cloudflare Pages 部署前端

### 14.1 创建 Pages 项目

1. 进入 Cloudflare 控制台
2. 打开 **Workers & Pages**
3. 点击 **Create application** → **Pages**
4. 连接 GitHub 仓库

### 14.2 构建配置

填写：

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `frontend`

### 14.3 配置前端环境变量（Pages）

至少配置：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`（例：`https://your-worker.workers.dev`）

### 14.4 部署

点击 **Save and Deploy**，等待构建完成。

---

## 15. Cloudflare 线上环境变量配置（Worker + Pages）

配置入口：

- **Workers & Pages → 对应项目 → Settings → Variables and Secrets**

### 15.1 Worker 变量（后端）

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`

### 15.2 Pages 变量（前端）

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

> 注意区分：`SUPABASE_*` 给 Worker，`VITE_*` 给前端构建。

---

## 16. 常见错误排查

### 16.1 `Missing SUPABASE_URL or SUPABASE_ANON_KEY`

原因：

- Worker 环境变量未配置，或 `.dev.vars` 写错

解决：

1. 检查 `worker/.dev.vars`
2. 确认变量名拼写完全一致
3. 重新启动 `wrangler dev`

### 16.2 `Invalid supabaseUrl`

原因：

- `VITE_SUPABASE_URL` 值为空或格式不合法

解决：

1. 检查 `frontend/.env.development` / `.env.production`
2. 必须是 `https://<project-ref>.supabase.co` 完整 URL
3. 修改后重启前端

### 16.3 `401 Unauthorized`

原因：

- 前端未带 `Authorization: Bearer <token>`
- token 过期
- Worker 端 `SUPABASE_JWT_SECRET` 与项目不匹配（如启用本地 JWT 校验）

解决：

1. 浏览器 Network 检查请求头是否有 Authorization
2. 前端重新登录刷新 session
3. 核对 Worker 环境变量

### 16.4 `500 Internal Server Error`

原因：

- Worker 内部异常（环境变量缺失、Supabase 请求异常、RLS策略问题、数据格式问题）

解决：

1. 在 `worker` 目录运行 `npm run dev`
2. 复现请求
3. 查看 wrangler 控制台日志与堆栈
4. 对照对应 route/auth/lib 文件定位

### 16.5 CORS 问题

原因：

- 本地未走 Vite 代理（直接请求了错误域名）
- `VITE_API_URL` 不是 `/api`

解决：

1. 开发环境确保 `VITE_API_URL=/api`
2. 检查 `frontend/vite.config.ts` 中 `/api` 代理是否指向 `http://localhost:8787`
3. 重启前端

---

## 17. 项目目录说明

```text
travel-budget/
├─ frontend/                 # Vue + Vite 前端
│  ├─ src/
│  │  ├─ api/               # Axios 封装与 API 调用函数
│  │  ├─ stores/            # Pinia 状态管理
│  │  ├─ views/             # 页面组件
│  │  ├─ router/            # 路由
│  │  └─ lib/               # Supabase 前端初始化
│  ├─ .env.development      # 前端开发环境变量
│  ├─ .env.production       # 前端生产环境变量
│  └─ vite.config.ts        # Vite 与 /api 代理配置
│
├─ worker/                   # Cloudflare Worker 后端
│  ├─ src/
│  │  ├─ index.ts           # Worker 入口与路由分发
│  │  ├─ auth/              # 认证逻辑（Bearer + Supabase Auth）
│  │  ├─ routes/            # trips / expenses API 处理
│  │  ├─ lib/               # Supabase server client 构造
│  │  ├─ utils/             # HTTP 响应工具
│  │  └─ types.ts           # Worker 环境类型定义
│  ├─ wrangler.toml         # Worker 配置
│  └─ package.json
│
├─ docs/
│  └─ supabase-schema.sql    # 数据库初始化脚本
│
└─ package.json              # monorepo/workspaces 脚本入口
```

---

## 18. 常用命令速查

### 根目录

```bash
npm install
npm run dev:frontend
npm run dev:worker
```

### 前端

```bash
cd frontend
npm run dev
npm run build
```

### Worker

```bash
cd worker
npm run dev
npm run deploy
```

---

## 19. 新人上手最短路径（建议）

1. 克隆仓库
2. 安装根目录 + frontend + worker 依赖
3. 创建 Supabase 项目并拿到 URL/anon key/JWT secret
4. 填好 `frontend/.env.development`
5. 填好 `worker/.dev.vars`
6. 执行数据库 SQL 脚本
7. 启动 worker（8787）
8. 启动前端（5173）
9. 注册登录并测试 trips/expenses
10. 再进行线上 deploy

完成以上步骤后，你将得到一个完整可运行的本地开发环境和可部署的生产流程。
