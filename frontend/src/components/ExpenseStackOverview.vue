<template>
  <div v-if="analysis.totalExpense > 0" class="expense-stack-overview" @click.stop>
    <div class="expense-stack-total">
      总支出：{{ formatMoney(analysis.totalExpense) }} / 预算 {{ formatMoney(budget) }}
    </div>

    <div class="expense-stack-bar" aria-label="支出占比概览">
      <button
        v-for="segment in visibleSegments"
        :key="segment.key"
        class="expense-stack-segment"
        :class="{ 'is-active': activeKey === segment.key }"
        :style="{ flexBasis: `${segment.width}%`, backgroundColor: segment.color }"
        type="button"
        @click.stop="toggleSegment(segment.key)"
        @blur="activeKey = ''"
      >
        <span class="segment-tooltip">
          <strong>{{ segment.label }}</strong>
          <span>{{ formatMoney(segment.amount) }}</span>
          <span>{{ formatPercent(segment.percent) }}</span>
        </span>
      </button>
    </div>

    <p class="expense-stack-summary">
      <span v-for="(item, index) in analysis.topCategories" :key="item.key">
        <template v-if="index"> | </template>{{ item.label }}{{ formatPercent(item.percent) }}
      </span>
    </p>
  </div>
  <p v-else class="helper-text expense-stack-empty">暂无支出数据</p>
</template>

<script setup>
import { computed, ref } from 'vue';
import { formatMoney, formatPercent } from '../utils/expenseAnalysis';

const props = defineProps({
  analysis: {
    type: Object,
    required: true,
  },
  budget: {
    type: [Number, String],
    default: 0,
  },
});

const activeKey = ref('');
const visibleSegments = computed(() => {
  const minWidth = 5;
  const segments = props.analysis.categories || [];
  const smallSegments = segments.filter((item) => item.percent > 0 && item.percent < minWidth);
  const fixedWidth = smallSegments.length * minWidth;
  const largeTotal = segments
    .filter((item) => item.percent >= minWidth)
    .reduce((sum, item) => sum + item.percent, 0);

  return segments.map((item) => {
    const width = item.percent < minWidth
      ? minWidth
      : (item.percent / largeTotal) * Math.max(0, 100 - fixedWidth);
    return { ...item, width };
  });
});

function toggleSegment(key) {
  activeKey.value = activeKey.value === key ? '' : key;
}
</script>

<style scoped>
.expense-stack-overview {
  margin-top: 12px;
}

.expense-stack-total {
  font-size: 13px;
  color: var(--text);
  font-weight: 700;
  margin-bottom: 8px;
}

.expense-stack-bar {
  display: flex;
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #f1f5f9;
  overflow: visible;
}

.expense-stack-segment {
  position: relative;
  min-width: 6px;
  height: 12px;
  min-height: 12px;
  padding: 0;
  border: 0;
  border-radius: 0;
  cursor: pointer;
}

.expense-stack-segment:first-child {
  border-radius: 999px 0 0 999px;
}

.expense-stack-segment:last-child {
  border-radius: 0 999px 999px 0;
}

.expense-stack-segment:hover,
.expense-stack-segment:focus-visible,
.expense-stack-segment.is-active {
  filter: brightness(0.94);
  outline: none;
}

.segment-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 2;
  display: none;
  min-width: 88px;
  transform: translateX(-50%);
  padding: 8px 10px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  white-space: nowrap;
}

.segment-tooltip span,
.segment-tooltip strong {
  display: block;
}

.expense-stack-segment:hover .segment-tooltip,
.expense-stack-segment:focus-visible .segment-tooltip,
.expense-stack-segment.is-active .segment-tooltip {
  display: block;
}

.expense-stack-summary {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.expense-stack-empty {
  margin-top: 12px;
}
</style>
