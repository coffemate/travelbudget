<template>
  <form class="card form-grid" @submit.prevent="onSubmit">
    <h3 class="section-title">添加支出</h3>
    <div class="row">
      <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="请输入金额" required />
      <input v-model="form.currency" placeholder="请输入币种（如 CNY）" maxlength="3" required />
    </div>
    <div class="row">
      <input v-model.number="form.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="请输入汇率（默认 1）" required />
      <select v-model="form.category" required>
        <option disabled value="">请选择分类</option>
        <option value="general">通用</option>
        <option value="food">餐饮</option>
        <option value="transport">交通</option>
        <option value="hotel">住宿</option>
        <option value="shopping">购物</option>
        <option value="ticket">门票</option>
      </select>
    </div>
    <input v-model="form.spent_at" type="datetime-local" required />
    <input v-model="form.note" placeholder="可填写备注（可选）" />
    <button type="submit">添加</button>
    <p v-if="successMessage" class="helper-text text-success">{{ successMessage }}</p>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
  submitSuccessVersion: {
    type: Number,
    default: 0,
  },
  successMessage: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['submit']);

const initialForm = () => ({
  amount: 0,
  currency: 'CNY',
  fx_rate_to_base: 1,
  category: '',
  spent_at: '',
  note: '',
});

const form = reactive(initialForm());

function generateIdempotencyKey() {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resetForm() {
  Object.assign(form, initialForm());
}

watch(
  () => props.submitSuccessVersion,
  (current, previous) => {
    if (current > previous) {
      resetForm();
    }
  },
);

function onSubmit() {
  emit('submit', {
    ...form,
    currency: form.currency.toUpperCase(),
    spent_at: new Date(form.spent_at).toISOString(),
    idempotency_key: generateIdempotencyKey(),
  });
}
</script>
