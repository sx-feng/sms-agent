<template>
  <div class="records-page">
    <!-- 返回按钮单独一行 -->
    <div class="back-row">
      <el-button type="info" size="small" @click="goBack">⬅ 返回</el-button>
    </div>

    <!-- 页面标题和刷新 -->
    <div class="page-header">
      <h2>📱 下级用户取号记录</h2>
      <el-button type="primary" size="small" @click="loadRecords" :loading="loading">
        🔄 刷新数据
      </el-button>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card" shadow="hover">
      <div class="filter-bar">
        <el-input
          v-model="filters.projectId"
          placeholder="项目ID"
          size="small"
          style="width: 140px"
          clearable
        />
        <el-input
          v-model="filters.lineId"
          placeholder="线路ID"
          size="small"
          style="width: 140px"
          clearable
        />
        <el-input
          v-model="filters.userName"
          placeholder="下级用户名"
          size="small"
          style="width: 180px"
          clearable
        />
          <el-date-picker
    v-model="filters.dateRange"
    type="daterange"
    range-separator="至"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    size="small"
    style="width: 280px"
  />
        <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <el-table :data="records" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="projectId" label="项目ID" width="100" align="center" />
        <el-table-column prop="lineId" label="线路ID" width="100" align="center" />
        <el-table-column prop="phoneNumber" label="手机号" min-width="140" align="center" />
        <el-table-column prop="code" label="验证码" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.code">{{ row.code }}</span>
            <el-tag type="info" v-else>未获取</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" v-if="row.status === 2">成功</el-tag>
            <el-tag type="warning" v-else-if="row.status === 1">进行中</el-tag>
            <el-tag type="danger" v-else>失败</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注信息" min-width="260" show-overflow-tooltip />
        <!-- <el-table-column prop="errorInfo" label="错误信息" min-width="200" show-overflow-tooltip /> -->

        <el-table-column prop="getNumberTime" label="取号时间" width="180" align="center" />
        <el-table-column prop="codeReceivedTime" label="取码时间" width="180" align="center" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
   <el-pagination
  background
  layout="total, sizes, prev, pager, next, jumper"
  :total="pagination.total"
  :page-size="pagination.size"
  :current-page="pagination.page"
  :page-sizes="[10, 20, 50, 100]"   
  @current-change="handlePageChange"
  @size-change="handleSizeChange"  
/>

      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getAgentSubordinateNumberRecords } from '@/api/agent'

const router = useRouter()
const loading = ref(false)
const records = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const handlePageChange = (page) => {
  pagination.page = page
  loadRecords()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadRecords()
}

const filters = reactive({
  projectId: '',
  lineId: '',
  userName: '',
   dateRange: []
})

const goBack = () => router.back()

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await getAgentSubordinateNumberRecords({
      current: pagination.page,
      size: pagination.size,
      projectId: filters.projectId,
      lineId: filters.lineId,
      userName: filters.userName,
       startTime: filters.dateRange?.[0] || '',
  endTime: filters.dateRange?.[1] || ''
    })
    if (res.code === 200 && res.data) {
      records.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取记录失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络异常，无法获取记录')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadRecords()
}

const resetFilters = () => {
  filters.projectId = ''
  filters.lineId = ''
  filters.userName = ''
  handleSearch()
}

onMounted(loadRecords)
</script>

<style scoped>
.records-page {
  min-height: 100vh;
  padding: 20px;
  background: #f8faff;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 返回按钮单独一行 */
.back-row {
  display: flex;
  justify-content: flex-start;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 14px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}
.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

/* 筛选 */
.filter-card {
  border-radius: 8px;
  padding: 10px 15px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 表格 */
.table-card {
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* 分页 */
.pagination {
  margin-top: 15px;
  text-align: right;
}
</style>
