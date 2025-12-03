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
          style="width: 120px"
          clearable
        />
        <el-input
          v-model="filters.lineId"
          placeholder="线路ID"
          size="small"
          style="width: 120px"
          clearable
        />
        <el-input
          v-model="filters.userName"
          placeholder="下级用户名"
          size="small"
          style="width: 150px"
          clearable
        />
        <!-- 新增：状态筛选 -->
        <el-select v-model="filters.status" placeholder="记录状态" size="small" style="width: 130px" clearable>
          <el-option label="待取码" :value="0" />
          <el-option label="取码中" :value="1" />
          <el-option label="成功" :value="2" />
          <el-option label="超时" :value="3" />
          <el-option label="无效" :value="4" />
        </el-select>
        <!-- 新增：扣费状态筛选 -->
        <el-select v-model="filters.charged" placeholder="扣费状态" size="small" style="width: 130px" clearable>
          <el-option label="未扣费" :value="0" />
          <el-option label="已扣费" :value="1" />
        </el-select>
        <el-date-picker
          v-model="filters.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          style="width: 260px"
        />
        <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
        <el-button size="small" @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <el-table :data="records" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="projectId" label="项目ID" width="100" align="center" />
        <el-table-column prop="userName" label="用户名" width="150" align="center" />
        <el-table-column prop="projectName" label="项目名称" width="150" align="center" />
        <el-table-column prop="lineId" label="线路ID" width="100" align="center" />
        <el-table-column prop="phoneNumber" label="手机号" min-width="140" align="center" />
        <el-table-column prop="code" label="验证码" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.code">{{ row.code }}</span>
            <el-tag type="info" v-else>未获取</el-tag>
          </template>
        </el-table-column>

        <!-- 更新：状态显示逻辑 -->
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0">待取码</el-tag>
            <el-tag type="warning" v-else-if="row.status === 1">进行中</el-tag>
            <el-tag type="success" v-else-if="row.status === 2">成功</el-tag>
            <el-tag type="danger" v-else-if="row.status === 3">超时</el-tag>
            <el-tag type="danger" v-else-if="row.status === 4">无效</el-tag>
            <el-tag type="info" v-else>未知</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注信息" min-width="260" show-overflow-tooltip />
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

// 更新：添加 status 和 charged 字段
const filters = reactive({
  projectId: '',
  lineId: '',
  userName: '',
  status: '', // '' 或 null 均可
  charged: '', // '' 或 null 均可
  dateRange: []
})

const goBack = () => router.back()

const loadRecords = async () => {
  loading.value = true
  try {
    // 构建请求参数，确保空值被正确处理（通常axios会忽略null/undefined，但传递空字符串是更明确的做法）
    const params = {
      current: pagination.page,
      size: pagination.size,
      projectId: filters.projectId || '',
      lineId: filters.lineId || '',
      userName: filters.userName || '',
      status: filters.status, // 直接传递，如果为''或null，由后端决定如何处理
      charged: filters.charged,
      startTime: filters.dateRange?.[0] || '',
      endTime: filters.dateRange?.[1] || ''
    };
    
    // 清理掉值为null或undefined的参数，避免传递给后端
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined) {
            delete params[key];
        }
    });

    const res = await getAgentSubordinateNumberRecords(params)

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

// 更新：重置新增的筛选条件
const resetFilters = () => {
  filters.projectId = ''
  filters.lineId = ''
  filters.userName = ''
  filters.status = ''
  filters.charged = ''
  filters.dateRange = []
  handleSearch()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadRecords()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadRecords()
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

.filter-card {
  border-radius: 8px;
  padding: 10px 15px;
}
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap; /* 允许换行 */
}

.table-card {
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.pagination {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>