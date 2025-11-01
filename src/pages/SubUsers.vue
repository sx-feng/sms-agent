<template>
  <div class="sub-users-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
  <div style="display: flex; align-items: center; gap: 10px;">
    <el-button type="info" size="small" @click="goBack">⬅ 返回</el-button>
    <h2>👥 下级管理</h2>
  </div>

  <div style="display: flex; align-items: center; gap: 10px;">
    <el-input
      v-model="searchUserName"
      placeholder="输入下级用户名"
      clearable
      size="small"
      style="width: 160px"
    />
    <el-button type="primary" size="small" @click="getUserList">🔍 查询</el-button>
    <el-button type="success" size="small" @click="getUserList">🔄 刷新</el-button>
    <el-button type="primary" size="small" @click="openEditDialog()">➕ 新增下级</el-button>
  </div>

</div>


    <!-- 表格 -->
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      v-loading="loading"
      resizable="false"     
    >
      <el-table-column prop="userName" label="用户名"  />
      <el-table-column prop="balance" label="余额"  />
      <el-table-column prop="status" label="状态" >
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalGetCount" label="取号数"  />
      <el-table-column label="回码率">
  <template #default="{ row }">
    {{ formatRate(row.totalCodeRate) }}
  </template>
</el-table-column>

      <el-table-column label="代理" >
  <template #default="{ row }">
    <el-tag :type="row.isAgent ? 'success' : 'info'">
      {{ row.isAgent ? '是' : '否' }}
    </el-tag>
  </template>
</el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="260">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="goRecharge(row)">充值</el-button>
<el-button size="small" type="info" @click="openRecordDialog(row)">账单</el-button>
          
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
<EditDialog v-model="addDialogVisible"    @updated="getUserList"/>
    <!-- 弹窗组件（仅在显示时渲染，避免 Teleport 异常） -->
    <UserEditDialog v-if="editDialogVisible" v-model="editDialogVisible" :user="currentUser" @updated="getUserList" />
    <RecordDialog v-if="recordDialogVisible" v-model="recordDialogVisible" :user="currentUser" />
    <UserRecharge
  v-if="rechargeDialogVisible"
  v-model="rechargeDialogVisible"
  :user-id-prop="currentUser?.id"
  @success="getUserList"
  @updated="getUserList"
/>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {  ElMessage } from 'element-plus'
import UserEditDialog from '../components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'
import EditDialog from '@/components/EditDialog.vue'


// eslint-disable-next-line no-unused-vars
import { listAgentUsers, createAgentUser, updateAgentUser, rechargeAgentUser, deductAgentUser } from '@/api/agent'
import UserRecharge from '../components/UserRecharge.vue'
const rechargeDialogVisible = ref(false)
const searchUserName = ref('')

// 数据加载
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const router = useRouter()
const addDialogVisible = ref(false)
const editDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const currentUser = ref(null)  // 当前编辑或新增的用户
const detailLoading = ref(false)


function goBack() {
  // 如果有上级路由历史，优先返回
  if (window.history.length > 1) {
    router.back()
  } else {
    // 否则直接返回到代理控制面板（或自定义首页路径）
    router.push('/reseller/dashboard')
  }
}

// 获取下级用户数据
async function getUserList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    }

    // ✅ 如果输入了用户名就带上查询条件
    if (searchUserName.value) {
      params.userName = searchUserName.value.trim()
    }

    const res = await listAgentUsers(params)
    console.log(res.data, "代理端口管理下级用户所有数据")

    if (res.ok) {
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '加载数据失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('加载数据失败，请稍后重试')
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

// ===========回码率转换
function formatRate(value) {
  if (value == null || isNaN(value)) return '--'
  // 如果是 0-1 之间的小数，比如 0.85 → 85%
  // 如果已经是百分比数字，比如 85 → 85%
  const rate = value <= 1 ? value * 100 : value
  return `${rate.toFixed(0)}%`
}


onMounted(() => {
  getUserList()
})

// 打开编辑弹窗（新增或编辑）
async function openEditDialog(user = null) {
  if (user && user.id) {
    await loadUserDetail(user.id) 
      currentUser.value = user
    editDialogVisible.value = true
  } else {
   currentUser.value = null
    addDialogVisible.value = true
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
function openRecordDialog(row) {
  currentUser.value = row         // ✅ 整行传，组件里用 row.id
  recordDialogVisible.value = true
}
// 充值页面
function goRecharge(row) {
  currentUser.value = row
  rechargeDialogVisible.value = true
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
