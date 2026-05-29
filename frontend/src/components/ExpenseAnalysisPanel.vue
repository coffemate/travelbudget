<template>
  <div class="expense-analysis-panel">
    <h3 class="section-title">支出分析</h3>

    <p v-if="analysis.totalExpense <= 0" class="body-text">暂无支出数据</p>
    <div v-else class="expense-analysis-content">
      <div class="donut-wrap">
        <svg class="donut-chart" viewBox="0 0 120 120" role="img" aria-label="支出分类环形图">
          <circle class="donut-track" cx="60" cy="60" r="42" />
          <circle
            v-for="segment in donutSegments"
            :key="segment.key"
            class="donut-segment"
            :class="{ 'is-muted': activeKey && activeKey !== segment.key }"
            cx="60"
            cy="60"
            r="42"
            :stroke="segment.color"
            :stroke-dasharray="`${segment.length} ${circumference - segment.length}`"
            :stroke-dashoffset="segment.offset"
            @click="activeKey = activeKey === segment.key ? '' : segment.key"
          />
        </svg>
        <div class="donut-center">
          <span>总支出</span>
          <strong>{{ formatMoney(analysis.totalExpense) }}</strong>
        </div>
      </div>

      <div class="analysis-list">
        <button
          v-for="item in analysis.categories"
          :key="item.key"
          class="analysis-list-item"
          :class="{ 'is-active': activeKey === item.key }"
          type="button"
          @click="activeKey = activeKey === item.key ? '' : item.key"
        >
          <span class="category-dot" :style="{ backgroundColor: item.color }"></span>
          <span class="category-name">{{ item.icon }}{{ item.label }}</span>
          <span class="category-amount">{{ formatMoney(item.amount) }}（{{ formatPercent(item.percent) }}）</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatMoney, formatPercent } from '../utils/expenseAnalysis';

const props = defineProps({
  analysis: {
    type: Object,
    required: true,
  },
});

const activeKey = ref('');
const circumference = 2 * Math.PI * 42;
const donutSegments = computed(() => {
  let offset = 0;
  return (props.analysis.categories || []).map((item) => {
    const length = (item.percent / 100) * circumference;
    const segment = {
      ...item,
      length,
      offset: -offset,
    };
    offset += length;
    return segment;
  });
});
</script>

<style scoped>
.expense-analysis-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  box-shadow: var(--shadow);
}

.expense-analysis-content {
  display: grid;
  gap: 16px;
}

.donut-wrap {
  position: relative;
  width: 220px;
  max-width: 100%;
  aspect-ratio: 1;
  margin: 0 auto;
}

.donut-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-track,
.donut-segment {
  fill: none;
  stroke-width: 18;
}

.donut-track {
  stroke: #eef2f7;
}

.donut-segment {
  cursor: pointer;
  transition: opacity 0.2s ease, stroke-width 0.2s ease;
}

.donut-segment:hover,
.donut-segment.is-muted {
  opacity: 0.42;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  text-align: center;
}

.donut-center span {
  color: var(--muted);
  font-size: 12px;
}

.donut-center strong {
  margin-top: 4px;
  color: var(--text);
  font-size: 22px;
  line-height: 1.15;
}

.analysis-list {
  display: grid;
  gap: 8px;
}

.analysis-list-item {
  display: grid;
  grid-template-columns: 10px minmax(68px, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--text);
  text-align: left;
}

.analysis-list-item:hover,
.analysis-list-item.is-active {
  background: #fff;
  border-color: #cbd5e1;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.category-name,
.category-amount {
  font-size: 13px;
  font-weight: 700;
}

.category-amount {
  justify-self: end;
  color: var(--secondary);
}

@media (min-width: 640px) {
  .expense-analysis-content {
    grid-template-columns: 220px 1fr;
    align-items: center;
  }
}
</style>
