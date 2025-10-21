<template>
  <div class="dashboard-page">
    <div class="top-bar">
      <div class="left-title">代理控制面板</div>
      <div class="right-actions">
        <el-button type="danger" size="small" @click="confirmLogout">退出登录</el-button>
      </div>
    </div>

    <NoticeBar />

    <div class="stat-cards">
      <el-card class="stat-item" v-for="(item, index) in stats" :key="index">
        <div class="stat-info">
          <div class="stat-title">{{ item.title }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </el-card>
    </div>

    <el-card class="quick-entry">
      <div class="quick-title">功能入口</div>
      <div class="quick-buttons">
        <el-button v-for="(btn, i) in quickBtns" :key="i" type="primary" plain @click="router.push(btn.path)">
          {{ btn.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NoticeBar from '@/components/NoticeBar.vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'


const router = useRouter()
// todo 面板的中展示带展示
const stats = ref([
  { title: '我的余额', value: '¥2,580' },
  { title: '下级总数', value: '8' },
  { title: '今日充值', value: '¥1,430' },
  { title: '回码率（24h）', value: '81%' }
])

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
</script>

<style scoped>
.dashboard-page { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.top-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; }
.left-title { font-size: 18px; font-weight: 600; }
.right-actions { display: flex; gap: 10px; }
.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
.stat-item { display: flex; align-items: center; justify-content: space-between; }
.stat-info { text-align: left; }
.stat-title { font-size: 14px; color: #666; }
.stat-value { font-size: 20px; font-weight: 600; }
.quick-title { font-weight: 600; margin-bottom: 10px; }
.quick-buttons { display: flex; flex-wrap: wrap; gap: 10px; text-align: center; justify-content: center; }
</style>
