<template>
  <section class="page-stack dashboard-page">
    <div class="card">
      <div class="dashboard-header">
        <div>
          <h2 class="section-title" style="margin-bottom: 4px;">我的行程</h2>
          <p class="body-text">一眼查看预算状态，快速切换与记账</p>
        </div>
        <RouterLink to="/trip/create"><button>新建行程</button></RouterLink>
      </div>

      <div class="search-wrap">
        <input v-model.trim="searchText" placeholder="搜索行程名称" />
      </div>
    </div>

    <div class="card">
      <p v-if="filteredTrips.length === 0" class="body-text">{{ emptyMessage }}</p>
      <ul v-else class="trip-card-list">
        <li
          v-for="trip in filteredTrips"
          :key="trip.id"
          class="trip-card"
          
          @click="openTrip(trip.id)"
        >
          <div class="trip-card-top">
            <h3 class="trip-name">{{ trip.name }}</h3>
            <div class="tag-group">
              <span v-if="getTripStatus(trip) === 'upcoming'" class="trip-tag trip-tag--upcoming">即将开始</span>
              <span v-else-if="getTripStatus(trip) === 'ongoing'" class="trip-tag trip-tag--current">进行中</span>
              <span v-else-if="getTripStatus(trip) === 'finished'" class="trip-tag trip-tag--finished">已结束</span>
            </div>
          </div>

          <p class="expense-meta">{{ trip.start_date }} ~ {{ trip.end_date }} · 共 {{ getTripDays(trip) }} 天</p>

          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">总预算</div>
              <div class="summary-value">{{ formatMoney(trip.total_budget) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">已支出</div>
              <div class="summary-value summary-value--spent">{{ formatMoney(getSpent(trip)) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">剩余预算</div>
              <div class="summary-value" :class="{ 'text-danger': Number(trip.remaining_budget) < 0 }">{{ formatMoney(trip.remaining_budget) }}</div>
            </div>
          </div>

          <div class="progress-track">
            <div
              class="progress-fill"
              :class="{ 'progress-fill--danger': isOverBudget(trip) }"
              :style="{ width: `${getProgressPercent(trip)}%` }"
            ></div>
          </div>

          <div class="action-row" @click.stop>
            <button type="button" @click="openTrip(trip.id)">查看支出</button>
            <button type="button" class="secondary-btn" @click="handleQuickExpense(trip.id)">记一笔</button>
            <button type="button" class="secondary-btn" @click="startEdit(trip)">编辑</button>
            <button type="button" class="danger-btn" @click="handleDeleteTrip(trip.id)">删除</button>
          </div>

          <div v-if="editingTripId === trip.id" class="edit-inline" @click.stop>
            <div class="form-grid" style="margin-top: 12px;">
              <input v-model="editForm.name" placeholder="请输入行程名称" />
              <input v-model.number="editForm.total_budget" type="number" min="0" step="0.01" placeholder="请输入总预算" />
            </div>
            <div class="action-row">
              <button @click="handleConfirmEdit(trip.id)">确认</button>
              <button type="button" class="secondary-btn" @click="cancelEdit">取消</button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <RouterLink to="/trip/create" class="fab-create">＋</RouterLink>

    <p v-if="store.loading" class="helper-text">Loading...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const authStore = useAuthStore();
const store = useBudgetStore();
const router = useRouter();
const editingTripId = ref('');
const searchText = ref('');
const editForm = reactive({
  name: '',
  total_budget: 0,
});

const filteredTrips = computed(() => {
  if (!searchText.value) return store.trips;
  return store.trips.filter((trip) => trip.name?.toLowerCase().includes(searchText.value.toLowerCase()));
});

const emptyMessage = computed(() => (store.trips.length === 0 ? '暂无行程，请先创建。' : '没有匹配的行程。'));

onMounted(() => {
  store.loadTripsFromStorage(authStore.user?.id);
});

function getTripDays(trip) {
  if (!trip.start_date || !trip.end_date) return 0;
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(0, diff);
}

function getTripStatus(trip) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (today < start) return 'upcoming';
  if (today > end) return 'finished';
  return 'ongoing';
}

function getSpent(trip) {
  return Number(trip.total_budget || 0) - Number(trip.remaining_budget || 0);
}

function isOverBudget(trip) {
  return Number(trip.remaining_budget) < 0;
}

function getProgressPercent(trip) {
  const total = Number(trip.total_budget || 0);
  if (total <= 0) return 0;
  return Math.min(100, Number((((getSpent(trip) / total) * 100)).toFixed(2)));
}

function formatMoney(amount) {
  return Number(amount || 0).toFixed(2);
}

async function openTrip(tripId) {
  await router.push(`/trip/${tripId}`);
}

async function handleQuickExpense(tripId) {
  await router.push(`/trip/${tripId}/add`);
}

async function handleQuickExpense(tripId) {
  await store.selectTrip(tripId, authStore.user?.id);
  await router.push('/expense/add');
}

function startEdit(trip) {
  editingTripId.value = trip.id;
  editForm.name = trip.name;
  editForm.total_budget = Number(trip.total_budget);
}

function cancelEdit() {
  editingTripId.value = '';
}

async function handleConfirmEdit(tripId) {
  await store.updateTripAction(
    tripId,
    {
      name: editForm.name,
      total_budget: editForm.total_budget,
    },
    authStore.user?.id,
  );
  cancelEdit();
}

async function handleDeleteTrip(tripId) {
  const confirmed = window.confirm('确定要删除该行程吗？删除后无法恢复。');
  if (!confirmed) return;

  await store.deleteTripAction(tripId, authStore.user?.id);
}
</script>

<style scoped>
.dashboard-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.search-wrap { margin-top: 12px; }
.trip-card-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
.trip-card { border: 1px solid var(--border); border-radius: 16px; padding: 14px; background: var(--surface); cursor: pointer; transition: transform .15s ease; }
.trip-card:active { transform: scale(.99); }
.trip-card--current { border-color: var(--primary); box-shadow: inset 0 0 0 1px var(--primary); }
.trip-card-top { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.trip-name { margin: 0; font-size: 17px; }
.tag-group { display: flex; gap: 6px; flex-wrap: wrap; }
.trip-tag { border-radius: 999px; font-size: 12px; padding: 4px 8px; }
.trip-tag--current { background: #ccfbf1; color: #115e59; }
.trip-tag--upcoming { background: #dbeafe; color: #1d4ed8; }
.trip-tag--finished { background: #e2e8f0; color: #334155; }
.progress-fill--danger { background: linear-gradient(90deg, #f87171, #dc2626); }
.fab-create {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: var(--shadow);
}
@media (min-width: 768px) {
  .fab-create { display: none; }
}
</style>
