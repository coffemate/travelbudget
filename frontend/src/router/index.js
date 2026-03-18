import { createRouter, createWebHistory } from 'vue-router';

const HomeView = () => import('../views/HomeView.vue');
const BudgetView = () => import('../views/BudgetView.vue');

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/budget', name: 'budget', component: BudgetView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
