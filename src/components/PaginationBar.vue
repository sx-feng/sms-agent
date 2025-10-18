<template>
  <div class="pagination-bar">
    <el-pagination
      background
      layout="total, prev, pager, next, sizes, jumper"
      :page-sizes="pageSizes"
      :page-size="pageSize"
      :total="total"
      :current-page="currentPage"
      @update:page-size="onPageSizeChange"
      @update:current-page="onPageChange"
    />
  </div>
</template>

<script setup>
// import { computed } from 'vue'

// ✅ 接收参数
const props = defineProps({
  total: { type: Number, default: 0 },
  pageSize: { type: Number, default: 10 },
  currentPage: { type: Number, default: 1 },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
})

// ✅ 向父组件抛出事件
const emit = defineEmits(['update:pageSize', 'update:currentPage', 'change'])

// ✅ 当页码改变时
function onPageChange(page) {
  emit('update:currentPage', page)
  emit('change', { page, pageSize: props.pageSize })
}

// ✅ 当每页数量改变时
function onPageSizeChange(size) {
  emit('update:pageSize', size)
  emit('change', { page: 1, pageSize: size }) // 重置到第一页
}
</script>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: center;
  padding: 15px 0;
  background: #fff;
}
</style>
