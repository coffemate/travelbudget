import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const TripListPage = () => import('../views/TripListPage.vue');
const CreateTripPage = () => import('../views/CreateTripPage.vue');
const ExpensePage = () => import('../views/ExpensePage.vue');
const AddExpensePage = () => import('../views/AddExpensePage.vue');
const LoginView = () => import('../views/Login.vue');
const RegisterView = () => import('../views/Register.vue');

const routes = [
  { path: '/', redirect: '/trip' },
  { path: '/trip', name: 'trip-list', component: TripListPage, meta: { requiresAuth: true } },
  { path: '/trip/create', name: 'trip-create', component: CreateTripPage, meta: { requiresAuth: true } },
  { path: '/trip/:tripId', name: 'trip-expense', component: ExpensePage, meta: { requiresAuth: true } },
  { path: '/trip/:tripId/add', name: 'trip-expense-add', component: AddExpensePage, meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const budgetStore = useBudgetStore();
  await authStore.initialize();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'trip-list' };
  }

  if (authStore.isAuthenticated) {
    budgetStore.loadTripsFromStorage(authStore.user?.id);
  }

  return true;
});

export default router;
