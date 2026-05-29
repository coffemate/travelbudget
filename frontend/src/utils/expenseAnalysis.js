export const CATEGORY_CONFIG = [
  { key: 'hotel', label: '住宿', color: '#3b82f6', icon: '🏨' },
  { key: 'transport', label: '交通', color: '#10b981', icon: '🚗' },
  { key: 'food', label: '餐饮', color: '#f59e0b', icon: '🍜' },
  { key: 'ticket', label: '娱乐', color: '#ef4444', icon: '🎮' },
  { key: 'shopping', label: '购物', color: '#8b5cf6', icon: '🛍' },
  { key: 'general', label: '其他', color: '#6b7280', icon: '📦' },
];

const CATEGORY_MAP = new Map(CATEGORY_CONFIG.map((item) => [item.key, item]));

export function normalizeCategory(category) {
  return CATEGORY_MAP.has(category) ? category : 'general';
}

export function getCategoryConfig(category) {
  return CATEGORY_MAP.get(normalizeCategory(category));
}

export function getExpenseAmount(expense) {
  if (!expense) return 0;
  const baseAmount = Number(expense.amount_in_base);
  if (Number.isFinite(baseAmount)) return baseAmount;

  const amount = Number(expense.amount || 0);
  const rate = Number(expense.fx_rate_to_base || 1);
  return Number.isFinite(amount * rate) ? amount * rate : 0;
}

export function buildExpenseAnalysis(expenses = []) {
  const totals = Object.fromEntries(CATEGORY_CONFIG.map((item) => [item.key, 0]));

  expenses.forEach((expense) => {
    const key = normalizeCategory(expense.category);
    totals[key] += getExpenseAmount(expense);
  });

  const totalExpense = Object.values(totals).reduce((sum, amount) => sum + amount, 0);
  const categories = CATEGORY_CONFIG.map((item) => {
    const amount = totals[item.key] || 0;
    return {
      ...item,
      amount,
      percent: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    };
  }).filter((item) => item.amount > 0);

  const topCategories = [...categories]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    totalExpense,
    categoryTotals: totals,
    categoryPercentages: Object.fromEntries(categories.map((item) => [item.key, item.percent])),
    categories,
    topCategories,
  };
}

export function formatMoney(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}
