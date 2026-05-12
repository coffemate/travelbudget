import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  addExpense,
  createTrip,
  deleteExpense,
  deleteTrip,
  getTrip,
  listExpenses,
  updateExpense,
  updateTrip,
} from '../api/trips';

function getStorageKey(userId) {
  return userId ? `travelbudget_trips_${userId}` : 'travelbudget_trips_guest';
}

export const useBudgetStore = defineStore('budget', () => {
  const loading = ref(false);
  const error = ref('');
  const trips = ref([]);

  function saveTripsToStorage(userId) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(trips.value));
  }

  function loadTripsFromStorage(userId) {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      trips.value = Array.isArray(parsed) ? parsed : [];
    } catch {
      trips.value = [];
    }
  }

  function upsertTrip(trip, userId) {
    const idx = trips.value.findIndex((t) => t.id === trip.id);
    if (idx === -1) trips.value.unshift(trip);
    else trips.value[idx] = trip;
    saveTripsToStorage(userId);
  }

  async function createTripAction(payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const trip = await createTrip(payload);
      upsertTrip(trip, userId);
      return trip;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadTripWithExpenses(tripId, userId) {
    loading.value = true;
    error.value = '';
    try {
      const [trip, expenses] = await Promise.all([getTrip(tripId), listExpenses(tripId)]);
      upsertTrip(trip, userId);
      return { trip, expenses };
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateTripAction(tripId, payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const trip = await updateTrip(tripId, payload);
      upsertTrip(trip, userId);
      return trip;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteTripAction(tripId, userId) {
    loading.value = true;
    error.value = '';
    try {
      await deleteTrip(tripId);
      trips.value = trips.value.filter((t) => t.id !== tripId);
      saveTripsToStorage(userId);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addExpenseAction(tripId, payload, userId) {
    loading.value = true;
    error.value = '';
    try {
      const result = await addExpense(tripId, payload);
      upsertTrip(result.trip, userId);
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
      upsertTrip(result.trip, userId);
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
      upsertTrip(result.trip, userId);
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
    trips,
    loadTripsFromStorage,
    createTripAction,
    loadTripWithExpenses,
    updateTripAction,
    deleteTripAction,
    addExpenseAction,
    updateExpenseAction,
    deleteExpenseAction,
  };
});
