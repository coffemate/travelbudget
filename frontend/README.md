# Travel Budget Frontend (Vue3 + Vite)

## 1) 目录结构

```text
frontend
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── src
    ├── api
    │   ├── http.js
    │   └── trips.js
    ├── assets
    │   └── base.css
    ├── components
    │   ├── ExpenseForm.vue
    │   └── TripForm.vue
    ├── router
    │   └── index.js
    ├── stores
    │   └── budget.js
    ├── views
    │   ├── BudgetView.vue
    │   └── HomeView.vue
    ├── App.vue
    └── main.js
```

## 2) 路由设计

- `/` 首页（HomeView）
- `/budget` 预算页（BudgetView）

## 3) 状态管理（Pinia）

- `stores/budget.js`：管理当前 trip、expenses、loading、error
- 封装动作：创建旅行、加载旅行、添加/修改/删除支出

## 4) API 封装（axios）

- `api/http.js`：统一 baseURL、超时、错误拦截
- `api/trips.js`：按业务拆分请求方法

## 5) 启动

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

默认请求后端地址：`VITE_API_BASE_URL=http://localhost:3000/api`
