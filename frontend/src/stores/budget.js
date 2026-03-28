import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { addExpense, createTrip, deleteExpense, getTrip, listExpenses, updateExpense } from '../api/trips';

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const useBudgetStore = defineStore('budget', () => {
  const loading = ref(false);
  const error = ref('');
  const currentTrip = ref(null);
  const expenses = ref([]);

  const totalBudget = computed(() => Number(currentTrip.value?.total_budget || 0));
  const remainingBudget = computed(() => Number(currentTrip.value?.remaining_budget || 0));
  const spentBudget = computed(() => Math.max(0, totalBudget.value - remainingBudget.value));
  const spentPercent = computed(() => {
    if (totalBudget.value <= 0) return 0;
    return Number(((spentBudget.value / totalBudget.value) * 100).toFixed(2));
  });

  const remainingDays = computed(() => {
    if (!currentTrip.value?.end_date) return 0;
    const today = startOfToday();
    const endDate = new Date(currentTrip.value.end_date);
    endDate.setHours(0, 0, 0, 0);
    const diffMs = endDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diffDays);
  });

  const dailySuggestedBudget = computed(() => {
    if (remainingDays.value <= 0) return remainingBudget.value;
    return Number((remainingBudget.value / remainingDays.value).toFixed(2));
  });

  async function createTripAction(payload) {
    loading.value = true;
    error.value = '';
    try {
      const trip = await createTrip(payload);
      currentTrip.value = trip;
      expenses.value = [];
      return trip;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadTrip(tripId) {
    loading.value = true;
    error.value = '';
    try {
      const [trip, expenseList] = await Promise.all([getTrip(tripId), listExpenses(tripId)]);
      currentTrip.value = trip;
      expenses.value = expenseList;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refreshExpenses(tripId) {
    expenses.value = await listExpenses(tripId);
  }

  async function addExpenseAction(tripId, payload) {
    loading.value = true;
    error.value = '';
    try {
      const result = await addExpense(tripId, payload);
      currentTrip.value = result.trip;
      await refreshExpenses(tripId);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExpenseAction(expenseId, payload) {
    loading.value = true;
    error.value = '';
    try {
      const result = await updateExpense(expenseId, payload);
      currentTrip.value = result.trip;
      await refreshExpenses(result.trip.id);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExpenseAction(expenseId) {
    loading.value = true;
    error.value = '';
    try {
      const result = await deleteExpense(expenseId);
      currentTrip.value = result.trip;
      await refreshExpenses(result.trip.id);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    currentTrip,
    expenses,
    totalBudget,
    remainingBudget,
    spentBudget,
    spentPercent,
    remainingDays,
    dailySuggestedBudget,
    createTripAction,
    loadTrip,
    addExpenseAction,
    updateExpenseAction,
    deleteExpenseAction,
  };
});
