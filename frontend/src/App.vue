<template>
  <div>
    <header class="card" style="border-radius: 0; border-left: 0; border-right: 0;">
      <div class="container row" style="justify-content: space-between; align-items: center;">
        <strong>Travel Budget Tool</strong>
        <nav class="row" style="align-items: center;">
          <RouterLink v-if="authStore.isAuthenticated" to="/">首页</RouterLink>
          <RouterLink v-if="authStore.isAuthenticated" to="/budget">预算页</RouterLink>
          <RouterLink v-if="!authStore.isAuthenticated" to="/login">登录</RouterLink>
          <RouterLink v-if="!authStore.isAuthenticated" to="/register">注册</RouterLink>
          <span v-if="authStore.user" style="font-size: 12px; color: #6b7280;">
            {{ authStore.user.email }}
          </span>
          <button v-if="authStore.isAuthenticated" type="button" @click="handleLogout">退出</button>
        </nav>
      </div>
    </header>

    <main class="container" style="margin-top: 12px;">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  authStore.initialize();
});

async function handleLogout() {
  await authStore.logout();
  await router.push('/login');
}
</script>
