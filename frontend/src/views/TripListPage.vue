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
          <template v-if="editingTripId === trip.id">
            <div class="form-grid">
              <input v-model="editForm.name" placeholder="请输入行程名称" />
              <input v-model.number="editForm.total_budget" type="number" min="0" step="0.01" placeholder="请输入总预算" />
            </div>
            <div class="action-row">
              <button @click="handleConfirmEdit(trip.id)">确认</button>
              <button type="button" class="secondary-btn" @click="cancelEdit">取消</button>
            </div>
          </template>

          <template v-else>
            <div class="expense-main">{{ trip.name }}</div>
            <div class="expense-meta">{{ trip.start_date }} ~ {{ trip.end_date }}</div>
            <div class="expense-meta">总预算：{{ trip.total_budget }} ｜ 剩余：{{ trip.remaining_budget }}</div>
            <div class="action-row">
              <button @click="handleSelectTrip(trip.id)">
                {{ trip.id === store.currentTrip?.id ? '当前行程' : '切换为当前行程' }}
              </button>
              <button type="button" class="secondary-btn" @click="startEdit(trip)">编辑</button>
              <button type="button" class="danger-btn" @click="handleDeleteTrip(trip.id)">删除</button>
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
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const authStore = useAuthStore();
const store = useBudgetStore();
const router = useRouter();
const editingTripId = ref('');
const editForm = reactive({
  name: '',
  total_budget: 0,
});

onMounted(() => {
  store.loadTripsFromStorage(authStore.user?.id);
});

async function handleSelectTrip(tripId) {
  await store.selectTrip(tripId, authStore.user?.id);
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

  const deletingCurrent = store.currentTrip?.id === tripId;
  await store.deleteTripAction(tripId, authStore.user?.id);

  if (deletingCurrent) {
    await router.push('/trip');
  }
}
</script>
