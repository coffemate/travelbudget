<template>
  <n-card>
    <n-form class="form-grid" @submit.prevent="onSubmit">
      <h3 class="section-title">创建旅行</h3>
      <n-input v-model:value="form.name" placeholder="行程名称" required />
      <div class="row">
        <n-date-picker v-model:value="startDateTs" type="date" style="width:100%" />
        <n-date-picker v-model:value="endDateTs" type="date" style="width:100%" />
      </div>
      <div class="row">
        <n-input v-model:value="form.base_currency" placeholder="币种，如 CNY" maxlength="3" />
        <n-input-number v-model:value="form.total_budget" :min="0" :precision="2" style="width:100%" placeholder="总预算" />
      </div>
      <n-button type="primary" attr-type="submit">确认提交</n-button>
    </n-form>
  </n-card>
</template>

<script setup>
import { computed, reactive } from 'vue';
const emit = defineEmits(['submit']);
const form = reactive({ name: '', start_date: '', end_date: '', base_currency: 'CNY', total_budget: 0 });
const startDateTs = computed({ get:()=> form.start_date ? new Date(form.start_date).getTime() : null, set:(v)=> form.start_date = v ? new Date(v).toISOString().slice(0,10) : '' });
const endDateTs = computed({ get:()=> form.end_date ? new Date(form.end_date).getTime() : null, set:(v)=> form.end_date = v ? new Date(v).toISOString().slice(0,10) : '' });
function onSubmit(){emit('submit',{...form, base_currency: form.base_currency.toUpperCase()});}
</script>
