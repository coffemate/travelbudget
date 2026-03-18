<template>
  <section class="card">
    <h2>首页</h2>
    <p>这是旅行预算工具前端骨架，建议流程：先创建旅行，再进入预算页管理支出。</p>
    <div class="row">
      <RouterLink to="/budget"><button>进入预算页</button></RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
