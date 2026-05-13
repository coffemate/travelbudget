<template>
  <section class="page-stack">
    <div class="card add-topbar">
      <n-button size="small" secondary @click="goBack">← 返回</n-button>
      <div class="add-title">{{ isEditMode ? '编辑支出' : '记一笔' }}</div>
      <div class="add-time">{{ readableTime }}</div>
    </div>

    <div v-if="trip" class="card">
      <h3 class="section-title" style="margin-bottom: 6px;">{{ trip.name }}</h3>
      <p class="body-text">{{ formatTripRange(trip.start_date, trip.end_date) }}</p>
    </div>

    <ExpenseForm
      v-if="trip"
      :submit-success-version="submitSuccessVersion"
      :success-message="expenseSuccessMessage"
      :initial-data="formInitialData"
      :title="isEditMode ? '编辑支出记录' : '新增支出'"
      :submit-text="isEditMode ? '保存修改' : '保存并返回'"
      :show-delete="isEditMode"
      @submit="handleSubmit"
      @delete="handleDelete"
    />

    <p v-if="store.loading" class="helper-text">加载中...</p>
    <p v-if="expenseErrorMessage" class="helper-text text-danger">{{ expenseErrorMessage }}</p>
  </section>
</template>

<script setup>
import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, useDialog, useMessage } from 'naive-ui';
import ExpenseForm from '../components/ExpenseForm.vue';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const store = useBudgetStore();
const message = useMessage();
const dialog = useDialog();
const trip = ref(null);
const tripId = route.params.tripId;
const expenseId = route.query.expenseId;
const isEditMode = computed(() => Boolean(expenseId));
const submitSuccessVersion = ref(0);
const expenseSuccessMessage = ref('');
const expenseErrorMessage = ref('');
const formInitialData = ref(null);

const readableTime = computed(() => {
  const source = formInitialData.value?.spent_at ? new Date(formInitialData.value.spent_at) : new Date();
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][source.getDay()];
  return `${source.getMonth() + 1}月${source.getDate()}日 ${week} ${source.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
});

onMounted(async () => {
  const result = await store.loadTripWithExpenses(tripId, authStore.user?.id);
  trip.value = result.trip;

  if (isEditMode.value) {
    const target = result.expenses.find((item) => item.id === expenseId);
    if (!target) {
      expenseErrorMessage.value = '未找到要编辑的支出记录';
      return;
    }
    const note = target.note || '';
    const methodMatch = note.match(/^\[(mobile|cash|card)\]\s?/i);
    const payMethod = methodMatch?.[1]?.toLowerCase() || 'mobile';
    const pureNote = methodMatch ? note.replace(methodMatch[0], '') : note;
    formInitialData.value = {
      amount: Number(target.amount),
      currency: target.currency,
      fx_rate_to_base: Number(target.fx_rate_to_base || 1),
      category: target.category || 'general',
      pay_method: payMethod,
      spent_at: toDateTimeLocal(target.spent_at),
      note: pureNote,
    };
  }
});

async function handleSubmit(payload) {
  expenseErrorMessage.value = '';
  expenseSuccessMessage.value = '';
  try {
    if (isEditMode.value) {
      await store.updateExpenseAction(expenseId, {
        amount: payload.amount,
        currency: payload.currency,
        fx_rate_to_base: payload.fx_rate_to_base,
        category: payload.category,
        spent_at: payload.spent_at,
        note: payload.note,
        paid_by: null,
      }, authStore.user?.id);
    } else {
      await store.addExpenseAction(tripId, payload, authStore.user?.id);
    }
    submitSuccessVersion.value += 1;
    message.success('保存成功');
    expenseSuccessMessage.value = '操作成功';
    await router.push(`/trip/${tripId}`);
  } catch {
    expenseErrorMessage.value = isEditMode.value ? '修改失败，请稍后重试' : '添加失败，请稍后重试';
  }
}

async function handleDelete() {
  if (!expenseId) return;
  dialog.warning({
    title: '删除确认',
    content: '确认删除这条支出记录吗？',
    action: () => h(NButton, { type: 'error', onClick: async () => {
      await store.deleteExpenseAction(expenseId, authStore.user?.id);
      message.success('删除成功');
      await router.push(`/trip/${tripId}`);
    } }, { default: () => '删除支出' }),
  });
}

function goBack() { router.push(`/trip/${tripId}`); }

function formatTripRange(startDate, endDate) {
  if (!startDate || !endDate) return '日期待定';
  const s = new Date(startDate); const e = new Date(endDate);
  const sy = s.getFullYear(); const ey = e.getFullYear(); const sm = s.getMonth() + 1; const em = e.getMonth() + 1; const sd = s.getDate(); const ed = e.getDate();
  if (sy === ey) return `${sy}年${sm}月${sd}日 - ${em}月${ed}日`;
  return `${sy}年${sm}月${sd}日 - ${ey}年${em}月${ed}日`;
}
function toDateTimeLocal(value) { const date = new Date(value); const offset = date.getTimezoneOffset(); const local = new Date(date.getTime() - offset * 60 * 1000); return local.toISOString().slice(0, 16); }
</script>

<style scoped>
.add-topbar { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.add-title { font-size:18px; font-weight:700; }
.add-time { font-size:12px; color:var(--muted); }
</style>
