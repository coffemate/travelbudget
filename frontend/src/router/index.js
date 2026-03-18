import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const HomeView = () => import('../views/HomeView.vue');
const BudgetView = () => import('../views/BudgetView.vue');
const LoginView = () => import('../views/Login.vue');
const RegisterView = () => import('../views/Register.vue');

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
  { path: '/budget', name: 'budget', component: BudgetView, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initialize();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'budget' };
  }

  return true;
});

export default router;
