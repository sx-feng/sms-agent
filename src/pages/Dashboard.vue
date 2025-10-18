<template>
  <div class="dashboard-page">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="left-title">📊 代理控制面板</div>
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

    <!-- 快捷入口 -->
    <el-card class="quick-entry">
      <div class="quick-title">⚙️ 功能入口</div>
      <div class="quick-buttons">
        <el-button
          v-for="(btn, i) in quickBtns"
          :key="i"
          type="primary"
          plain
          @click="handleQuickClick(btn)"
        >
          {{ btn.label }}
        </el-button>
      </div>
    </el-card>

    <!-- 弹窗：账单 -->
    <RecordDialog v-model="showRecordDialog" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import RecordDialog from '../components/RecordDialog.vue'


import {
  BellFilled,
  UserFilled,
  Coin,
  TrendCharts
} from '@element-plus/icons-vue'


const router = useRouter()

// 公告
const noticeText = ref('欢迎使用代理后台系统，当前版本 v1.0.0')

// 统计信息
const stats = ref([
  { title: '我的余额', value: '￥12,580', icon: Coin },
  { title: '下级总数', value: '8', icon: UserFilled },
  { title: '今日充值', value: '￥2,430', icon: Coin },
  { title: '回码率（24h）', value: '81%', icon: TrendCharts }
])

// 快捷按钮逻辑
const quickBtns = ref([
  { label: '下级管理', path: '/reseller/users', action: 'subAgent' },
  { label: '充值 / 扣款', path: '/reseller/recharge', action: 'balance' },
  { label: '项目价格配置', path: '/reseller/projects', action: 'price' },
  { label: '账单记录', path: '/reseller/userbill', action: 'userbill' }
])

// 弹窗控制
const showRecordDialog = ref(false)

// 入口按钮点击逻辑
function handleQuickClick(btn) {
  switch (btn.action) {
    case 'subAgent':
      router.push(btn.path)
      break
    case 'balance':
      router.push(btn.path)
      break
    case 'price':
      router.push(btn.path)
      break
    case 'userbill':
      router.push(btn.path)
      break
  }
}

// 退出登录
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
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => ElMessage.info('已取消操作'))
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
