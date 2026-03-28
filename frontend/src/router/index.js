import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const TripPage = () => import('../views/TripPage.vue');
const ExpensePage = () => import('../views/ExpensePage.vue');
const LoginView = () => import('../views/Login.vue');
const RegisterView = () => import('../views/Register.vue');

const routes = [
  { path: '/', redirect: '/expense' },
  { path: '/trip', name: 'trip', component: TripPage, meta: { requiresAuth: true } },
  { path: '/expense', name: 'expense', component: ExpensePage, meta: { requiresAuth: true } },
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
    return { name: 'expense' };
  }

  return true;
});

export default router;
