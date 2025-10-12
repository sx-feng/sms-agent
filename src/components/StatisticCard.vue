<template>
  <div class="statistic-card">
    <div class="icon-box" :class="colorClass">
      <el-icon :size="28">
        <component :is="icon" />
      </el-icon>
    </div>

    <div class="content-box">
      <div class="title">{{ title }}</div>
      <div class="value">{{ value }}</div>
    </div>
  </div>
</template>

<script setup>
/**
 * 统计卡片组件
 * props：
 * - title：统计标题（字符串）
 * - value：统计值（字符串或数字）
 * - icon：图标组件（Element Plus 图标）
 * - color：可选，图标背景颜色（默认 primary）
 */

import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: [String, Object], required: true },
  color: { type: String, default: 'primary' }
})

const colorClass = computed(() => {
  return `color-${props.color}`
})
</script>

<style scoped>
.statistic-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}
.statistic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-box {
  border-radius: 10px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-box {
  flex: 1;
  text-align: right;
}

.title {
  font-size: 14px;
  color: #666;
}

.value {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-top: 4px;
}

/* 不同颜色主题 */
.color-primary {
  background-color: #ecf5ff;
  color: #409eff;
}
.color-success {
  background-color: #f0f9eb;
  color: #67c23a;
}
.color-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}
.color-danger {
  background-color: #fef0f0;
  color: #f56c6c;
}
</style>
