# Travel Budget（Vercel + Supabase 上线版）

这是一个可部署到 **Vercel + Supabase** 的旅行预算工具示例项目。

当前项目包含：

- **前端**：Vue 3 + Vite
- **后端**：Node.js + Express
- **数据库**：Supabase PostgreSQL
- **部署方式**：
  - 前端部署到 **Vercel Static Build**
  - 后端 API 部署到 **Vercel Serverless Functions**
  - 数据库使用 **Supabase**

这份文档会同时告诉你：

1. 如何本地运行
2. 如何配置 Supabase
3. 如何部署到 Vercel
4. 需要配置哪些环境变量
5. 常见问题怎么排查

即使你是新手，也可以照着一步一步上线。

---

## 1. 项目结构

```text
.
├── api/
│   └── index.js                # Vercel Serverless 入口
├── docs/
│   ├── supabase-schema.sql     # Supabase 数据库建表 SQL
│   └── travelbudget-architecture.md
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── src/
├── src/
│   ├── app.js                  # Express app
│   ├── index.js                # 本地后端启动入口
│   ├── config/
│   ├── db/
│   ├── middlewares/
│   ├── routes/
│   └── services/
├── .env.example
├── package.json
├── vercel.json                 # Vercel 部署配置
└── README.md
```

---

## 2. 技术架构（部署后的工作方式）

上线后，整体工作方式如下：

- 用户访问 **Vercel 前端页面**
- 前端通过同域 `/api` 调用 **Vercel Serverless API**
- API 再连接 **Supabase PostgreSQL**
- 所有 trip / expense 数据都保存在 Supabase

也就是说：

- **页面托管在 Vercel**
- **接口运行在 Vercel**
- **数据库在 Supabase**

---

## 3. 运行前准备

你需要准备以下内容：

### 必装工具
1. **Node.js 18+**
2. **npm**
3. **Supabase 账号**
4. **Vercel 账号**

### 检查本地环境
执行：

```bash
node -v
npm -v
```

如果能看到版本号，说明 Node 环境正常。

---

## 4. 如何配置 Supabase

