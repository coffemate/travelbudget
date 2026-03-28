<template>
  <section class="card auth-card">
    <h2 class="page-title">登录</h2>
    <p class="body-text">使用邮箱登录后，才能访问你的行程和支出数据。</p>
    <form class="auth-form" @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
    <p v-if="authStore.error" class="helper-text text-danger">{{ authStore.error }}</p>
    <p class="helper-text">
      没有账号？<RouterLink to="/register">去注册</RouterLink>
    </p>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');

async function handleLogin() {
  await authStore.login(email.value, password.value);
  await router.push(route.query.redirect || '/expense');
}
</script>
