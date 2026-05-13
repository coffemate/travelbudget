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
              <button type="button" class="secondary-btn" @click="goEdit(item.id)">编辑</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <RouterLink v-if="trip" :to="`/trip/${tripId}/add`" class="fab-create">＋</RouterLink>

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore(); const store = useBudgetStore();
const trip = ref(null); const expenses = ref([]); const tripId = route.params.tripId;

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

function goEdit(expenseId) {
  router.push(`/trip/${tripId}/add?expenseId=${expenseId}`);
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
