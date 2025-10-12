<template>
  <div class="dashboard-page">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="left-title">📊 系统首页</div>
      <div class="right-actions">
        <el-button type="danger" size="small" @click="confirmLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 公告栏 -->
    <el-card class="notice-card">
      <div class="notice-bar">
        <el-icon><BellFilled /></el-icon>
        <span class="notice-title">公告栏：</span>
        <span class="notice-text">{{ noticeText }}</span>
      </div>
    </el-card>

    <!-- 统计卡片区域 -->
    <div class="stat-cards">
      <el-card class="stat-item" v-for="(item, index) in stats" :key="index">
        <div class="stat-icon">
          <el-icon :size="24"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-title">{{ item.title }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </el-card>
    </div>

    <!-- 折线图 -->
    <el-card class="chart-card">
      <div class="chart-header">
        <el-icon><TrendCharts /></el-icon>
        <span>📈 回码率趋势图</span>
      </div>
      <div ref="chartRef" class="chart"></div>
    </el-card>

    <!-- 快捷入口 -->
    <el-card class="quick-entry">
      <div class="quick-title">⚙️ 快捷入口</div>
      <div class="quick-buttons">
        <el-button v-for="(btn, i) in quickBtns" :key="i" @click="goPage(btn.path)">
          {{ btn.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  BellFilled,
  UserFilled,
  Coin,
  Document,
  TrendCharts
} from '@element-plus/icons-vue'

const router = useRouter()
const noticeText = ref('欢迎使用 wzz.sms.code 系统，当前版本 v1.0.0')

const stats = ref([
  { title: '总余额', value: '￥58,960', icon: Coin },
  { title: '用户数', value: '125', icon: UserFilled },
  { title: '号码数', value: '2,430', icon: Document },
  { title: '回码率（24h）', value: '82%', icon: TrendCharts }
])

const quickBtns = ref([
  { label: '用户管理', path: '/users' },
  { label: '项目配置', path: '/projects' },
  { label: '系统设置', path: '/settings' },
  { label: '日志查看', path: '/logs' }
])

// 初始化折线图
const chartRef = ref(null)
onMounted(() => {
  const chart = echarts.init(chartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['10-07', '10-08', '10-09', '10-10', '10-11', '10-12', '10-13'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: '回码率',
        type: 'line',
        smooth: true,
        data: [68, 75, 71, 82, 84, 87, 80],
        areaStyle: { opacity: 0.2 },
        lineStyle: { width: 2 }
      }
    ]
  }
  chart.setOption(option)
})

// 退出登录确认弹窗
function confirmLogout() {
  ElMessageBox.confirm(
    '确定要退出登录吗？退出后需要重新登录才能访问系统。',
    '退出确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      logout()
      ElMessage({
        type: 'success',
        message: '已退出登录',
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消操作',
      })
    })
}

// 执行退出逻辑
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部操作栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
}
.left-title {
  font-size: 18px;
  font-weight: 600;
}
.right-actions {
  display: flex;
  gap: 10px;
}

/* 公告栏 */
.notice-card {
  background-color: #fffaf0;
}
.notice-bar {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: #444;
}
.notice-title {
  font-weight: 600;
  margin-left: 6px;
  margin-right: 8px;
}
.notice-text {
  color: #666;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}
.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-icon {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 10px;
}
.stat-info {
  text-align: right;
}
.stat-title {
  font-size: 14px;
  color: #666;
}
.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 折线图 */
.chart-card {
  padding: 10px 15px;
}
.chart-header {
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.chart {
  width: 100%;
  height: 300px;
}

/* 快捷入口 */
.quick-entry {
  text-align: center;
}
.quick-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 10px;
}
.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>
