<template>
  <section class="page-stack">
    <div v-if="trip" class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <button type="button" class="secondary-btn" @click="router.push('/trip')">返回</button>
        <div class="summary-label">{{ trip.name }}</div>
      </div>
      <p class="body-text">{{ formatTripRange(trip.start_date, trip.end_date) }} · 共{{ tripDays }}天</p>
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-label">总预算</div><div class="summary-value">{{ money(trip.total_budget) }}</div></div>
        <div class="summary-item"><div class="summary-label">已支出</div><div class="summary-value summary-value--spent">{{ money(spent) }}</div></div>
        <div class="summary-item"><div class="summary-label">剩余预算</div><div class="summary-value" :class="{ 'text-danger': remain < 0 }">{{ money(remain) }}</div></div>
      </div>
      <div class="progress-track"><div class="progress-fill" :class="{ 'progress-fill--danger': remain < 0 }" :style="{ width: `${progress}%` }"></div></div>
    </div>

    <div v-if="trip" class="card">
      <h3 class="section-title">消费时间线</h3>
      <p v-if="expenses.length === 0" class="body-text">暂无支出记录</p>
      <ul v-else class="timeline-list">
        <li v-for="item in expenses" :key="item.id" class="timeline-item">
          <div class="timeline-time">
            <div>{{ formatDay(item.spent_at) }}</div>
            <div class="helper-text">{{ formatClock(item.spent_at) }}</div>
          </div>
          <div class="timeline-card">
            <div class="row" style="justify-content: space-between; align-items: center;">
              <span class="category-chip">{{ item.category || '未分类' }}</span>
              <span class="amount-strong">{{ item.amount }} {{ item.currency }}</span>
            </div>
            <div class="expense-meta">{{ item.note?.trim() ? item.note : '无备注' }}</div>
            <div class="action-row" style="margin-top: 8px;">
              <button type="button" class="secondary-btn" @click="openEdit(item)">编辑</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="editingItem" class="card">
      <h3 class="section-title">编辑支出记录</h3>
      <div class="form-grid">
        <input v-model.number="editForm.amount" type="number" min="0.01" step="0.01" placeholder="金额" />
        <input v-model="editForm.category" placeholder="分类" />
        <input v-model="editForm.spent_at" type="datetime-local" />
        <input v-model="editForm.note" placeholder="备注" />
      </div>
      <div class="action-row">
        <button @click="saveEdit">保存修改</button>
        <button type="button" class="secondary-btn" @click="editingItem = null">取消</button>
        <button type="button" class="danger-btn" @click="handleDelete(editingItem.id)">删除记录</button>
      </div>
    </div>

    <RouterLink v-if="trip" :to="`/trip/${tripId}/add`" class="fab-create">＋</RouterLink>

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore(); const store = useBudgetStore();
const trip = ref(null); const expenses = ref([]); const tripId = route.params.tripId;
const editingItem = ref(null);
const editForm = reactive({ amount: 0, currency: 'CNY', category: '', spent_at: '', note: '', fx_rate_to_base: 1 });

const spent = computed(() => Number(trip.value?.total_budget || 0) - Number(trip.value?.remaining_budget || 0));
const remain = computed(() => Number(trip.value?.remaining_budget || 0));
const progress = computed(() => {
  const total = Number(trip.value?.total_budget || 0);
  if (total <= 0) return 0;
  return Math.min(100, Number(((spent.value / total) * 100).toFixed(2)));
});
const tripDays = computed(() => {
  if (!trip.value) return 0;
  const s = new Date(trip.value.start_date); const e = new Date(trip.value.end_date);
  return Math.max(0, Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1);
});

onMounted(loadData);

async function loadData() {
  const result = await store.loadTripWithExpenses(tripId, authStore.user?.id);
  trip.value = result.trip;
  expenses.value = result.expenses;
}

function openEdit(item) {
  editingItem.value = item;
  editForm.amount = Number(item.amount); editForm.currency = item.currency; editForm.category = item.category || '';
  editForm.spent_at = toDateTimeLocal(item.spent_at); editForm.note = item.note || ''; editForm.fx_rate_to_base = Number(item.fx_rate_to_base || 1);
}

async function saveEdit() {
  if (!editingItem.value) return;
  await store.updateExpenseAction(editingItem.value.id, {
    amount: editForm.amount,
    currency: editForm.currency.toUpperCase(),
    fx_rate_to_base: editForm.fx_rate_to_base,
    category: editForm.category || 'general',
    spent_at: new Date(editForm.spent_at).toISOString(),
    note: editForm.note,
    paid_by: null,
  }, authStore.user?.id);
  editingItem.value = null;
  await loadData();
}

async function handleDelete(expenseId) {
  const confirmed = window.confirm('确认删除这条记录吗？');
  if (!confirmed) return;
  await store.deleteExpenseAction(expenseId, authStore.user?.id);
  editingItem.value = null;
  await loadData();
}

function formatTripRange(startDate, endDate) {
  if (!startDate || !endDate) return '日期待定';
  const s = new Date(startDate);
  const e = new Date(endDate);
  const sy = s.getFullYear();
  const ey = e.getFullYear();
  const sm = s.getMonth() + 1;
  const em = e.getMonth() + 1;
  const sd = s.getDate();
  const ed = e.getDate();
  if (sy === ey) return `${sy}年${sm}月${sd}日 - ${em}月${ed}日`;
  return `${sy}年${sm}月${sd}日 - ${ey}年${em}月${ed}日`;
}

const money = (v) => Number(v || 0).toFixed(2);
const formatDay = (v) => new Date(v).toLocaleDateString('zh-CN');
const formatClock = (v) => new Date(v).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const toDateTimeLocal = (v) => { const d = new Date(v); const o = d.getTimezoneOffset(); return new Date(d.getTime() - o * 60000).toISOString().slice(0, 16); };
</script>

<style scoped>
.timeline-list { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.timeline-item { display:grid; grid-template-columns: 84px 1fr; gap:10px; align-items: stretch; }
.timeline-time { font-size: 12px; color: var(--muted); padding-top: 8px; }
.timeline-card { border:1px solid var(--border); border-radius:14px; padding:12px; background:#fff; }
.category-chip { display:inline-block; padding:4px 8px; border-radius:999px; background:#ecfeff; color:#0f766e; font-size:12px; }
.amount-strong { font-weight:800; font-size:18px; }
.fab-create { position: fixed; right: 20px; bottom: 20px; width:52px; height:52px; border-radius:999px; background: var(--primary); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:30px; box-shadow: var(--shadow); }
.progress-fill--danger { background: linear-gradient(90deg, #f87171, #dc2626); }
</style>
