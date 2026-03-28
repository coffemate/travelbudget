<template>
  <section class="card">
    <h2>首页</h2>
    <p>你已登录，可以进入预算页管理旅行预算与支出。</p>
    <div class="row">
      <RouterLink to="/budget"><button>进入预算页</button></RouterLink>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
