<template>
  <div class="price-config">

    <el-card>
      <template #header>
        <div class="flex-between">
 <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
          <span>项目价格配置</span>
          <el-button type="primary" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <el-table :data="projects" border stripe>
        <el-table-column prop="id" label="项目ID" width="100" />
        <el-table-column prop="name" label="项目名" />
        <el-table-column prop="cost" label="成本价" />
        <el-table-column prop="max_price" label="最高价" />
        <el-table-column prop="current_price" label="当前价" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openEditor(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <PriceEditor
      v-if="showEditor"
      :project="currentProject"
      @close="showEditor = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import PriceEditor from '@/components/PriceEditor.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/admin/dashboard') // 没有历史时跳转到后台首页或你想的上级页
  }
}

const projects = ref([])
const showEditor = ref(false)
const currentProject = ref(null)

const fetchData = () => {
  projects.value = [
    { id: 1, name: '短信服务', cost: 0.02, max_price: 0.10, current_price: 0.08 },
    { id: 2, name: '验证码通道', cost: 0.03, max_price: 0.15, current_price: 0.12 },
    { id: 3, name: '营销短信', cost: 0.05, max_price: 0.20, current_price: 0.20 },
  ]
}

const openEditor = (row) => {
  currentProject.value = { ...row }
  showEditor.value = true
}

const handleSaved = (updated) => {
  const index = projects.value.findIndex(p => p.id === updated.id)
  if (index !== -1) {
    projects.value[index].current_price = updated.current_price
  }
  ElMessage.success('价格已更新')
}

fetchData()
</script>

<style scoped>
.price-config { padding: 20px; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
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
