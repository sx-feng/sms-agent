<template>
  <div class="dashboard-page">
    <!-- 顶部条 -->
    <div class="top-bar">
      <div class="left-title">💼 代理控制面板</div>
      <div class="right-actions">
        <el-button type="danger" size="small" @click="confirmLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 通知栏 -->
    <NoticeBar />

    <!-- 仪表盘统计 -->
    <div class="stat-section">
      <el-card
        class="stat-item"
        v-for="(item, index) in stats"
        :key="index"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="icon" :class="`icon-${index}`">
            <i :class="item.icon"></i>
          </div>
          <div class="stat-text">
            <div class="stat-title">{{ item.title }}</div>
            <div class="stat-value">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 功能入口 -->
    <el-card class="quick-entry" shadow="hover">
      <div class="quick-title">⚙️ 功能入口</div>
      <div class="quick-buttons">
        <el-button
          v-for="(btn, i) in quickBtns"
          :key="i"
          class="quick-btn"
          type="primary"
          plain
          size="large"
          @click="router.push(btn.path)"
        >
          {{ btn.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import NoticeBar from '@/components/NoticeBar.vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getAgentDashboard } from '@/api/agent'

const router = useRouter()

const quickBtns = ref([
  { label: '下级管理', path: '/reseller/users' },
  { label: '充值 / 扣款', path: '/reseller/recharge' },
  { label: '项目价格配置', path: '/reseller/projects' },
  { label: '账单记录', path: '/reseller/userbill' }
])

function confirmLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('agent_token')
      localStorage.removeItem('agent_user')
      ElMessage.success('已退出登录')
      router.push('/login')
    })
    .catch(() => {})
}

const stats = ref([])

async function loadDashboard() {
  try {
    const res = await getAgentDashboard()
    if (res.ok) {
      stats.value = [
        { title: '我的余额', value: `¥${res.data.myBalance || 0}`, icon: 'el-icon-wallet' },
        { title: '下级总数', value: res.data.totalSubUsers || 0, icon: 'el-icon-user' },
        { title: '今日充值', value: `¥${res.data.todaySubUsersRecharge || 0}`, icon: 'el-icon-money' },
        { title: '回码率（24h）', value: `${res.data.subUsersCodeRate || 0}%`, icon: 'el-icon-pie-chart' }
      ]
    } else {
      ElMessage.error(res.message || '获取仪表盘数据失败')
    }
  } catch {
    ElMessage.error('网络异常')
  }
}

onMounted(() => loadDashboard())
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(145deg, #f0f4ff, #ffffff);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.left-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}
.right-actions {
  display: flex;
  gap: 8px;
}

/* 统计卡片区 */
.stat-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
}
.stat-item {
  border-radius: 16px;
  transition: all 0.3s ease;
}
.stat-item:hover {
  transform: translateY(-4px);
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}
.icon-0 { background: linear-gradient(45deg, #409eff, #66b1ff); }
.icon-1 { background: linear-gradient(45deg, #67c23a, #85ce61); }
.icon-2 { background: linear-gradient(45deg, #e6a23c, #ebb563); }
.icon-3 { background: linear-gradient(45deg, #f56c6c, #f78989); }
.stat-text {
  flex: 1;
}
.stat-title {
  font-size: 14px;
  color: #666;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin-top: 4px;
}

/* 功能入口区 */
.quick-entry {
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}
.quick-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}
.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}
.quick-btn {
  min-width: 140px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.2s ease;
}
.quick-btn:hover {
  transform: scale(1.05);
}
</style>
