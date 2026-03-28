import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { addExpense, createTrip, deleteExpense, getTrip, listExpenses, updateExpense } from '../api/trips';

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getStorageKey(userId) {
  return userId ? `travelbudget_trips_${userId}` : 'travelbudget_trips_guest';
}

export const useBudgetStore = defineStore('budget', () => {
  const loading = ref(false);
  const error = ref('');
  const currentTrip = ref(null);
  const trips = ref([]);
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

  function saveTripsToStorage(userId) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(trips.value));
  }

  function loadTripsFromStorage(userId) {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      trips.value = [];
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      trips.value = Array.isArray(parsed) ? parsed : [];
    } catch {
      trips.value = [];
    }
  }

  function upsertTrip(trip, userId) {
    const idx = trips.value.findIndex((t) => t.id === trip.id);
    if (idx === -1) {
      trips.value.unshift(trip);
    } else {
      trips.value[idx] = trip;
    }
    saveTripsToStorage(userId);
  }

  async function createTripAction(payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const trip = await createTrip(payload);
      currentTrip.value = trip;
      expenses.value = [];
      upsertTrip(trip, userId);
      return trip;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadTrip(tripId, userId) {
    loading.value = true;
    error.value = '';
    try {
      const [trip, expenseList] = await Promise.all([getTrip(tripId), listExpenses(tripId)]);
      currentTrip.value = trip;
      expenses.value = expenseList;
      upsertTrip(trip, userId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function selectTrip(tripId, userId) {
    await loadTrip(tripId, userId);
  }

  async function refreshExpenses(tripId) {
    expenses.value = await listExpenses(tripId);
  }

  async function addExpenseAction(tripId, payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const result = await addExpense(tripId, payload);
      currentTrip.value = result.trip;
      upsertTrip(result.trip, userId);
      await refreshExpenses(tripId);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExpenseAction(expenseId, payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const result = await updateExpense(expenseId, payload);
      currentTrip.value = result.trip;
      upsertTrip(result.trip, userId);
      await refreshExpenses(result.trip.id);
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExpenseAction(expenseId, userId) {
    loading.value = true;
    error.value = '';
    try {
      const result = await deleteExpense(expenseId);
      currentTrip.value = result.trip;
      upsertTrip(result.trip, userId);
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
    trips,
    expenses,
    totalBudget,
    remainingBudget,
    spentBudget,
    spentPercent,
    remainingDays,
    dailySuggestedBudget,
    loadTripsFromStorage,
    createTripAction,
    loadTrip,
    selectTrip,
    addExpenseAction,
    updateExpenseAction,
    deleteExpenseAction,
  };
});
