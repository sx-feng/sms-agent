<template>
  <div class="user-bill">
    <el-card>
      <template #header>
        <div class="header-container">
          <!-- 第一行：返回按钮 和 标题 -->
          <div class="flex-between mb-2">
            <div class="left-header">
              <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
              <span class="header-title">{{ viewMode === 'sub' ? '下级账单明细' : '我的资金流水' }}</span>
            </div>
            
            <!-- 核心修改：模式切换按钮 -->
            <el-radio-group v-model="viewMode" @change="handleModeChange" size="small">
              <el-radio-button label="sub">查看下级</el-radio-button>
              <el-radio-button label="my">查看自己</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 第二行：筛选条件 -->
          <div class="filters-row">
            <!-- 用户名输入框 -->
            <el-input
              v-model="userName"
              :placeholder="viewMode === 'sub' ? '下级用户名' : '用户名(可选)'"
              style="width: 140px;"
              clearable
            />
            
            <!-- 新增：备注输入框 (查询自己时很有用) -->
            <el-input
              v-model="remark"
              placeholder="备注查询"
              style="width: 140px;"
              clearable
            />

            <!-- 资金类型筛选 -->
            <el-select v-model="fundType" placeholder="资金类型" style="width: 130px;" clearable>
              <el-option
                v-for="item in fundTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>

            <!-- 账本类型筛选 -->
            <el-select v-model="ledgerType" placeholder="账本类型" style="width: 110px;" clearable>
              <el-option label="出账" :value="0" />
              <el-option label="入账" :value="1" />
            </el-select>

            <!-- 时间范围 -->
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              start-placeholder="开始"
              end-placeholder="结束"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 240px"
            />
            
            <div class="action-btns">
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetFilter">重置</el-button>
              <el-button type="success" @click="exportExcel">导出</el-button>
              <el-button 
    v-if="viewMode === 'my'" 
    type="danger" 
    plain 
    :loading="clearLoading"
    @click="handleClearSelfLedger"
  >
    清理记录
  </el-button>
            </div>
          </div>
        </div>
      </template>

      <el-table :data="billList" border stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="流水ID" width="100" />
        <el-table-column prop="userName" label="用户名" width="150" />
        <el-table-column prop="fundTypeStr" label="资金类型" width="120">
           <template #default="{ row }">
             <el-tag effect="plain">{{ getFundTypeLabel(row.fundType) }}</el-tag>
           </template>
        </el-table-column>
        <el-table-column prop="type" label="收支" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.ledgerType === 1 || row.price > 0" type="success">入账</el-tag>
            <el-tag v-else type="danger">出账</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="变动金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.ledgerType === 0 ? '#f56c6c' : '#67c23a', fontWeight: 'bold' }">
              {{ row.ledgerType === 0 ? '-' : '+' }}{{ Math.abs(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="变动后余额" width="120" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip/>
        <el-table-column prop="timestamp" label="时间" width="180" />
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage,ElMessageBox  } from 'element-plus'
import * as XLSX from 'xlsx'
// 引入两个API：UserLedger(下级), getAgentMyLedger(自己)
import { UserLedger, getAgentMyLedger ,leaderClear } from '@/api/agent'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

// === 核心状态 ===
const viewMode = ref('sub') // 'sub' = 下级流水, 'my' = 我的流水

// === 筛选条件 ===
const userName = ref('') // 既可以是下级用户名，也可以是查自己流水时的用户名过滤
const remark = ref('')   // 新增：备注
const fundType = ref(null)
const ledgerType = ref(null)
const dateRange = ref([])
// 预存的搜索用的ID（仅用于下级模式，通常从路由参数带过来）
const searchTargetUserId = ref('') 

// 分页
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const billList = ref([])

// 字典选项
const fundTypeOptions = ref([
  { value: 0, label: '业务扣费' },
  { value: 1, label: '代理充值' },
  { value: 2, label: '代理扣款' },
  { value: 4, label: '代理回款' },
  { value: 3, label: '管理员操作' },
  { value: 5, label: '超时退款' }
])

// 辅助函数：获取资金类型文字
const getFundTypeLabel = (val) => {
  const find = fundTypeOptions.value.find(item => item.value === val)
  return find ? find.label : '未知'
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/reseller/sub-users')
  }
}

// 切换模式时重置页码并查询
const handleModeChange = () => {
  currentPage.value = 1
  // 切换模式时，清空部分不通用的筛选条件可能体验更好，视需求而定
  // userName.value = '' 
  fetchBills()
}

const handleSearch = () => {
  currentPage.value = 1
  fetchBills()
}

// === 核心逻辑：获取数据 ===
const fetchBills = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }

    // 通用参数处理
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    if (fundType.value !== null && fundType.value !== undefined) params.fundType = fundType.value
    if (ledgerType.value !== null && ledgerType.value !== undefined) params.ledgerType = ledgerType.value
    
    // 文本筛选参数
    if (userName.value) params.userName = userName.value.trim()
    if (remark.value) params.remark = remark.value.trim()

    let res
    
    // --> 分支 1：查询下级流水
    if (viewMode.value === 'sub') {
      // 兼容原有逻辑：如果有指定下级ID（可能是从用户列表点进来的）
      if (searchTargetUserId.value) params.targetUserId = Number(searchTargetUserId.value)
      
      res = await UserLedger(params)
    } 
    // --> 分支 2：查询自己流水 (新增)
    else {
      res = await getAgentMyLedger(params)
    }

    if (!res.ok) { // 假设 request 封装返回 ok 字段，或者根据 code === 200 判断
      ElMessage.error(res.message || '获取数据失败')
      billList.value = []
      total.value = 0
      return
    }

    // 统一数据格式映射
    const records = res.data.records || []
    billList.value = records.map(i => ({
      id: i.id,
      userId: i.userId,
      userName: i.userName || '--',
      fundType: i.fundType, // 保留原始值用于显示 Tag
      ledgerType: i.ledgerType, // 1入账 0出账
      amount: Number(i.price), // 变动金额
      balance: Number(i.balanceAfter || 0),
      remark: i.remark || i.description || '--',
      timestamp: i.timestamp || i.createTime || '--',
    }))
    total.value = Number(res.data.total || 0)

  } catch (error) {
    console.error(error)
    ElMessage.error('系统错误')
  } finally {
    loading.value = false
  }
}

