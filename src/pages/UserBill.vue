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
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
            <el-input
              v-model="searchUser"
              placeholder="输入下级账号"
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
          layout="prev, pager, next"
          :page-size="pageSize"
          :total="total"
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

// 模拟分页账单数据
const billList = ref([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const dateRange = ref([])
const searchUser = ref('')

const fetchBills = async () => {
  // ✅ 示例：实际使用时请替换为 axios 请求
  // const res = await axios.post('/api/user/bill', {
  //   user: searchUser.value,
  //   start: dateRange.value[0],
  //   end: dateRange.value[1],
  //   page: currentPage.value,
  //   size: pageSize.value
  // })
  // billList.value = res.data.list
  // total.value = res.data.total

  billList.value = [
    { id: 1, user: 'agent001', type: 'recharge', amount: 200, balance: 500, remark: '上级充值', time: '2025-10-18 10:00:00' },
    { id: 2, user: 'agent001', type: 'consume', amount: -50, balance: 450, remark: '购买短信', time: '2025-10-18 10:10:00' },
    { id: 3, user: 'agent001', type: 'consume', amount: -20, balance: 430, remark: '项目扣费', time: '2025-10-18 11:00:00' },
  ]
  total.value = 3
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
