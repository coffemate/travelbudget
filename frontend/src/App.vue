<template>
  <n-config-provider :theme="naiveTheme">
    <n-dialog-provider>
      <n-message-provider>
        <div class="app-shell">
          <div class="topbar-wrap">
            <header class="card topbar">
              <div class="container nav-row" style="padding: 0;">
                <strong class="page-title" style="font-size: 18px; margin: 0;">旅行预算记账</strong>
                <nav class="nav-links">
                  <RouterLink v-if="authStore.isAuthenticated" class="nav-link" to="/trip">首页</RouterLink>
                  <RouterLink v-if="!authStore.isAuthenticated" class="nav-link" to="/login">登录</RouterLink>
                  <RouterLink v-if="!authStore.isAuthenticated" class="nav-link" to="/register">注册</RouterLink>
                  <span v-if="authStore.user" class="user-chip">{{ authStore.user.email }}</span>
                  <n-button v-if="authStore.isAuthenticated" size="small" secondary @click="handleLogout">退出</n-button>
                </nav>
              </div>
            </header>
          </div>

          <main class="container" style="margin-top: 12px;">
            <RouterView />
          </main>
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { computed, onMounted } from 'vue';
import { darkTheme } from 'naive-ui';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const naiveTheme = computed(() => (window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : null));

onMounted(() => {
  authStore.initialize();
});

async function handleLogout() {
  await authStore.logout();
  await router.push('/login');
}
</script>
