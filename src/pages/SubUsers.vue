<template>
  <div class="sub-users-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 10px;">
        <el-button type="info" size="small" @click="goBack">返回</el-button>
        <h2>下级管理</h2>
      </div>

      <div style="display: flex; align-items: center; gap: 10px;">
        <el-input 
          v-model="searchUserName" 
          placeholder="根据用户名模糊查询" 
          clearable 
          size="small" 
          style="width: 160px" 
          @keyup.enter="getUserList" 
        />
        <el-button type="primary" size="small" @click="getUserList">查询</el-button>
        <el-button type="success" size="small" @click="() => { searchUserName = ''; getUserList(); }">刷新</el-button>
        
        <!-- 新增：批量删除按钮 -->
        <el-button 
          type="danger" 
          size="small" 
          :disabled="selectedIds.length === 0" 
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        
        <el-button type="primary" size="small" @click="openEditDialog()">新增下级</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <!-- 修改：添加 @selection-change 事件监听 -->
    <el-table 
      :data="tableData" 
      border 
      style="width: 100%" 
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <!-- 新增：多选框列 -->
      <el-table-column type="selection" width="55" align="center" />
      
      <!-- 这里的prop="id" 假设后端返回的主键字段名为 id -->
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="userName" label="用户名" />
      <!-- 创建时间 -->
      <el-table-column prop="createTime" label="注册时间" width="180" />
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus' // 引入 ElMessageBox
import UserEditDialog from '../components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'
import UserRecharge from '../components/UserRecharge.vue'
// 引入批量删除 API
import { listAgentUsers, deleteAgentUsers } from '@/api/agent' 

const router = useRouter()
const searchUserName = ref('')
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 新增：存储选中的 ID 列表
const selectedIds = ref([])

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

    if (res.code === 200 && res.data) {
      tableData.value = res.data.records || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '加载数据失败')
    }
  } catch (error) {
    ElMessage.error('加载数据失败，请检查网络')
    console.error('请求失败', error)
  } finally {
    loading.value = false
  }
}

// 新增：处理表格多选变化
function handleSelectionChange(selection) {
  // 提取选中行的 id 放入 selectedIds 数组
  selectedIds.value = selection.map(item => item.id)
}

// 新增：处理批量删除
async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return

  try {
    // 弹出确认框
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个用户吗？此操作不可恢复，且会删除关联的项目配置。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 用户点击确定后，执行删除请求
    loading.value = true
    const res = await deleteAgentUsers(selectedIds.value)
    
    if (res.code === 200) {
      ElMessage.success('删除成功')
      // 清空选中状态（虽然刷新列表通常会重置，但手动清空更安全）
      selectedIds.value = []
      // 刷新列表
      getUserList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
    // 捕获取消点击或网络错误
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('操作失败')
    }
  } finally {
    loading.value = false
  }
}

watch(page, () => {
  getUserList()
})

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

function openEditDialog(user = null) {
  currentUser.value = user
  editDialogVisible.value = true
}

function openRecordDialog(row) {
  currentUser.value = row
  recordDialogVisible.value = true
}

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
  justify-content: flex-end; 
  margin-top: 20px;
}
</style>