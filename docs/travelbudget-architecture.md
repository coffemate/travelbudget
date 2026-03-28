# 旅行预算工具（减法预算）技术方案（Vue3 + Node + Supabase）

## 1. 项目整体架构

### 1.1 分层与边界
- **前端（Vue3 SPA）**：负责用户交互、预算展示、输入校验、乐观更新、图表可视化。
- **后端（Node API）**：负责业务规则执行（预算扣减、幂等、并发控制）、权限校验、聚合查询、审计日志写入。
- **数据与认证（Supabase）**：负责 PostgreSQL 存储、Auth 用户体系、Row Level Security（RLS）策略、实时订阅。

> 建议采用“**BFF + 数据平台**”模式：前端只调用 Node API，不直接写核心预算表；Node 作为唯一预算扣减入口，保证规则一致性。

### 1.2 模块拆分
- **Web App（Vue3）**
  - 预算总览页（总预算、剩余预算、已花费、预测）
  - 记账录入页（交通/住宿/餐饮等）
  - 规则与提醒页（超支提醒、日均建议）
  - 行程维度页（按城市/日期查看）
- **API 服务（Node）**
  - Auth 中间件（校验 Supabase JWT）
  - Budget Service（预算创建/更新/扣减）
  - Expense Service（新增/编辑/撤销消费）
  - Reporting Service（按类目、按日、按行程聚合）
- **Supabase**
  - 表：users/profile、trip、budget、expense、budget_ledger、category
  - 约束：外键、唯一键、check、触发器（可选）
  - 安全：RLS + JWT Claim

### 1.3 部署拓扑
- 前端：Vercel/Netlify
- Node API：Render/Railway/Fly.io
- Supabase：托管 PostgreSQL + Auth + Realtime
- 监控：Sentry（前后端）、OpenTelemetry + 日志平台

---

## 2. 技术栈说明（Vue3 + Node + Supabase 如何协作）

### 2.1 前端技术栈（Vue3）
- Vue3 + TypeScript + Vite
- Pinia（状态管理）
- Vue Router（多页面路由）
- UI：Element Plus / Naive UI（任选）
- 图表：ECharts

### 2.2 后端技术栈（Node）
- Node.js + TypeScript
- 框架：NestJS（更结构化）或 Fastify（轻量高性能）
- 校验：Zod / class-validator
- ORM/SQL：Prisma 或 Kysely（推荐 Kysely + 手写 SQL 处理事务）
- 鉴权：验证 Supabase JWT（JWKS）

### 2.3 Supabase 角色定位
- **Auth**：手机号/邮箱登录，签发 JWT。
- **Postgres**：主数据存储，事务一致性。
- **RLS**：保证用户只能访问自己的 trip/budget/expense。
- **Realtime**：预算变化后推送前端，支持多端同步。

### 2.4 协作方式（请求链路）
1. 用户登录（Supabase Auth）获取 access token。
2. 前端调用 Node API，并附带 Bearer token。
3. Node 验证 token 后执行业务事务。
4. Node 通过 Supabase/Postgres 客户端写入预算与流水。
5. Supabase Realtime 将变更推给前端，前端更新视图。

---

## 3. 核心数据流（预算如何扣减）

### 3.1 关键概念
- **总预算 total_budget**：出发前设定。
- **剩余预算 remaining_budget**：实时可花费额度。
- **消费 expense**：用户每笔支出。
- **预算流水 budget_ledger**：每次扣减/回滚的审计记录（不可删改）。

### 3.2 扣减主流程（新增消费）
1. 前端提交 `POST /trips/:tripId/expenses`（金额、币种、类目、日期、备注、幂等键）。
2. Node 开启数据库事务。
3. 校验 trip 归属、预算状态、输入金额合法。
4. 锁定预算行（`SELECT ... FOR UPDATE`）。
5. 判断 `remaining_budget - amount >= 0`（若允许超支则记录 `overspent=true`）。
6. 写入 expense。
7. 更新 budget：`remaining_budget = remaining_budget - amount`。
8. 写入 budget_ledger（type=DEBIT，before/after/expense_id）。
9. 提交事务并返回最新预算快照。

