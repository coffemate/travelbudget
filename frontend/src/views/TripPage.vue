<template>
  <section class="page-stack">
    <TripForm @submit="handleCreateTrip" />

    <div v-if="store.currentTrip" class="card">
      <h3 class="section-title">当前行程信息</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">名称</div>
          <div class="summary-value">{{ store.currentTrip.name }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">基础币种</div>
          <div class="summary-value">{{ store.currentTrip.base_currency }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">开始日期</div>
          <div class="summary-value">{{ store.currentTrip.start_date }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">结束日期</div>
          <div class="summary-value">{{ store.currentTrip.end_date }}</div>
        </div>
      </div>
      <p class="helper-text" style="margin-top: 12px;">Trip ID：{{ store.currentTrip.id }}</p>
    </div>

    <p v-if="store.loading" class="helper-text">Loading...</p>
    <p v-if="store.error" class="helper-text text-danger">{{ store.error }}</p>
  </section>
</template>

<script setup>
import TripForm from '../components/TripForm.vue';
import { useBudgetStore } from '../stores/budget';

const store = useBudgetStore();

async function handleCreateTrip(payload) {
  await store.createTripAction(payload);
}
</script>
