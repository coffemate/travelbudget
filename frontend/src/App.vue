<template>
  <div>
    <header class="card" style="border-radius: 0; border-left: 0; border-right: 0;">
      <div class="container row" style="justify-content: space-between; align-items: center;">
        <strong>Travel Budget Tool</strong>
        <nav class="row">
          <RouterLink to="/">首页</RouterLink>
          <RouterLink to="/budget">预算页</RouterLink>
        </nav>
      </div>
    </header>

    <main class="container" style="margin-top: 12px;">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>
