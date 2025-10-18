<template>
  <div class="user-table-wrapper">
    <el-table
      :data="users"
      border
      stripe
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="balance" label="余额" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="takeCount" label="取号数" width="100" />
      <el-table-column prop="replyRate" label="回码率" width="100" />
      <el-table-column prop="priceJson" label="项目价格" min-width="180">
        <template #default="{ row }">
          <el-tooltip placement="top" :content="JSON.stringify(row.priceJson)">
            <el-text truncated>{{ JSON.stringify(row.priceJson) }}</el-text>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="$emit('edit', row)">编辑</el-button>
          <el-button size="small" type="success" @click="$emit('recharge', row)">充值</el-button>
          <el-button size="small" type="info" @click="$emit('bill', row)">账单</el-button>
          <el-button size="small" type="danger" @click="$emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <PaginationBar
      v-model:currentPage="currentPage"
      v-model:pageSize="pageSize"
      :total="total"
      @change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import PaginationBar from '@/components/PaginationBar.vue'

const props = defineProps({
  users: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 }
})

const emit = defineEmits(['update:page', 'update:pageSize', 'page-change', 'edit', 'recharge', 'bill', 'delete'])

const currentPage = ref(props.page)
const pageSize = ref(props.pageSize)

watch(() => props.page, val => currentPage.value = val)
watch(() => props.pageSize, val => pageSize.value = val)

function handlePageChange({ page, pageSize }) {
  emit('update:page', page)
  emit('update:pageSize', pageSize)
  emit('page-change', { page, pageSize })
}
</script>

<style scoped>
.user-table-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 10px;
}
</style>
