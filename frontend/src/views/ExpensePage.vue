<template>
  <section class="page-stack">
    <div v-if="trip" class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <button type="button" class="secondary-btn" @click="router.push('/trip')">返回</button>
        <div class="summary-label">{{ trip.name }}</div>
      </div>
      <p class="body-text">{{ trip.start_date }} ~ {{ trip.end_date }} · {{ tripDays }} 天</p>
      <div class="summary-grid">
        <div class="summary-item"><div class="summary-label">总预算</div><div class="summary-value">{{ money(trip.total_budget) }}</div></div>
        <div class="summary-item"><div class="summary-label">已支出</div><div class="summary-value summary-value--spent">{{ money(spent) }}</div></div>
        <div class="summary-item"><div class="summary-label">剩余</div><div class="summary-value" :class="{ 'text-danger': remain < 0 }">{{ money(remain) }}</div></div>
      </div>
      <div class="progress-track"><div class="progress-fill" :class="{ 'progress-fill--danger': remain < 0 }" :style="{ width: `${progress}%` }"></div></div>
    </div>

    <div v-if="trip" class="card">
      <h3 class="section-title">消费时间线</h3>
      <p v-if="expenses.length === 0" class="body-text">暂无支出</p>
      <ul v-else class="timeline-list">
        <li
          v-for="item in expenses"
          :key="item.id"
          class="timeline-item"
          @touchstart="onTouchStart($event, item.id)"
          @touchend="onTouchEnd($event, item.id)"
        >
          <div class="timeline-time">
            <div>{{ formatDay(item.spent_at) }}</div>
            <div class="helper-text">{{ formatClock(item.spent_at) }}</div>
          </div>
          <div class="timeline-card" :class="{ 'timeline-card--open': swipeOpenId === item.id }">
            <div class="row" style="justify-content: space-between; align-items: center;">
              <span class="category-chip">{{ item.category || '未分类' }}</span>
              <span class="amount-strong">{{ item.amount }} {{ item.currency }}</span>
            </div>
            <div class="expense-meta">{{ item.note?.trim() ? item.note : '无备注' }}</div>
            <div class="swipe-actions" :class="{ 'swipe-actions--show': swipeOpenId === item.id }">
              <button type="button" class="secondary-btn" @click="openEdit(item)">编辑</button>
              <button type="button" class="danger-btn" @click="handleDelete(item.id)">删除</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="editingItem" class="card">
      <h3 class="section-title">编辑记录</h3>
      <div class="form-grid">
        <input v-model.number="editForm.amount" type="number" min="0.01" step="0.01" />
        <input v-model="editForm.currency" maxlength="3" />
        <input v-model="editForm.category" placeholder="分类" />
        <input v-model="editForm.spent_at" type="datetime-local" />
        <input v-model="editForm.note" placeholder="备注" />
      </div>
      <div class="action-row">
        <button @click="saveEdit">保存</button>
        <button type="button" class="secondary-btn" @click="editingItem = null">取消</button>
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
const swipeOpenId = ref(''); const touchStartX = ref(0); const editingItem = ref(null);
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

function onTouchStart(event) { touchStartX.value = event.changedTouches[0].clientX; }
function onTouchEnd(event, id) {
  const delta = touchStartX.value - event.changedTouches[0].clientX;
  if (delta > 40) swipeOpenId.value = id;
  if (delta < -40) swipeOpenId.value = '';
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
  if (!window.confirm('确定删除该记录吗？')) return;
  await store.deleteExpenseAction(expenseId, authStore.user?.id);
  await loadData();
}

const money = (v) => Number(v || 0).toFixed(2);
const formatDay = (v) => new Date(v).toLocaleDateString();
const formatClock = (v) => new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toDateTimeLocal = (v) => { const d = new Date(v); const o = d.getTimezoneOffset(); return new Date(d.getTime() - o * 60000).toISOString().slice(0, 16); };
</script>

<style scoped>
.timeline-list { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
.timeline-item { display:grid; grid-template-columns: 84px 1fr; gap:10px; align-items: stretch; }
.timeline-time { font-size: 12px; color: var(--muted); padding-top: 8px; }
.timeline-card { border:1px solid var(--border); border-radius:14px; padding:12px; background:#fff; transition: transform .2s ease; }
.timeline-card--open { transform: translateX(-8px); }
.swipe-actions { margin-top:8px; display:none; gap:8px; }
.swipe-actions--show { display:flex; }
.category-chip { display:inline-block; padding:4px 8px; border-radius:999px; background:#ecfeff; color:#0f766e; font-size:12px; }
.amount-strong { font-weight:800; font-size:18px; }
.fab-create { position: fixed; right: 20px; bottom: 20px; width:52px; height:52px; border-radius:999px; background: var(--primary); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:30px; box-shadow: var(--shadow); }
.progress-fill--danger { background: linear-gradient(90deg, #f87171, #dc2626); }
</style>
