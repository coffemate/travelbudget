<template>
  <form class="card" @submit.prevent="onSubmit">
    <h3>添加支出</h3>
    <div class="row">
      <input v-model="form.created_by" placeholder="created_by (UUID)" required />
      <input v-model.number="form.amount" type="number" min="0.01" step="0.01" placeholder="amount" required />
      <input v-model="form.currency" placeholder="currency" maxlength="3" required />
      <input v-model.number="form.fx_rate_to_base" type="number" min="0.00000001" step="0.00000001" placeholder="fx rate" required />
    </div>
    <div class="row">
      <input v-model="form.category" placeholder="category" required />
      <input v-model="form.spent_at" type="datetime-local" required />
      <input v-model="form.idempotency_key" placeholder="idempotency key" required />
    </div>
    <input v-model="form.note" placeholder="note" />
    <button type="submit">添加</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['submit']);

const form = reactive({
  created_by: '',
  amount: 0,
  currency: 'CNY',
  fx_rate_to_base: 1,
  category: 'general',
  spent_at: '',
  idempotency_key: '',
  note: '',
});

function onSubmit() {
  emit('submit', {
    ...form,
    currency: form.currency.toUpperCase(),
    spent_at: new Date(form.spent_at).toISOString(),
  });
}
</script>
