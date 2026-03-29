<template>
  <section class="row" style="flex-direction: column;">
    <div v-if="store.currentTrip" class="card">
      <h3>预算概览（实时）</h3>
      <p style="font-size: 30px; font-weight: 700; margin: 8px 0; color: #0f766e;">
        剩余金额：{{ store.remainingBudget }}
      </p>
      <div class="row" style="justify-content: space-between;">
        <p>已花费：{{ store.spentBudget }}</p>
        <p>已用百分比：{{ store.spentPercent }}%</p>
      </div>
      <div class="row" style="justify-content: space-between;">
        <p>剩余天数：{{ store.remainingDays }}</p>
        <p>今日建议花费：{{ store.dailySuggestedBudget }}</p>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${Math.min(store.spentPercent, 100)}%` }"></div>
      </div>
    </div>

    <TripForm @submit="handleCreateTrip" />

    <div class="card">
      <h3>加载旅行</h3>
      <div class="row">
        <input v-model="tripIdInput" placeholder="输入 tripId" />
        <button @click="handleLoadTrip">加载</button>
      </div>
    </div>

    <ExpenseForm v-if="store.currentTrip" @submit="handleAddExpense" />

    <div v-if="store.currentTrip" class="card">
      <h3>支出列表</h3>
      <p v-if="store.expenses.length === 0">暂无支出</p>
      <ul v-else class="expense-list">
        <li v-for="item in store.expenses" :key="item.id" class="expense-item">
          <template v-if="editingId === item.id">
            <div class="row">
              <input v-model.number="editForm.amount" type="number" min="0.01" step="0.01" placeholder="amount" />
              <input v-model="editForm.currency" maxlength="3" placeholder="currency" />
              <input v-model.number="editForm.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="fx rate" />
            </div>
            <div class="row">
              <input v-model="editForm.category" placeholder="category" />
              <input v-model="editForm.spent_at" type="datetime-local" />
            </div>
            <input v-model="editForm.note" placeholder="note" />
            <div class="row" style="margin-top: 8px;">
              <button @click="handleSaveEdit(item.id)">保存</button>
              <button type="button" class="secondary-btn" @click="cancelEdit">取消</button>
            </div>
          </template>

          <template v-else>
            <div>
              {{ item.category }} | {{ item.amount }} {{ item.currency }} | base {{ item.amount_in_base }}
            </div>
            <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
              {{ formatDate(item.spent_at) }}
            </div>
            <div class="row" style="margin-top: 8px;">
              <button @click="startEdit(item)">编辑</button>
              <button type="button" class="danger-btn" @click="handleDelete(item.id)">删除</button>
            </div>
          </template>
        </li>
      </ul>
    </div>

    <p v-if="store.loading">Loading...</p>
    <p v-if="store.error" style="color: #b91c1c;">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import TripForm from '../components/TripForm.vue';
import ExpenseForm from '../components/ExpenseForm.vue';
import { useBudgetStore } from '../stores/budget';

const store = useBudgetStore();
const tripIdInput = ref('');
const editingId = ref('');
const editForm = reactive({
  amount: 0,
  currency: 'CNY',
  fx_rate_to_base: 1,
  category: '',
  spent_at: '',
  note: '',
  paid_by: '',
});

async function handleCreateTrip(payload) {
  const trip = await store.createTripAction(payload);
  tripIdInput.value = trip.id;
}

async function handleLoadTrip() {
  if (!tripIdInput.value) return;
  await store.loadTrip(tripIdInput.value);
}

async function handleAddExpense(payload) {
  if (!store.currentTrip) return;
  await store.addExpenseAction(store.currentTrip.id, payload);
}

function startEdit(item) {
  editingId.value = item.id;
  editForm.amount = Number(item.amount);
  editForm.currency = item.currency;
  editForm.fx_rate_to_base = Number(item.fx_rate_to_base);
  editForm.category = item.category;
  editForm.spent_at = toDateTimeLocal(item.spent_at);
  editForm.note = item.note || '';
  editForm.paid_by = item.paid_by || '';
}

function cancelEdit() {
  editingId.value = '';
}

async function handleSaveEdit(expenseId) {
  await store.updateExpenseAction(expenseId, {
    amount: editForm.amount,
    currency: editForm.currency.toUpperCase(),
    fx_rate_to_base: editForm.fx_rate_to_base,
    category: editForm.category,
    spent_at: new Date(editForm.spent_at).toISOString(),
    note: editForm.note,
    paid_by: editForm.paid_by || null,
  });
  cancelEdit();
}

async function handleDelete(expenseId) {
  await store.deleteExpenseAction(expenseId);
  if (editingId.value === expenseId) {
    cancelEdit();
  }
}

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function toDateTimeLocal(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}
</script>

<style scoped>
.progress-track {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: #0f766e;
  transition: width 0.2s ease;
}

.expense-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.expense-item {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 0;
}

.expense-item:last-child {
  border-bottom: 0;
}

.secondary-btn {
  background: #6b7280;
}

.danger-btn {
  background: #b91c1c;
}
</style>
