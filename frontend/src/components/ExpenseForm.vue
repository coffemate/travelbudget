<template>
  <form class="card form-grid" @submit.prevent="onSubmit">
    <h3 class="section-title">添加支出</h3>

    <div class="selector-wrap">
      <div class="summary-label">消费分类</div>
      <div class="selector-grid">
        <button
          v-for="c in categories"
          :key="c.value"
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn--active': form.category === c.value }"
          @click="form.category = c.value"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <div class="selector-wrap">
      <div class="summary-label">支付方式</div>
      <div class="selector-grid selector-grid--3">
        <button
          v-for="m in payMethods"
          :key="m.value"
          type="button"
          class="chip-btn"
          :class="{ 'chip-btn--active': form.pay_method === m.value }"
          @click="form.pay_method = m.value"
        >
          {{ m.label }}
        </button>
      </div>
    </div>

    <div class="row">
      <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="请输入金额" required />
      <input v-model="form.currency" placeholder="币种（如 CNY）" maxlength="3" required />
    </div>
    <div class="row">
      <input v-model.number="form.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="汇率（默认 1）" required />
      <input v-model="form.spent_at" type="datetime-local" required />
    </div>
    <input v-model="form.note" placeholder="可填写备注（可选）" />
    <button type="submit">添加</button>
    <p v-if="successMessage" class="helper-text text-success">{{ successMessage }}</p>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({ submitSuccessVersion: { type: Number, default: 0 }, successMessage: { type: String, default: '' } });
const emit = defineEmits(['submit']);

const categories = [
  { value: 'food', label: '餐饮' },
  { value: 'transport', label: '交通' },
  { value: 'hotel', label: '住宿' },
  { value: 'ticket', label: '门票' },
  { value: 'shopping', label: '购物' },
  { value: 'general', label: '其他' },
];

const payMethods = [
  { value: 'cash', label: '现金' },
  { value: 'card', label: '刷卡' },
  { value: 'wallet', label: '钱包' },
];

const initialForm = () => ({ amount: 0, currency: 'CNY', fx_rate_to_base: 1, category: 'food', pay_method: 'cash', spent_at: '', note: '' });
const form = reactive(initialForm());
const generateIdempotencyKey = () => `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const resetForm = () => Object.assign(form, initialForm());

watch(() => props.submitSuccessVersion, (current, previous) => { if (current > previous) resetForm(); });

function onSubmit() {
  emit('submit', {
    ...form,
    note: form.note ? `[${form.pay_method}] ${form.note}` : `[${form.pay_method}]`,
    currency: form.currency.toUpperCase(),
    spent_at: new Date(form.spent_at).toISOString(),
    idempotency_key: generateIdempotencyKey(),
  });
}
</script>

<style scoped>
.selector-wrap { display: grid; gap: 8px; }
.selector-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.selector-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.chip-btn { min-height: 42px; border-radius: 12px; background: var(--surface-soft); color: var(--text); border: 1px solid var(--border); }
.chip-btn--active { background: #ccfbf1; border-color: var(--primary); color: #115e59; font-weight: 700; }
</style>
