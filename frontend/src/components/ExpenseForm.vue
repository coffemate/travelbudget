<template>
  <form class="card" @submit.prevent="onSubmit">
    <h3>添加支出</h3>
    <div class="row">
      <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="amount" required />
      <input v-model="form.currency" placeholder="currency" maxlength="3" required />
      <input v-model.number="form.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="fx rate" required />
    </div>
    <div class="row">
      <input v-model="form.category" placeholder="category" required />
      <input v-model="form.spent_at" type="datetime-local" required />
    </div>
    <input v-model="form.note" placeholder="note" />
    <button type="submit">添加</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['submit']);

const form = reactive({
  amount: 0,
  currency: 'CNY',
  fx_rate_to_base: 1,
  category: 'general',
  spent_at: '',
  note: '',
});

function generateIdempotencyKey() {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function onSubmit() {
  emit('submit', {
    ...form,
    currency: form.currency.toUpperCase(),
    spent_at: new Date(form.spent_at).toISOString(),
    idempotency_key: generateIdempotencyKey(),
  });
}
</script>
