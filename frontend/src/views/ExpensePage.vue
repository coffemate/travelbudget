<template>
  <section class="page-stack">
    <div v-if="trip" class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <button type="button" class="secondary-btn" @click="router.push('/trip')">返回</button>
        <div>
          <div class="summary-label">{{ trip.name }}</div>
          <div class="summary-value summary-value--remain">剩余 {{ Number(trip.remaining_budget).toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <div v-if="trip" class="card">
      <h3 class="section-title">支出列表</h3>
      <p v-if="expenses.length === 0" class="body-text">暂无支出</p>
      <ul v-else class="expense-list">
        <li v-for="item in expenses" :key="item.id" class="expense-item">
          <div class="row" style="justify-content: space-between; align-items: center;">
            <div class="expense-main">
              <span class="category-chip">{{ item.category || '未分类' }}</span>
              <span class="amount-strong">{{ item.amount }} {{ item.currency }}</span>
            </div>
            <div class="expense-meta">{{ formatDate(item.spent_at) }}</div>
          </div>
          <div class="expense-meta">备注：{{ item.note?.trim() ? item.note : '无备注' }}</div>
        </li>
      </ul>
    </div>

    <RouterLink v-if="trip" :to="`/trip/${tripId}/add`" class="fab-create">＋</RouterLink>

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const store = useBudgetStore();
const trip = ref(null);
const expenses = ref([]);
const tripId = route.params.tripId;

onMounted(async () => {
  const result = await store.loadTripWithExpenses(tripId, authStore.user?.id);
  trip.value = result.trip;
  expenses.value = result.expenses;
});

function formatDate(value) {
  return new Date(value).toLocaleString();
}
</script>

<style scoped>
.category-chip { display:inline-block; padding:4px 8px; border-radius:999px; background:#ecfeff; color:#0f766e; font-size:12px; margin-right:8px; }
.amount-strong { font-weight:700; font-size:16px; }
.fab-create { position: fixed; right: 20px; bottom: 20px; width:52px; height:52px; border-radius:999px; background: var(--primary); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-size:30px; box-shadow: var(--shadow); }
</style>
