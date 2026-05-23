import http from './http';

function unwrapApiPayload(payload) {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (payload.success === false) throw new Error(payload.error || payload.message || '请求失败');
    return payload.data;
  }
  return payload;
}

export function listTrips() {
  return http.get('/trips').then((r) => unwrapApiPayload(r.data));
}

export function createTrip(payload) {
  return http.post('/trips', payload).then((r) => unwrapApiPayload(r.data));
}

export function getTrip(tripId) {
  return http.get(`/trips/${tripId}`).then((r) => unwrapApiPayload(r.data));
}

export function updateTrip(tripId, payload) {
  return http.put(`/trips/${tripId}`, payload).then((r) => unwrapApiPayload(r.data));
}

export function deleteTrip(tripId) {
  return http.delete(`/trips/${tripId}`).then((r) => unwrapApiPayload(r.data));
}

export function addExpense(tripId, payload) {
  return http.post(`/trips/${tripId}/expenses`, payload).then((r) => unwrapApiPayload(r.data));
}

export function listExpenses(tripId) {
  return http.get(`/trips/${tripId}/expenses`).then((r) => unwrapApiPayload(r.data));
}

export function updateExpense(expenseId, payload) {
  return http.patch(`/expenses/${expenseId}`, payload).then((r) => unwrapApiPayload(r.data));
}

export function deleteExpense(expenseId) {
  return http.delete(`/expenses/${expenseId}`).then((r) => unwrapApiPayload(r.data));
}
