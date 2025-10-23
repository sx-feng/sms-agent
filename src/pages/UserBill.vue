<template>
  <div class="user-bill">
    <el-card>
      <template #header>
        <div class="flex-between">
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
        <el-table-column prop="time" label="时间" width="180" />
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
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'
import{UserLedger} from '@/api/agent'

// 模拟分页账单数据
const billList = ref([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const dateRange = ref([])
const searchUser = ref('')
const fetchBills = async () => {
  // 必填校验：ID 或 日期至少填一个
  if (!searchUser.value || (!dateRange.value || dateRange.value.length !== 2)) {
    ElMessage.warning('请输入下级账号ID 和 选择时间范围')
    return
  }

  const params = {
    targetUserId: searchUser.value ? Number(searchUser.value) : undefined,
    startTime: dateRange.value?.[0] || undefined,
    endTime: dateRange.value?.[1] || undefined,
    page: currentPage.value,
    size: pageSize.value
  }

  const res = await UserLedger(params)
  if (!res.ok) {
    ElMessage.error(res.message || '获取账单失败')
    return
  }

  // 后端字段 → 表格字段 一次性映射
  billList.value = (res.data.records || []).map(i => ({
    id: i.id,
    user: i.userId || '',
    type: i.price > 0 ? 'recharge' : 'consume',
    amount: Number(i.price),
    balance: Number(i.balance || 0),
    remark: i.description || i.remark || '--',
    time: i.createTime || i.time
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
    时间: item.time
  }))
  const worksheet = XLSX.utils.json_to_sheet(sheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单明细')
  XLSX.writeFile(workbook, `用户账单_${searchUser.value || '全部'}.xlsx`)
  ElMessage.success('导出成功')
}

fetchBills()
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
</style>
