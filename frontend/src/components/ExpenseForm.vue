<template>
  <n-card>
    <n-form @submit.prevent="onSubmit">
      <h3 class="section-title">{{ title }}</h3>
      <n-form-item label="消费分类">
        <n-select v-model:value="form.category" :options="categories" />
      </n-form-item>
      <n-form-item v-if="showPayMethod" label="支付方式">
        <n-segmented v-model:value="form.pay_method" :options="payMethods" />
      </n-form-item>
      <div class="row">
        <n-input-number v-model:value="form.amount" :min="0.01" :precision="2" placeholder="请输入金额" style="width:100%" />
        <n-input v-model:value="form.currency" placeholder="币种（如 CNY）" maxlength="3" />
      </div>
      <div class="row">
        <n-input-number v-model:value="form.fx_rate_to_base" :min="0.00000001" placeholder="汇率（默认 1）" style="width:100%" />
        <n-date-picker v-model:value="spentAtTimestamp" type="datetime" clearable style="width:100%" />
      </div>
      <n-input v-model:value="form.note" placeholder="可填写备注（可选）" />
      <n-space justify="space-between">
        <n-button v-if="showDelete" type="error" secondary @click="emit('delete')">删除支出</n-button>
        <n-button type="primary" attr-type="submit">{{ submitText }}</n-button>
      </n-space>
      <p v-if="successMessage" class="helper-text text-success">{{ successMessage }}</p>
    </n-form>
  </n-card>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
const props = defineProps({ submitSuccessVersion: Number, successMessage: String, initialData: Object, title: String, submitText: String, showDelete: Boolean, showPayMethod: { type: Boolean, default: true } });
const emit = defineEmits(['submit', 'delete']);
const categories=[{value:'food',label:'餐饮'},{value:'transport',label:'交通'},{value:'hotel',label:'住宿'},{value:'ticket',label:'门票'},{value:'shopping',label:'购物'},{value:'general',label:'其他'}];
const payMethods=[{value:'mobile',label:'手机'},{value:'cash',label:'现金'},{value:'card',label:'刷卡'}];
const initialForm=()=>({amount:0,currency:'CNY',fx_rate_to_base:1,category:'food',pay_method:'mobile',spent_at:'',note:''});
const form=reactive(initialForm());
const spentAtTimestamp = computed({ get:()=> form.spent_at ? new Date(form.spent_at).getTime() : null, set:(value)=>{ form.spent_at = value ? new Date(value).toISOString() : ''; } });
function hydrateFromProps(){if(!props.initialData)return;Object.assign(form,{...initialForm(),...props.initialData,spent_at: props.initialData.spent_at ? new Date(props.initialData.spent_at).toISOString() : ''});}
watch(()=>props.initialData,hydrateFromProps,{immediate:true,deep:true});
watch(()=>props.submitSuccessVersion,(c,p)=>{if(c>p&&!props.initialData)Object.assign(form,initialForm());});
function onSubmit(){emit('submit',{...form,note:form.note?`[${form.pay_method}] ${form.note}`:`[${form.pay_method}]`,currency:form.currency.toUpperCase(),spent_at:form.spent_at||new Date().toISOString(),idempotency_key:`expense-${Date.now()}-${Math.random().toString(36).slice(2,8)}`});}
</script>
