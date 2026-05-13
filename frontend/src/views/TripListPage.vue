<template>
  <section class="page-stack dashboard-page">
    <n-card>
      <div class="dashboard-header">
        <div>
          <h2 class="section-title" style="margin-bottom: 4px;">我的行程</h2>
          <p class="body-text">一眼查看预算状态，快速切换与记账</p>
        </div>
        <RouterLink to="/trip/create"><n-button type="primary">新建行程</n-button></RouterLink>
      </div>
      <n-input v-model:value="searchText" placeholder="搜索行程名称" clearable />
    </n-card>

    <p v-if="filteredTrips.length === 0" class="body-text">{{ emptyMessage }}</p>
    <n-space v-else vertical :size="12">
      <n-card v-for="trip in filteredTrips" :key="trip.id" hoverable @click="openTrip(trip.id)">
        <div class="trip-card-top">
          <h3 class="trip-name">{{ trip.name }}</h3>
          <n-tag size="small" round :type="getTripStatus(trip) === 'ongoing' ? 'success' : getTripStatus(trip) === 'upcoming' ? 'info' : 'default'">{{ getTripStatusText(trip) }}</n-tag>
        </div>
        <p class="expense-meta">{{ formatTripRange(trip.start_date, trip.end_date) }} · 共 {{ getTripDays(trip) }} 天</p>
        <div class="summary-grid">
          <div class="summary-item"><div class="summary-label">总预算</div><div class="summary-value">{{ formatMoney(trip.total_budget) }}</div></div>
          <div class="summary-item"><div class="summary-label">已支出</div><div class="summary-value summary-value--spent">{{ formatMoney(getSpent(trip)) }}</div></div>
          <div class="summary-item"><div class="summary-label">剩余预算</div><div class="summary-value" :class="{ 'text-danger': Number(trip.remaining_budget) < 0 }">{{ formatMoney(trip.remaining_budget) }}</div></div>
        </div>
        <n-progress style="margin-top:12px" type="line" :percentage="getProgressPercent(trip)" :status="isOverBudget(trip) ? 'error' : 'success'" :show-indicator="false" />
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
        <n-button type="error" :disabled="deleteConfirm !== 'YES'" :loading="saving" @click="handleDeleteTrip">删除行程</n-button>
      </n-space>
    </n-modal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useBudgetStore } from '../stores/budget';
const message = useMessage();
const authStore = useAuthStore(); const store = useBudgetStore(); const router = useRouter();
const searchText = ref(''); const editModalVisible = ref(false); const deleteModalVisible = ref(false); const saving = ref(false);
const currentTripId = ref(''); const deleteConfirm = ref('');
const editForm = reactive({ name: '', total_budget: 0 });
const filteredTrips = computed(() => !searchText.value ? store.trips : store.trips.filter((trip) => trip.name?.toLowerCase().includes(searchText.value.toLowerCase())));
const emptyMessage = computed(() => (store.trips.length === 0 ? '暂无行程，请先创建。' : '没有匹配的行程。'));
onMounted(async () => { store.loadTripsFromStorage(authStore.user?.id); try { await store.syncTripsAction(authStore.user?.id); } catch {} });
const getTripDays = (trip) => Math.max(0, Math.floor((new Date(trip.end_date).setHours(0,0,0,0)-new Date(trip.start_date).setHours(0,0,0,0))/(1000*60*60*24))+1);
function getTripStatus(trip){const t=new Date();t.setHours(0,0,0,0);const s=new Date(trip.start_date);const e=new Date(trip.end_date);s.setHours(0,0,0,0);e.setHours(0,0,0,0);if(t<s)return 'upcoming';if(t>e)return 'finished';return 'ongoing';}
const getTripStatusText=(trip)=>({upcoming:'即将开始',ongoing:'进行中',finished:'已结束'}[getTripStatus(trip)]);
const getSpent=(trip)=>Number(trip.total_budget||0)-Number(trip.remaining_budget||0); const isOverBudget=(trip)=>Number(trip.remaining_budget)<0;
const getProgressPercent=(trip)=>{const total=Number(trip.total_budget||0);if(total<=0)return 0;return Math.min(100,Number((((getSpent(trip)/total)*100)).toFixed(2)));};
const formatMoney=(a)=>Number(a||0).toFixed(2);
const openTrip=async(id)=>router.push(`/trip/${id}`); const handleQuickAddExpense=async(id)=>router.push(`/trip/${id}/add`);
function startEdit(trip){currentTripId.value=trip.id;editForm.name=trip.name;editForm.total_budget=Number(trip.total_budget);editModalVisible.value=true;}
async function handleConfirmEdit(){saving.value=true; try{await store.updateTripAction(currentTripId.value,{name:editForm.name,total_budget:editForm.total_budget},authStore.user?.id);message.success('保存成功');editModalVisible.value=false;}catch{message.error('操作失败');} finally{saving.value=false;}}
function openDeleteDialog(id){currentTripId.value=id;deleteConfirm.value='';deleteModalVisible.value=true;}
async function handleDeleteTrip(){saving.value=true;try{await store.deleteTripAction(currentTripId.value,authStore.user?.id);message.success('删除成功');deleteModalVisible.value=false;}catch{message.error('操作失败');}finally{saving.value=false;}}
function formatTripRange(startDate,endDate){if(!startDate||!endDate)return '日期待定';const s=new Date(startDate),e=new Date(endDate),sy=s.getFullYear(),ey=e.getFullYear(),sm=s.getMonth()+1,em=e.getMonth()+1,sd=s.getDate(),ed=e.getDate();if(sy===ey)return `${sy}年${sm}月${sd}日 - ${em}月${ed}日`;return `${sy}年${sm}月${sd}日 - ${ey}年${em}月${ed}日`;}
</script>