### 3.3 逆向流程（编辑/删除消费）
- 删除消费：反向记一笔 CREDIT 流水并回加剩余额度。
- 编辑消费：执行“先回滚旧金额，再扣减新金额”的原子事务。
- 所有操作都保留审计痕迹，避免直接覆盖历史。

### 3.4 一致性与幂等
- 每次写操作需携带 `idempotency_key`，服务端加唯一索引，防止重复扣款。
- 并发冲突用数据库行级锁 + 事务隔离处理。
- 预算展示优先读 budget 快照；报表可异步聚合。

---

## 4. 关键功能拆解

### 4.1 MVP（必须先做）
1. 用户登录与身份体系（Auth）
2. 创建旅行与设置总预算
3. 记录消费并实时扣减剩余预算
4. 消费列表与按类目汇总
5. 超支提醒（阈值 80%/100%）

### 4.2 V1 增强
1. 多币种支持（基准币 + 汇率快照）
2. 日均预算建议（剩余预算 / 剩余天数）
3. 行程拆分（城市/日期维度）
4. 消费模板（常用项一键录入）

### 4.3 V2 进阶
1. AI 预算建议（按历史行程估算）
2. 协作记账（多人同一 trip）
3. 导出与对账（CSV/Excel）

---

## 5. 可能的难点与解决方案

### 5.1 并发导致预算不准确
- **难点**：多端同时记账可能出现“超扣”。
- **方案**：所有扣减必须走单事务 + 行锁；禁止前端直写预算表。

### 5.2 重复提交导致重复扣减
- **难点**：网络重试或用户连点。
- **方案**：幂等键 + 唯一索引 + 返回首次结果。

### 5.3 汇率波动造成统计失真
- **难点**：多币种时历史数据会漂移。
- **方案**：每笔消费写入“发生时汇率快照”，报表按快照折算。

### 5.4 RLS 与后端服务权限冲突
- **难点**：Node 服务写库与用户隔离策略兼容。
- **方案**：
  - 用户查询走 RLS；
  - 服务写操作走 service role，但在业务层强制 owner 校验；
  - 高风险接口加审计日志。

### 5.5 报表性能
- **难点**：明细增多后聚合慢。
- **方案**：
  - 建索引（trip_id, created_at, category_id）；
  - 热门报表做物化视图或增量汇总表；
  - 前后端分页与时间范围过滤。

---

## 6. 推荐开发顺序（非常重要）

### Phase 0：设计与基建（1~2 天）
1. 画 ER 图与状态流（trip/budget/expense/ledger）。
2. 定义 API 合约（OpenAPI）。
3. 搭建仓库规范（lint/test/commit hooks/CI）。

### Phase 1：数据与安全先行（2~3 天）
1. 建 Supabase 表结构、索引、约束、RLS。
2. 完成登录鉴权链路（前端拿 token，后端验 token）。
3. 打通最小可用健康接口。

### Phase 2：预算扣减核心（3~5 天）
1. 实现“新增消费 -> 扣减预算 -> 记流水”事务。
2. 实现编辑/删除消费的反向流水。
3. 实现幂等机制与并发测试（重点）。

### Phase 3：前端 MVP 页面（3~5 天）
1. 预算总览卡片 + 消费录入。
2. 消费列表与筛选。
3. 超支提醒与基础图表。

### Phase 4：质量与可观测性（2~3 天）
1. 单元测试（预算服务、汇率换算）。
2. 集成测试（事务一致性、权限）。
3. 错误追踪与审计日志看板。

### Phase 5：增强能力（持续迭代）
1. 多币种与汇率快照。
2. Realtime 多端同步。
3. 导出、协作、智能建议。

---

## 附：建议的最小数据模型
- `trips(id, owner_id, name, start_date, end_date, base_currency)`
- `budgets(id, trip_id, total_amount, remaining_amount, version, updated_at)`
- `expenses(id, trip_id, amount, currency, fx_rate, category_id, spent_at, note, created_by, idempotency_key)`
- `budget_ledger(id, trip_id, budget_id, expense_id, type, amount, before_amount, after_amount, created_at)`
- `categories(id, owner_id, name, type)`

> 关键原则：**预算不是算出来的展示字段，而是被事务维护的核心状态**；同时通过 ledger 保证可追溯与可回放。
