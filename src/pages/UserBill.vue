<template>
  <div class="sub-users-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <h2>👥 下级管理</h2>
      <el-button type="primary" size="small" @click="openEditDialog()">➕ 新增下级</el-button>
    </div>

    <!-- 表格 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      v-loading="loading"
    >
      <el-table-column prop="userId" label="用户ID" width="120" />
      <el-table-column prop="balance" label="余额" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="takeCount" label="取号数" width="100" />
      <el-table-column prop="replyRate" label="回码率" width="100" />
      <el-table-column prop="priceJson" label="项目价格JSON" min-width="200">
        <template #default="{ row }">
          <el-tooltip placement="top" :content="JSON.stringify(row.priceJson)">
            <el-text truncated>{{ JSON.stringify(row.priceJson) }}</el-text>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="goRecharge(row)">充值</el-button>
          <el-button size="small" type="info" @click="openRecordDialog(row)">账单</el-button>
          <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="getUserList"
      />
    </div>

    <!-- 弹窗组件 -->
    <UserEditDialog v-model="editDialogVisible" :user="currentUser" @updated="getUserList" />
    <RecordDialog v-model="recordDialogVisible" :user="currentUser" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import UserEditDialog from '@/components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'

// 模拟数据加载
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const router = useRouter()

const editDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const currentUser = ref(null)

// 模拟接口请求
async function getUserList() {
  loading.value = true
  // 模拟延迟
  await new Promise(r => setTimeout(r, 500))
  // 模拟数据
  tableData.value = Array.from({ length: 10 }, (_, i) => ({
    userId: 1000 + i,
    balance: (Math.random() * 100).toFixed(2),
    status: Math.random() > 0.3 ? 1 : 0,
    takeCount: Math.floor(Math.random() * 1000),
    replyRate: (Math.random() * 100).toFixed(1) + '%',
    priceJson: { xhs: 0.6, dy: 0.8, tb: 1.2 },
  }))
  total.value = 100
  loading.value = false
}

onMounted(() => {
  getUserList()
})

// 打开编辑弹窗
function openEditDialog(user = null) {
  currentUser.value = user
  editDialogVisible.value = true
}

// 打开账单弹窗
function openRecordDialog(user) {
  currentUser.value = user
  recordDialogVisible.value = true
}

// 跳转充值页
function goRecharge(user) {
  router.push({ path: '/reseller/recharge', query: { userId: user.userId } })
}

// 删除下级
function deleteUser(user) {
  ElMessageBox.confirm(`确定删除用户 ${user.userId} 吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      tableData.value = tableData.value.filter(u => u.userId !== user.userId)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<style scoped>
.sub-users-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-bar {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
</style>
