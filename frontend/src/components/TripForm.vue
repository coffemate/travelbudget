<template>
  <form class="card form-grid" @submit.prevent="onSubmit">
    <h3 class="section-title">创建旅行</h3>
    <div class="row">
      <input v-model="form.name" placeholder="trip name" required />
    </div>
    <div class="row">
      <input v-model="form.start_date" type="date" required />
      <input v-model="form.end_date" type="date" required />
    </div>
    <div class="row">
      <input v-model="form.base_currency" placeholder="currency e.g. CNY" maxlength="3" required />
      <input v-model.number="form.total_budget" type="number" min="0" step="0.01" placeholder="total budget" required />
    </div>
    <button type="submit">创建</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue';

const emit = defineEmits(['submit']);

const form = reactive({
  name: '',
  start_date: '',
  end_date: '',
  base_currency: 'CNY',
  total_budget: 0,
});

function onSubmit() {
  emit('submit', { ...form, base_currency: form.base_currency.toUpperCase() });
}
</script>
