<template>
  <section class="page-stack">
    <div v-if="store.currentTrip" class="card">
      <h3 class="section-title">预算概览</h3>
      <p class="hero-metric">{{ store.remainingBudget }}</p>
      <p class="body-text">剩余预算</p>

      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">已花费</div>
          <div class="summary-value summary-value--spent">{{ store.spentBudget }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">已用百分比</div>
          <div class="summary-value">{{ store.spentPercent }}%</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">剩余天数</div>
          <div class="summary-value">{{ store.remainingDays }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">今日建议花费</div>
          <div class="summary-value summary-value--remain">{{ store.dailySuggestedBudget }}</div>
        </div>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${Math.min(store.spentPercent, 100)}%` }"></div>
      </div>
    </div>

    <div v-else class="card">
      <h3 class="section-title">暂无行程</h3>
      <p class="body-text">请先前往行程页面创建行程，然后再回来添加支出。</p>
      <div class="action-row">
        <RouterLink to="/trip"><button>去创建行程</button></RouterLink>
      </div>
    </div>

    <ExpenseForm
      v-if="store.currentTrip"
      :submit-success-version="submitSuccessVersion"
      :success-message="expenseSuccessMessage"
      @submit="handleAddExpense"
    />

    <div v-if="store.currentTrip" class="card">
      <h3 class="section-title">支出列表</h3>
      <p v-if="store.expenses.length === 0" class="body-text">暂无支出</p>
      <ul v-else class="expense-list">
        <li v-for="item in store.expenses" :key="item.id" class="expense-item">
          <template v-if="editingId === item.id">
            <div class="form-grid">
              <div class="row">
                <input v-model.number="editForm.amount" type="number" min="0.01" step="0.01" placeholder="请输入金额" />
                <input v-model="editForm.currency" maxlength="3" placeholder="请输入币种（如 CNY）" />
              </div>
              <div class="row">
                <input v-model.number="editForm.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="请输入汇率（默认 1）" />
                <input v-model="editForm.category" placeholder="请选择分类" />
              </div>
              <input v-model="editForm.spent_at" type="datetime-local" />
              <input v-model="editForm.note" placeholder="可填写备注（可选）" />
            </div>
            <div class="action-row">
              <button @click="handleSaveEdit(item.id)">保存</button>
              <button type="button" class="secondary-btn" @click="cancelEdit">取消</button>
            </div>
          </template>

          <template v-else>
            <div class="expense-main">
              {{ item.category }} | {{ item.amount }} {{ item.currency }} | base {{ item.amount_in_base }}
            </div>
            <div class="expense-meta">{{ formatDate(item.spent_at) }}</div>
            <div class="action-row">
              <button @click="startEdit(item)">编辑</button>
              <button type="button" class="danger-btn" @click="handleDelete(item.id)">删除</button>
            </div>
          </template>
        </li>
      </ul>
    </div>

    <p v-if="store.loading" class="helper-text">Loading...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import ExpenseForm from '../components/ExpenseForm.vue';
import { useBudgetStore } from '../stores/budget';

const store = useBudgetStore();
const editingId = ref('');
const submitSuccessVersion = ref(0);
const expenseSuccessMessage = ref('');
const editForm = reactive({
  amount: 0,
  currency: 'CNY',
  fx_rate_to_base: 1,
  category: '',
  spent_at: '',
  note: '',
  paid_by: '',
});

onMounted(async () => {
  if (store.currentTrip?.id) {
    await store.loadTrip(store.currentTrip.id);
  }
});

async function handleAddExpense(payload) {
  if (!store.currentTrip) return;
  await store.addExpenseAction(store.currentTrip.id, payload);
  submitSuccessVersion.value += 1;
  expenseSuccessMessage.value = '支出添加成功';
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
