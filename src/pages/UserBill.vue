<template>
  <div class="user-bill">
    <el-card>
      <template #header>
        <div class="flex-between">
           <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
          <span>下级账单明细</span>
          <div class="filters">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 260px"
            />
            <el-input
              v-model="searchUser"
              placeholder="输入下级账号ID"
              style="width: 180px; margin-left: 10px;"
            />
            <el-button type="primary" @click="fetchBills">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
            <el-button type="success" @click="exportExcel">导出Excel</el-button>
          </div>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width: 100%">
        <el-table-column prop="id" label="账单ID" width="100" />
        <el-table-column prop="user" label="用户账号" width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'recharge'" type="success">充值</el-tag>
            <el-tag v-else-if="row.type === 'consume'" type="danger">消费</el-tag>
            <el-tag v-else>其他</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.amount < 0 ? '#f56c6c' : '#67c23a' }">
              {{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" />
        <el-table-column prop="remark" label="备注" min-width="180" />
        <el-table-column prop="timestamp" label="时间" width="180" />
      </el-table>

      <div class="pagination">
      <el-pagination
  background
  layout="prev, pager, next, jumper, sizes, total"
  :current-page="currentPage"
  :page-size="pageSize"
  :total="total"
  @size-change="size => { pageSize = size; fetchBills() }"
  @current-change="handlePageChange"
/>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import{UserLedger} from '@/api/agent'
import { useRouter } from 'vue-router'
const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/reseller/sub-users') // 无历史记录时回到下级管理页
  }
}

// 模拟分页账单数据
const billList = ref([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const dateRange = ref([])
const searchUser = ref('')
const fetchBills = async () => {
  // ✅ 不再强制输入条件：支持显示全部账单
  const params = {
    page: currentPage.value,
    size: pageSize.value,
  }

  // 如果选择了用户ID或日期范围，就带上参数
  if (searchUser.value) params.targetUserId = Number(searchUser.value)
  if (dateRange.value && dateRange.value.length === 2) {
    params.startTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }

  const res = await UserLedger(params)
  if (!res.ok) {
    ElMessage.error(res.message || '获取账单失败')
    return
  }

  billList.value = (res.data.records || []).map(i => ({
    id: i.id,
    user: i.userId || '',
    type: i.price > 0 ? 'recharge' : 'consume',
    amount: Number(i.price),
    balance: Number(i.balance || 0),
    remark: i.description || i.remark || '--',
     timestamp: i.timestamp || i.createTime || '--'
  }))
  total.value = res.data.total || 0
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchBills()
}

const resetFilter = () => {
  dateRange.value = []
  searchUser.value = ''
  fetchBills()
}

const exportExcel = () => {
  if (!billList.value.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const sheetData = billList.value.map(item => ({
    账单ID: item.id,
    用户账号: item.user,
    类型: item.type === 'recharge' ? '充值' : item.type === 'consume' ? '消费' : '其他',
    金额: item.amount,
    余额: item.balance,
    备注: item.remark,
    时间: item.timestamp
  }))
  const worksheet = XLSX.utils.json_to_sheet(sheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单明细')
  XLSX.writeFile(workbook, `用户账单_${searchUser.value || '全部'}.xlsx`)
  ElMessage.success('导出成功')
}

onMounted(() => {
  fetchBills()
})
</script>

<style scoped>
.user-bill {
  padding: 20px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filters {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
.left-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f6c244;
  color: #000;
  border-color: #f6c244;
}

.header-title {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

</style>
