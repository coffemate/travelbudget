<template>
  <section class="card">
    <h2>登录</h2>
    <form class="row" style="flex-direction: column; max-width: 360px;" @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
    <p v-if="authStore.error" style="color: #b91c1c;">{{ authStore.error }}</p>
    <p style="margin-top: 12px;">
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
  await router.push(route.query.redirect || '/budget');
}
</script>
