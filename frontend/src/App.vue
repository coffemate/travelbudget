<template>
  <div class="app-shell">
    <div class="topbar-wrap">
      <header class="card topbar">
        <div class="container nav-row" style="padding: 0;">
          <strong class="page-title" style="font-size: 18px; margin: 0;">Travel Budget Tool</strong>
          <nav class="nav-links">
            <RouterLink v-if="authStore.isAuthenticated" class="nav-link" to="/expense">支出页</RouterLink>
            <RouterLink v-if="authStore.isAuthenticated" class="nav-link" to="/trip">行程页</RouterLink>
            <RouterLink v-if="!authStore.isAuthenticated" class="nav-link" to="/login">登录</RouterLink>
            <RouterLink v-if="!authStore.isAuthenticated" class="nav-link" to="/register">注册</RouterLink>
            <span v-if="authStore.user" class="user-chip">{{ authStore.user.email }}</span>
            <button v-if="authStore.isAuthenticated" type="button" @click="handleLogout">退出</button>
          </nav>
        </div>
      </header>
    </div>


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
