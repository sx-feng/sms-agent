<template>
  <div class="sub-users-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-button type="info" size="small" @click="goBack">返回</el-button>
        <h2>下级管理</h2>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        <el-input v-model="searchUserName" placeholder="根据用户名模糊查询" clearable size="small" style="width: 160px" @keyup.enter="getUserList" />
        <el-button type="primary" size="small" @click="getUserList">查询</el-button>
        <el-button type="success" size="small" @click="() => { searchUserName = ''; getUserList(); }">刷新</el-button>
        <el-button type="primary" size="small" @click="openEditDialog()">新增下级</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" border style="width: 100%" v-loading="loading">
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="balance" label="余额" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalGetCount" label="取号数" />
      <el-table-column label="回码率">
        <template #default="{ row }">
          {{ formatRate(row.totalCodeRate) }}
        </template>
      </el-table-column>
      <el-table-column label="代理">
        <template #default="{ row }">
          <el-tag :type="row.isAgent ? 'success' : 'info'">
            {{ row.isAgent ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="openRechargeDialog(row, 'recharge')">充值</el-button>
          <el-button size="small" type="danger" @click="openRechargeDialog(row, 'deduct')">扣款</el-button>
          <el-button size="small" type="info" @click="openRecordDialog(row)">账单</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
<!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination 
        v-model:current-page="page" 
        v-model:page-size="pageSize"
        :page-sizes="[10, 50, 100]"
        :total="total" 
        layout="total, sizes, prev, pager, next, jumper"
      /> 
    </div>

    <!-- 弹窗组件 -->
    <UserEditDialog 
      v-if="editDialogVisible" 
      v-model="editDialogVisible" 
      :user="currentUser" 
      @updated="getUserList" 
    />
    <RecordDialog v-if="recordDialogVisible" v-model="recordDialogVisible" :user="currentUser" />
    <!-- 父组件 Template 底部 -->
    <UserRecharge
      v-if="rechargeDialogVisible"
      v-model="rechargeDialogVisible"
      :user-info="currentUser" 
      :action-type-prop="currentActionType"
      @success="getUserList"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue' // 1. 导入 watch
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import UserEditDialog from '../components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'
import UserRecharge from '../components/UserRecharge.vue'
import { listAgentUsers } from '@/api/agent'

const router = useRouter()
const searchUserName = ref('')
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const editDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)
const currentUser = ref(null)
const currentActionType = ref('recharge')

function goBack() {
  router.back()
}

// 获取下级用户数据
async function getUserList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      size: pageSize.value,
      userName: searchUserName.value.trim() || ''
    }
    const res = await listAgentUsers(params)

    // --- 开始调试 ---
    console.log('API返回的原始响应:', res);
    if (res.code === 200 && res.data) {
      console.log('即将用来更新表格的数据:', res.data.records);
      console.log('更新前的 tableData:', JSON.parse(JSON.stringify(tableData.value))); // 使用JSON深拷贝来查看快照
      
      tableData.value = res.data.records || [];
      total.value = res.data.total || 0;

      console.log('更新后的 tableData:', tableData.value);
    }
    // --- 结束调试 ---
    else {
      ElMessage.error(res.message || '加载数据失败')
    }
  } catch (error) {
    ElMessage.error('加载数据失败，请检查网络')
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

// 2. 删除 handlePageChange 函数

// 3. 添加 watch 来侦听 page 的变化
watch(page, () => {
  getUserList()
})

// 新增：侦听 pageSize 变化
watch(pageSize, () => {
  if (page.value === 1) {
    getUserList()
  } else {
    page.value = 1
  }
})

function formatRate(value) {
  if (value == null || isNaN(value)) return '--'
  const rate = value <= 1 ? value * 100 : value
  return `${rate.toFixed(0)}%`
}

onMounted(() => {
  getUserList()
})

// 打开通用编辑/新增弹窗
function openEditDialog(user = null) {
  currentUser.value = user
  editDialogVisible.value = true
}

// 打开账单弹窗
function openRecordDialog(row) {
  currentUser.value = row
  recordDialogVisible.value = true
}
// 打开充值/扣款弹窗
function openRechargeDialog(row, action) {
  currentUser.value = row
  currentActionType.value = action
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
  justify-content: flex-end; /* 推荐右对齐 */
  margin-top: 20px;
}
</style>