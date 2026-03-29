<template>
  <section class="page-stack">
    <div v-if="store.currentTrip" class="card">
      <h3 class="section-title">当前行程</h3>
      <p class="body-text">{{ store.currentTrip.name }}（{{ store.currentTrip.start_date }} ~ {{ store.currentTrip.end_date }}）</p>
    </div>

    <ExpenseForm
      v-if="store.currentTrip"
      :submit-success-version="submitSuccessVersion"
      :success-message="expenseSuccessMessage"
      @submit="handleAddExpense"
    />

    <div v-else class="card">
      <p class="body-text">请先选择行程再添加支出。</p>
      <RouterLink to="/trip"><button>去选择行程</button></RouterLink>
    </div>

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="expenseErrorMessage" class="helper-text text-danger">{{ expenseErrorMessage }}</p>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import ExpenseForm from '../components/ExpenseForm.vue';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const router = useRouter();
const authStore = useAuthStore();
const store = useBudgetStore();
const submitSuccessVersion = ref(0);
const expenseSuccessMessage = ref('');
const expenseErrorMessage = ref('');

async function handleAddExpense(payload) {
  if (!store.currentTrip) return;
  expenseErrorMessage.value = '';
  expenseSuccessMessage.value = '';
  try {
    await store.addExpenseAction(store.currentTrip.id, payload, authStore.user?.id);
    submitSuccessVersion.value += 1;
    expenseSuccessMessage.value = '操作成功';
    await router.push('/expense');
  } catch {
    expenseErrorMessage.value = '添加失败，请稍后重试';
  }
}
</script>
