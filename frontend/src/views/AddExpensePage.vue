<template>
  <section class="page-stack">
    <div v-if="trip" class="card">
      <h3 class="section-title">{{ trip.name }}</h3>
      <p class="body-text">{{ trip.start_date }} ~ {{ trip.end_date }}</p>
    </div>

    <ExpenseForm
      v-if="trip"
      :submit-success-version="submitSuccessVersion"
      :success-message="expenseSuccessMessage"
      @submit="handleAddExpense"
    />

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="expenseErrorMessage" class="helper-text text-danger">{{ expenseErrorMessage }}</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExpenseForm from '../components/ExpenseForm.vue';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const store = useBudgetStore();
const trip = ref(null);
const tripId = route.params.tripId;
const submitSuccessVersion = ref(0);
const expenseSuccessMessage = ref('');
const expenseErrorMessage = ref('');

onMounted(async () => {
  const result = await store.loadTripWithExpenses(tripId, authStore.user?.id);
  trip.value = result.trip;
});

async function handleAddExpense(payload) {
  expenseErrorMessage.value = '';
  expenseSuccessMessage.value = '';
  try {
    await store.addExpenseAction(tripId, payload, authStore.user?.id);
    submitSuccessVersion.value += 1;
    expenseSuccessMessage.value = '操作成功';
    await router.push(`/trip/${tripId}`);
  } catch {
    expenseErrorMessage.value = '添加失败，请稍后重试';
  }
}
</script>
