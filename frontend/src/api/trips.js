import http from './http';

export function createTrip(payload) {
  return http.post('/trips', payload).then((r) => r.data);
}

export function getTrip(tripId) {
  return http.get(`/trips/${tripId}`).then((r) => r.data);
}

export function addExpense(tripId, payload) {
  return http.post(`/trips/${tripId}/expenses`, payload).then((r) => r.data);
}

export function listExpenses(tripId) {
  return http.get(`/trips/${tripId}/expenses`).then((r) => r.data);
}

export function updateExpense(expenseId, payload) {
  return http.patch(`/expenses/${expenseId}`, payload).then((r) => r.data);
}

export function deleteExpense(expenseId) {
  return http.delete(`/expenses/${expenseId}`).then((r) => r.data);
}
