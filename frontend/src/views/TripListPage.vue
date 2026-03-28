<template>
  <section class="page-stack">
    <div class="card">
      <div class="row" style="justify-content: space-between; align-items: center;">
        <h3 class="section-title" style="margin: 0;">行程列表</h3>
        <RouterLink to="/trip/create"><button>新建行程</button></RouterLink>
      </div>
    </div>

    <div class="card">
      <p v-if="store.trips.length === 0" class="body-text">暂无行程，请先创建。</p>
      <ul v-else class="expense-list">
        <li
          v-for="trip in store.trips"
          :key="trip.id"
          class="expense-item"
          :style="trip.id === store.currentTrip?.id ? 'border-left: 4px solid #0f766e; padding-left: 10px;' : ''"
        >
          <div class="expense-main">{{ trip.name }}</div>
          <div class="expense-meta">{{ trip.start_date }} ~ {{ trip.end_date }}</div>
          <div class="expense-meta">总预算：{{ trip.total_budget }} ｜ 剩余：{{ trip.remaining_budget }}</div>
          <div class="action-row">
            <button @click="handleSelectTrip(trip.id)">
              {{ trip.id === store.currentTrip?.id ? '当前行程' : '切换为当前行程' }}
            </button>
          </div>
        </li>
      </ul>
    </div>

    <p v-if="store.loading" class="helper-text">Loading...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const authStore = useAuthStore();
const store = useBudgetStore();

onMounted(() => {
  store.loadTripsFromStorage(authStore.user?.id);
});

async function handleSelectTrip(tripId) {
  await store.selectTrip(tripId, authStore.user?.id);
}
</script>
