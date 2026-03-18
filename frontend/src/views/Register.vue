<template>
  <section class="card">
    <h2>注册</h2>
    <form class="row" style="flex-direction: column; max-width: 360px;" @submit.prevent="handleRegister">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码（至少 6 位）" required />
      <button type="submit">注册</button>
    </form>
    <p v-if="authStore.error" style="color: #b91c1c;">{{ authStore.error }}</p>
    <p style="margin-top: 12px;">
      已有账号？<RouterLink to="/login">去登录</RouterLink>
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const email = ref('');
const password = ref('');

async function handleRegister() {
  await authStore.register(email.value, password.value);
  await router.push('/budget');
}
</script>
