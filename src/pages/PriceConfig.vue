<template>
  <div class="price-config">
    <el-card>
      <template #header>
        <div class="flex-between">
          <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
          <span>下级项目价格配置</span>
          <el-button type="primary" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <el-table :data="projects" border stripe v-loading="loading">
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column prop="userName" label="用户名" width="120" />
        <el-table-column prop="id" label="配置ID" width="80" />
        <el-table-column prop="projectName" label="项目名" />
        <el-table-column prop="projectId" label="项目ID" width="100" />
        <el-table-column prop="lineId" label="线路ID" width="100" />
        <el-table-column prop="price" label="当前价" width="100" />
        <el-table-column prop="costPrice" label="成本价" width="100" />
        <el-table-column prop="maxPrice" label="最高价" width="100" />
        <el-table-column prop="minPrice" label="最低价" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openEditor(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditor"
      title="编辑项目配置"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="form.projectName" disabled />
        </el-form-item>

        <el-form-item label="项目ID">
          <el-input v-model="form.projectId" disabled />
        </el-form-item>

        <el-form-item label="线路ID">
          <el-input v-model="form.lineId" disabled />
        </el-form-item>

        <el-form-item label="当前价">
          <el-input-number
            v-model="form.price"
            :min="form.minPrice"
            :max="form.maxPrice"
            :step="0.01"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="可填写备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditor = false">取消</el-button>
        <el-button type="primary" @click="saveProjectConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getProjectConfig, updateProjectConfig } from '@/api/agent'

const router = useRouter()
const loading = ref(false)
const projects = ref([])
const showEditor = ref(false)
const form = ref({})

// 返回上级
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/admin/dashboard')
}

// 获取项目配置（二维转一维）
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getProjectConfig()
    if (res.code === 200 && Array.isArray(res.data)) {
      projects.value = res.data.flatMap(user => {
        if (!Array.isArray(user.projectPrices) || user.projectPrices.length === 0) {
          return []
        }
        return user.projectPrices.map(p => ({
          userId: user.userId,
          userName: user.userName,
          ...p
        }))
      })
    } else {
      ElMessage.error(res.message || '获取项目配置失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误，无法获取项目配置')
  } finally {
    loading.value = false
  }
}

// 打开编辑弹窗
const openEditor = (row) => {
  form.value = { ...row }
  showEditor.value = true
}

// 保存修改
const saveProjectConfig = async () => {
  try {
    const params = {
      id: form.value.id,              // projectPrices.id
      price: form.value.price,
      remark: form.value.remark || '',
      projectId: form.value.projectId, // ✅ 一起上传
      lineId: form.value.lineId       // ✅ 一起上传
    }

    const res = await updateProjectConfig(params)
    if (res.code === 200) {
      ElMessage.success('项目配置已更新')
      showEditor.value = false
      fetchData()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误，更新失败')
  }
}

fetchData()
</script>

<style scoped>
.price-config {
  padding: 20px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