### 第一步：创建 Supabase 项目
1. 打开 [https://supabase.com](https://supabase.com)
2. 登录后点击 **New Project**
3. 填写项目名称、数据库密码、区域
4. 等待项目创建完成

### 第二步：拿到数据库连接串
进入：

- **Project Settings**
- **Database**

找到 PostgreSQL 连接串，格式类似：

```env
postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

这个值后面会写入：

- 本地后端 `.env`
- Vercel 项目的环境变量 `SUPABASE_DB_URL`

### 第三步：执行数据库建表 SQL
1. 打开 Supabase 控制台
2. 进入 **SQL Editor**
3. 新建查询
4. 把 `docs/supabase-schema.sql` 内容全部复制进去
5. 点击 **Run**

执行成功后，会创建：

- `trips`
- `expenses`
- `trip_members`

---

## 5. 本地运行指南

建议先本地跑通，再部署到线上。

### 5.1 启动后端

#### 第一步：进入项目目录
```bash
cd /workspace/travelbudget
```

#### 第二步：创建后端环境变量
```bash
cp .env.example .env
```

根目录 `.env.example` 内容如下：

```env
PORT=3000
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
```

你需要把它改成自己的真实值，例如：

```env
PORT=3000
SUPABASE_DB_URL=postgresql://postgres:your_real_password@db.abcd1234.supabase.co:5432/postgres
```

#### 第三步：安装依赖
```bash
npm install
```

#### 第四步：启动后端
开发模式：

```bash
npm run dev
```

普通模式：

```bash
npm run start
```

#### 第五步：检查后端是否正常
```bash
curl http://localhost:3000/health
```

如果返回：

```json
{"status":"ok"}
```

说明后端正常。

---

### 5.2 启动前端

#### 第一步：进入前端目录
```bash
cd /workspace/travelbudget/frontend
```

#### 第二步：创建前端环境变量
```bash
cp .env.example .env
```

前端 `.env.example` 默认内容：

```env
VITE_API_BASE_URL=/api
```

这里默认使用同域 `/api`，原因是：

- **线上部署到 Vercel 时最方便**
- **本地开发时由 Vite 代理到 `http://localhost:3000`**

也就是说，你本地前端访问 `/api` 时，Vite 会自动转发到后端。

#### 第三步：安装依赖
```bash
npm install
```

#### 第四步：启动前端
```bash
npm run dev
```

如果启动成功，终端通常会输出：

```bash
Local: http://localhost:5173/
```

然后浏览器打开：

```text
http://localhost:5173
```

---

## 6. 当前本地开发的工作原理

本地开发时：

- 前端运行在：`http://localhost:5173`
- 后端运行在：`http://localhost:3000`
- 前端请求 `/api` 时，Vite 会自动代理到 `http://localhost:3000`

这个代理配置已经写在：

- `frontend/vite.config.js`

所以本地开发时通常不需要手动改前端 API 地址。

---

## 7. 如何部署到 Vercel

### 7.1 把代码推到 Git 仓库
先把当前项目推到 GitHub / GitLab / Bitbucket。

例如：

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

---

### 7.2 在 Vercel 导入项目
1. 打开 [https://vercel.com](https://vercel.com)
2. 登录
3. 点击 **Add New Project**
4. 选择你的 Git 仓库
5. 导入项目

本仓库已经提供：

- `vercel.json`
- `api/index.js`

所以 Vercel 会按以下方式工作：

- `api/index.js` 作为 Serverless Function
- `frontend/` 作为静态前端构建目录

---

### 7.3 在 Vercel 配置环境变量
部署前，请在 Vercel 项目设置里配置：

#### 必填环境变量

```env
SUPABASE_DB_URL=postgresql://postgres:your_real_password@db.abcd1234.supabase.co:5432/postgres
```

#### 是否需要配置前端环境变量？
通常 **不需要额外配置**，因为前端默认就是：

```env
VITE_API_BASE_URL=/api
```

部署到 Vercel 后，前端会直接调用同域下的 `/api`。

---

### 7.4 点击 Deploy
环境变量填好后，点击部署。

部署成功后，你会拿到一个域名，例如：

```text
https://your-project.vercel.app
```

此时：

- 前端页面地址：`https://your-project.vercel.app`
- 后端健康检查：`https://your-project.vercel.app/api/health`（注意：当前 health 路由在 Express 中是 `/health`，而 Vercel API 入口是 `/api` 前缀，所以最终会暴露为 `/api/health`）

---

## 8. 上线后如何验证是否正常

### 检查前端页面
打开：

```text
https://your-project.vercel.app
```

如果页面能正常打开，说明前端构建成功。

### 检查后端接口
打开：

```text
https://your-project.vercel.app/api/health
```

如果返回：

```json
{"status":"ok"}
```

说明后端 Serverless API 工作正常。

### 检查数据库联通
在页面中：

1. 创建一个 trip
2. 添加一笔支出
3. 刷新页面后重新加载 trip
4. 确认预算数据仍然存在

如果存在，说明 Vercel API 与 Supabase 已成功联通。

---

## 9. 示例环境变量汇总

### 9.1 本地后端 `.env`

```env
PORT=3000
SUPABASE_DB_URL=postgresql://postgres:your_real_password@db.abcd1234.supabase.co:5432/postgres
```

### 9.2 本地前端 `frontend/.env`

```env
VITE_API_BASE_URL=/api
```

### 9.3 Vercel 环境变量

```env
SUPABASE_DB_URL=postgresql://postgres:your_real_password@db.abcd1234.supabase.co:5432/postgres
```

---

## 10. 常见问题说明

### 问题 1：Vercel 部署后页面能打开，但接口 500
**常见原因：**
- 没配置 `SUPABASE_DB_URL`
- 数据库连接串错误
- Supabase 表还没创建

**解决方法：**
1. 去 Vercel Project Settings → Environment Variables 检查 `SUPABASE_DB_URL`
2. 去 Supabase SQL Editor 执行 `docs/supabase-schema.sql`
3. 重新部署

---

### 问题 2：本地前端启动后，请求接口失败
**检查：**
1. 后端是否已启动
2. 前端 `.env` 是否为 `VITE_API_BASE_URL=/api`
3. `frontend/vite.config.js` 是否存在代理配置
4. `http://localhost:3000/health` 是否能访问

---

### 问题 3：前端启动报 `vite: not found`
**原因：** 前端依赖未安装。  
**解决：**

```bash
cd frontend
npm install
npm run dev
```

---

### 问题 4：后端启动时报 `Missing required environment variable: SUPABASE_DB_URL`
**原因：** 根目录没有 `.env` 或没有填值。  
**解决：**

```bash
cp .env.example .env
```

然后填写正确的数据库连接串。

---

### 问题 5：创建 trip / 添加支出时报 UUID 错误
当前接口要求这些字段必须是合法 UUID：

- `owner_id`
- `created_by`
- `paid_by`

可用一个测试 UUID：

```text
11111111-1111-4111-8111-111111111111
```

---

### 问题 6：为什么线上前端不用写完整 API 域名？
因为现在前端默认请求：

```env
VITE_API_BASE_URL=/api
```

这样有两个优点：

1. 本地开发可以走 Vite 代理
2. Vercel 线上可以直接走同域 API

所以这是一种更适合部署的写法。

---

## 11. 推荐上线顺序

如果你希望最稳妥地上线，建议按这个顺序：

1. 创建 Supabase 项目
2. 执行 `docs/supabase-schema.sql`
3. 本地配置 `.env`
4. 本地启动后端
5. 本地启动前端
6. 本地创建 trip / 添加支出，确认流程正常
7. 推送代码到 Git 仓库
8. 在 Vercel 导入项目
9. 在 Vercel 配置 `SUPABASE_DB_URL`
10. 点击 Deploy
11. 打开线上地址验证功能

---

## 12. 当前上线版支持的核心能力

当前项目已经支持：

- 创建预算 trip
- 添加支出
- 删除支出
- 编辑支出
- 实时显示剩余预算
- 实时显示已花费
- 实时显示预算使用百分比
- 计算剩余天数
- 计算今日建议花费
- 预算进度条显示
- 后端事务化预算扣减
- Vercel + Supabase 部署方式

如果你愿意，下一步还可以继续完善：

- Supabase Auth 登录
- 用户级权限控制
- 分类表外键化
- 多币种自动汇率
- 图表分析
- 多人协作
- 审计日志
