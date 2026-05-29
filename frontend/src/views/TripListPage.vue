<template>
  <section class="page-stack dashboard-page">
    <n-card>
      <div class="dashboard-header">
        <div>
          <h2 class="section-title" style="margin-bottom: 4px;">我的行程</h2>
          <p class="body-text">一眼查看预算状态，快速切换与记账</p>
        </div>
        <RouterLink to="/trip/create">
          <n-button type="primary">新建行程</n-button>
        </RouterLink>
      </div>
      <n-input v-model:value="searchText" placeholder="搜索行程名称" clearable />
    </n-card>

    <p v-if="filteredTrips.length === 0" class="body-text">{{ emptyMessage }}</p>
    <n-space v-else vertical :size="12">
      <n-card v-for="trip in filteredTrips" :key="trip.id" hoverable @click="openTrip(trip.id)">
        <div class="trip-card-top">
          <h3 class="trip-name">{{ trip.name }}</h3>
          <n-tag
            size="small"
            round
            :type="getTripStatus(trip) === 'ongoing' ? 'success' : getTripStatus(trip) === 'upcoming' ? 'info' : 'default'"
          >
            {{ getTripStatusText(trip) }}
          </n-tag>
        </div>
        <p class="expense-meta">{{ formatTripRange(trip.start_date, trip.end_date) }} · 共{{ getTripDays(trip) }}天</p>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">总预算</div>
            <div class="summary-value">{{ formatMoneyValue(trip.total_budget) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">已支出</div>
            <div class="summary-value summary-value--spent">{{ formatMoneyValue(getSpent(trip)) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">剩余预算</div>
            <div class="summary-value" :class="{ 'text-danger': Number(trip.remaining_budget) < 0 }">
              {{ formatMoneyValue(trip.remaining_budget) }}
            </div>
          </div>
        </div>

        <ExpenseStackOverview
          :analysis="expenseAnalysisByTrip[trip.id]"
          :budget="trip.total_budget"
        />

        <n-space class="action-row" @click.stop>
          <n-button size="small" @click="openTrip(trip.id)">查看支出</n-button>
          <n-button size="small" type="primary" secondary @click="handleQuickAddExpense(trip.id)">记一笔</n-button>
          <n-button size="small" secondary @click="startEdit(trip)">编辑</n-button>
          <n-button size="small" type="error" secondary @click="openDeleteDialog(trip.id)">删除</n-button>
        </n-space>
      </n-card>
    </n-space>

    <n-modal v-model:show="editModalVisible" preset="card" title="编辑行程" style="max-width: 420px">
      <n-space vertical>
        <n-input v-model:value="editForm.name" placeholder="请输入行程名称" />
        <div class="edit-date-row">
          <n-date-picker v-model:value="editStartDateTs" type="date" style="width:100%" />
          <n-date-picker v-model:value="editEndDateTs" type="date" style="width:100%" />
        </div>
        <n-input-number v-model:value="editForm.total_budget" :min="0" style="width: 100%" placeholder="请输入总预算" />
        <n-space justify="end">
          <n-button secondary @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleConfirmEdit">确认提交</n-button>
        </n-space>
      </n-space>
    </n-modal>

    <n-modal v-model:show="deleteModalVisible" preset="card" title="删除行程确认" style="max-width: 420px">
      <n-space vertical>
        <p class="body-text">删除后该行程及全部支出记录无法恢复，请输入 YES 确认。</p>
        <n-input v-model:value="deleteConfirm" placeholder="请输入 YES" />
        <n-button type="error" :disabled="deleteConfirm !== 'YES'" :loading="saving" @click="handleDeleteTrip">
          删除行程
        </n-button>
      </n-space>
    </n-modal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { RouterLink, useRouter } from 'vue-router';
import ExpenseStackOverview from '../components/ExpenseStackOverview.vue';
import { listExpenses } from '../api/trips';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';
import { buildExpenseAnalysis } from '../utils/expenseAnalysis';

const message = useMessage();
const authStore = useAuthStore();
const store = useBudgetStore();
const router = useRouter();
const searchText = ref('');
const editModalVisible = ref(false);
const deleteModalVisible = ref(false);
const saving = ref(false);
const currentTripId = ref('');
const deleteConfirm = ref('');
const expensesByTrip = ref({});
const editForm = reactive({ name: '', start_date: '', end_date: '', total_budget: 0 });
const editStartDateTs = computed({
  get: () => (editForm.start_date ? new Date(editForm.start_date).getTime() : null),
  set: (value) => {
    editForm.start_date = value ? new Date(value).toISOString().slice(0, 10) : '';
  },
});
const editEndDateTs = computed({
  get: () => (editForm.end_date ? new Date(editForm.end_date).getTime() : null),
  set: (value) => {
    editForm.end_date = value ? new Date(value).toISOString().slice(0, 10) : '';
  },
});

const filteredTrips = computed(() => {
  if (!searchText.value) return store.trips;
  return store.trips.filter((trip) => trip.name?.toLowerCase().includes(searchText.value.toLowerCase()));
});
const emptyMessage = computed(() => (store.trips.length === 0 ? '暂无行程，请先创建。' : '没有匹配的行程。'));
const expenseAnalysisByTrip = computed(() => {
  return Object.fromEntries(
    store.trips.map((trip) => [
      trip.id,
      buildExpenseAnalysis(expensesByTrip.value[trip.id] || []),
    ]),
  );
});

onMounted(async () => {
  store.loadTripsFromStorage(authStore.user?.id);
  try {
    await store.syncTripsAction(authStore.user?.id);
    await loadTripExpenses();
  } catch {}
});

async function loadTripExpenses() {
  const pairs = await Promise.all(store.trips.map(async (trip) => {
    try {
      const expenses = await listExpenses(trip.id);
      return [trip.id, Array.isArray(expenses) ? expenses : []];
    } catch {
      return [trip.id, []];
    }
  }));
  expensesByTrip.value = Object.fromEntries(pairs);
}

function getTripDays(trip) {
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

function getTripStatus(trip) {
  const today = new Date();
  const start = new Date(trip.start_date);
  const end = new Date(trip.end_date);
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (today < start) return 'upcoming';
  if (today > end) return 'finished';
  return 'ongoing';
}

const getTripStatusText = (trip) => ({ upcoming: '即将开始', ongoing: '进行中', finished: '已结束' }[getTripStatus(trip)]);
const getSpent = (trip) => Number(trip.total_budget || 0) - Number(trip.remaining_budget || 0);
const formatMoneyValue = (value) => Number(value || 0).toFixed(2);
const openTrip = async (id) => router.push(`/trip/${id}`);
const handleQuickAddExpense = async (id) => router.push(`/trip/${id}/add`);

function startEdit(trip) {
  currentTripId.value = trip.id;
  editForm.name = trip.name;
  editForm.start_date = trip.start_date;
  editForm.end_date = trip.end_date;
  editForm.total_budget = Number(trip.total_budget);
  editModalVisible.value = true;
}

async function handleConfirmEdit() {
  if (!editForm.name.trim()) {
    message.error('请输入行程名称');
    return;
  }
  if (!editForm.start_date || !editForm.end_date) {
    message.error('请选择行程时间');
    return;
  }
  if (editForm.start_date > editForm.end_date) {
    message.error('结束日期不能早于开始日期');
    return;
  }
  saving.value = true;
  try {
    await store.updateTripAction(currentTripId.value, {
      name: editForm.name.trim(),
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      total_budget: editForm.total_budget,
    }, authStore.user?.id);
    message.success('保存成功');
    editModalVisible.value = false;
  } catch {
    message.error('操作失败');
  } finally {
    saving.value = false;
  }
}

function openDeleteDialog(id) {
  currentTripId.value = id;
  deleteConfirm.value = '';
  deleteModalVisible.value = true;
}

async function handleDeleteTrip() {
  saving.value = true;
  try {
    await store.deleteTripAction(currentTripId.value, authStore.user?.id);
    message.success('删除成功');
    deleteModalVisible.value = false;
    await loadTripExpenses();
  } catch {
    message.error('操作失败');
  } finally {
    saving.value = false;
  }
}

function formatTripRange(startDate, endDate) {
  if (!startDate || !endDate) return '日期待定';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const sy = start.getFullYear();
  const ey = end.getFullYear();
  const sm = start.getMonth() + 1;
  const em = end.getMonth() + 1;
  const sd = start.getDate();
  const ed = end.getDate();
  if (sy === ey) return `${sy}年${sm}月${sd}日 - ${em}月${ed}日`;
  return `${sy}年${sm}月${sd}日 - ${ey}年${em}月${ed}日`;
}
</script>

<style scoped>
.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.trip-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.trip-name {
  margin: 0;
  font-size: 18px;
  line-height: 1.3;
}

.edit-date-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
