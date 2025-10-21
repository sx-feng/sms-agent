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
      <el-table-column prop="id" label="用户ID" width="120" />
      <el-table-column prop="balance" label="余额" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalGetCount" label="取号数" width="100" />
      <el-table-column prop="totalCodeRate" label="回码率" width="100" />
      <!-- todo项目价格是null -->
   <el-table-column label="项目价格JSON" min-width="200">
      <template #default="{ row }">
        <el-tooltip placement="top" :content="JSON.stringify(row.priceJson)">
        <div v-for="(price, id) in row.projectPrices || {}" :key="id">
  <strong>{{ id }}:</strong> {{ price }}
</div>
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
import UserEditDialog from '../components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'
// eslint-disable-next-line no-unused-vars
import { listAgentUsers, createAgentUser, updateAgentUser, rechargeAgentUser, deductAgentUser } from '@/api/agent'

// 数据加载
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const router = useRouter()

const editDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const currentUser = ref(null)  // 当前编辑或新增的用户
const detailLoading = ref(false)

// 获取下级用户数据
async function getUserList() {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    console.log('Token:', token)

    const res = await listAgentUsers({ page: page.value, pageSize: pageSize.value })
    console.log(res.data, "代理端口管理下级用户所有数据")

    if (res.ok) {
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error('加载数据失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('加载数据失败，请稍后重试')
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getUserList()
})

// 打开编辑弹窗（新增或编辑）
function openEditDialog(user = null) {
  if (user && (user.userId || user.id)) {
    const id = user.userId || user.id
    loadUserDetail(id)
  } else {
    currentUser.value = null
    editDialogVisible.value = true
  }
}

async function loadUserDetail(userId) {
  try {
    detailLoading.value = true
    const res = await listAgentUsers({ userId })
    if (!res.ok) {
      ElMessage.error(res.message || '获取用户详情失败')
      editDialogVisible.value = true
      return
    }

    let user = null
    const data = res.data
    if (Array.isArray(data?.records)) {
      user = data.records.find(u => String(u.userId ?? u.id) === String(userId)) || data.records[0]
    } else if (Array.isArray(data?.list)) {
      user = data.list.find(u => String(u.userId ?? u.id) === String(userId)) || data.list[0]
    } else if (Array.isArray(data)) {
      user = data.find(u => String(u.userId ?? u.id) === String(userId)) || data[0]
    } else if (data && typeof data === 'object') {
      user = data
    }

    if (!user) {
      ElMessage.warning('未找到该用户的详细信息')
    }

    currentUser.value = normalizeUser(user)
    editDialogVisible.value = true
  } catch (e) {
    ElMessage.error('网络异常，获取用户详情失败')
    editDialogVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

function normalizeUser(u) {
  if (!u) return null
  const priceStr = typeof u.priceJson === 'string' ? u.priceJson : JSON.stringify(u.priceJson || u.projectPrices || {})
  return { ...u, priceJson: priceStr }
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
