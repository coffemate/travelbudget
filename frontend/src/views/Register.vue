<template>
  <section class="card auth-card">
    <h2 class="page-title">注册</h2>
    <p class="body-text">注册成功后即可登录并管理自己的旅行预算。</p>
    <form class="auth-form" @submit.prevent="handleRegister">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码（至少 6 位）" required />
      <button type="submit">注册</button>
    </form>
    <p v-if="authStore.error" class="helper-text text-danger">{{ authStore.error }}</p>
    <p class="helper-text">
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
  await router.push('/expense');
}
</script>
