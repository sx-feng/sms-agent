<template>
  <div class="user-bill">
    <el-card>
      <template #header>
        <div class="flex-between">
          <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
          <span>下级账单明细</span>
          <div class="filters">
            <el-input
              v-model="userName"
              placeholder="用户名查询"
              style="width: 160px;"
              clearable
            />
            
            <!-- 修改：资金类型筛选，使用 v-for 动态渲染 -->
            <el-select v-model="fundType" placeholder="资金类型" style="width: 140px;" clearable>
              <el-option
                v-for="item in fundTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <!-- 账本类型筛选 -->
            <el-select v-model="ledgerType" placeholder="账本类型" style="width: 140px;" clearable>
              <el-option label="出账" :value="0" />
              <el-option label="入账" :value="1" />
            </el-select>

            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 260px"
            />
            <el-button type="primary" @click="fetchBills">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
            <el-button type="success" @click="exportExcel">导出Excel</el-button>
          </div>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width: 100%">
        <el-table-column prop="id" label="账单ID" width="100" />
        <el-table-column prop="userName" label="用户名" width="150" />
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
import { UserLedger } from '@/api/agent'
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/reseller/sub-users')
  }
}

// 新增：根据 Java Enum FundType 定义资金类型选项
const fundTypeOptions = ref([
  { value: 0, label: '业务扣费' },
  { value: 1, label: '代理充值' },
  { value: 2, label: '代理扣款' },
  { value: 4, label: '代理回款' },
  { value: 3, label: '管理员操作' }
])

const userName = ref(localStorage.getItem('userName') || '')
const billList = ref([])
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const dateRange = ref([])
const searchUser = ref('')

// 为筛选条件创建 ref
const fundType = ref(null) // 使用 null 代表 "全部"
const ledgerType = ref(null)

const fetchBills = async () => {
  const params = {
    page: currentPage.value,
    size: pageSize.value,
  }

  if (userName.value) params.userName = userName.value.trim()
  if (searchUser.value) params.targetUserId = Number(searchUser.value)
  if (dateRange.value && dateRange.value.length === 2) {
    params.startTime = dateRange.value[0]
    params.endTime = dateRange.value[1]
  }

  // 添加 fundType 和 ledgerType 到请求参数中
  if (fundType.value !== null && fundType.value !== undefined && fundType.value !== '') {
    params.fundType = fundType.value
  }
  if (ledgerType.value !== null && ledgerType.value !== undefined && ledgerType.value !== '') {
    params.ledgerType = ledgerType.value
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
    timestamp: i.timestamp || i.createTime || '--',
    userName: i.userName || '--'
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
  fundType.value = null
  ledgerType.value = null
  
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
  gap: 8px; /* 使用 gap 优化间距 */
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