// --- 新增：清理逻辑 ---
const clearLoading = ref(false)

const handleClearSelfLedger = async () => {
  try {
    // 危险操作，必须强制弹窗确认
    await ElMessageBox.confirm(
      '确定要清空您所有的历史账单记录吗？清理后将无法恢复，请谨慎操作！',
      '安全警告',
      {
        confirmButtonText: '确定清理',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger',
      }
    )

    clearLoading.value = true
    const res = await leaderClear()
    
    // 根据你的 request 封装逻辑判断，通常是 res.ok 或 res.code === 200
    if (res.ok || res.code === 200) {
      ElMessage.success('账单清理成功')
      currentPage.value = 1
      fetchBills() // 刷新列表
    } else {
      ElMessage.error(res.message || '清理失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Clear ledger error:', error)
      ElMessage.error('系统繁忙，请稍后再试')
    }
  } finally {
    clearLoading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchBills()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1 // 改变每页大小时重置到第一页
  fetchBills()
}

const resetFilter = () => {
  dateRange.value = []
  userName.value = ''
  remark.value = ''
  fundType.value = null
  ledgerType.value = null
  // 注意：searchTargetUserId通常不重置，因为它是页面上下文
  fetchBills()
}

const exportExcel = () => {
  if (!billList.value.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const sheetData = billList.value.map(item => ({
    流水ID: item.id,
    用户名: item.userName,
    资金类型: getFundTypeLabel(item.fundType),
    收支方向: item.ledgerType === 1 ? '入账' : '出账',
    金额: item.amount,
    变动后余额: item.balance,
    备注: item.remark,
    时间: item.timestamp
  }))
  const title = viewMode.value === 'sub' ? '下级资金流水' : '我的资金流水'
  const worksheet = XLSX.utils.json_to_sheet(sheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '账单明细')
  XLSX.writeFile(workbook, `${title}_${new Date().getTime()}.xlsx`)
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
.header-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mb-2 {
  margin-bottom: 8px;
}
.left-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-title {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}
.filters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.action-btns {
  margin-left: auto; /* 让按钮靠右 */
  display: flex;
  gap: 10px;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
.back-btn {
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.back-btn:hover {
  background: #f6c244;
  color: #000;
  border-color: #f6c244;
}
</style>