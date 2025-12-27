<template>
  <div class="sub-users-page">
    <!-- 顶部操作栏 (保持不变) -->
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
        
        <!-- <el-button 
          type="danger" 
          size="small" 
          :disabled="selectedIds.length === 0" 
          @click="handleBatchDelete"
        >
          批量删除
        </el-button> -->
        
        <el-button type="primary" size="small" @click="openEditDialog()">新增下级</el-button>
      </div>
    </div>

    <!-- 表格 (保持不变) -->
    <el-table 
      :data="tableData" 
      border 
      style="width: 100%" 
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <!-- <el-table-column type="selection" width="55" align="center" /> -->
      <el-table-column prop="id" label="ID" width="80" sortable />
      <el-table-column prop="userName" label="用户名" />
      <el-table-column prop="createTime" label="注册时间" width="180" />
      <!-- 价格模板id templateId -->
      <el-table-column prop="templateId" label="价格模板ID" />
      <!-- 价格模板名称 templateName -->
      <el-table-column prop="templateName" label="价格模板名称" />
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

      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="openRechargeDialog(row, 'recharge')">充值</el-button>
          <el-button size="small" type="danger" @click="openRechargeDialog(row, 'deduct')">扣款</el-button>
          <el-button size="small" type="info" @click="openRecordDialog(row)">账单</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 (保持不变) -->
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
    <!-- 【修复重点】：移除了 v-if="editDialogVisible" -->
    <!-- 只需要 v-model 控制即可，子组件 UserEditDialog 内部的 el-dialog 的 @open 事件才能正常触发 -->
    <UserEditDialog 
      v-model="editDialogVisible" 
      :user="currentUser" 
      @updated="getUserList" 
    />

    <!-- 其他弹窗可以保留 v-if，如果它们内部使用的是 onMounted 而不是 @open -->
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
// Script 部分无需修改，保持原样即可
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserEditDialog from '../components/UserEditDialog.vue'
import RecordDialog from '../components/RecordDialog.vue'
import UserRecharge from '../components/UserRecharge.vue'
import { listAgentUsers, deleteAgentUsers } from '@/api/agent' 

const router = useRouter()
const searchUserName = ref('')
const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedIds = ref([])

const editDialogVisible = ref(false)
const recordDialogVisible = ref(false)
const rechargeDialogVisible = ref(false)
const currentUser = ref(null)
const currentActionType = ref('recharge')

function goBack() {
  router.back()
}

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

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.id)
}
// eslint-disable-next-line no-unused-vars
async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个用户吗？此操作不可恢复，且会删除关联的项目配置。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    const res = await deleteAgentUsers(selectedIds.value)
    
    if (res.code === 200) {
      ElMessage.success('删除成功')
      selectedIds.value = []
      getUserList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error) {
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