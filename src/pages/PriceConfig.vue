<template>
  <div class="price-config">
    <el-card>
      <template #header>
        <div class="flex-between">
          <el-button class="back-btn" @click="goBack" size="small">⬅ 返回</el-button>
          <span>下级项目价格配置</span>
           <div style="display: flex; align-items: center; gap: 10px;">
      <el-input
        v-model="searchUserName"
        placeholder="输入用户名查询"
        size="small"
        style="width: 200px"
        clearable
        @keyup.enter="fetchData"
      />
      <el-button type="primary" @click="fetchData" size="small">查询</el-button>
      <el-button type="success" @click="fetchData" size="small">刷新</el-button>
    </div>
        </div>
      </template>

      <!-- 表格部分保持不变 -->
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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditor(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- [新增] 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗部分保持不变 -->
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
import { ref, reactive } from 'vue' // reactive 可以用于组织分页数据
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
// [注意] 确保这里的 API 函数名称是正确的
import { getAgentProjects, updateProjectConfig } from '@/api/agent'
const searchUserName = ref('') 
const router = useRouter()
const loading = ref(false)
const projects = ref([])
const showEditor = ref(false)
const form = ref({})

// [修改] 1. 定义分页相关的响应式数据
const pagination = reactive({
  page: 1,  // 当前页
  size: 10, // 每页数量
  total: 0, // 总数据条数
})

// 返回上级
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/admin/dashboard')
}

// [修改] 2.改造数据获取函数以支持分页
const fetchData = async () => {
  loading.value = true
  try {
    // ✅ 基础分页参数
    const params = {
      page: pagination.page,
      size: pagination.size
    }

    // ✅ 仅当用户输入了内容时才附加 userName 参数
    const keyword = searchUserName.value?.trim()
    if (keyword && keyword.length > 0) {
      params.userName = keyword
    }

    // ✅ 请求接口
    const res = await getAgentProjects(params)

    if (res.code === 200 && res.data) {
      // 展开数据逻辑保持不变
      projects.value = res.data.records.flatMap(user => {
        if (!Array.isArray(user.projectPrices) || user.projectPrices.length === 0) {
          return [{
            userId: user.userId,
            userName: user.userName,
          }]
        }
        return user.projectPrices.map(p => ({
          userId: user.userId,
          userName: user.userName,
          ...p
        }))
      })
      pagination.total = res.data.total
         searchUserName.value = ''
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


// [新增] 3. 处理每页显示数量变化的函数
const handleSizeChange = (newSize) => {
  pagination.size = newSize
  pagination.page = 1 // 切换每页数量时，通常返回第一页
  fetchData()
}

// [新增] 4. 处理页码变化的函数
const handleCurrentChange = (newPage) => {
  pagination.page = newPage
  fetchData()
}


// 打开编辑弹窗
const openEditor = (row) => {
  // 添加一个判断，防止对没有价格配置的用户行进行编辑
  if (!row.id) {
    ElMessage.warning('该用户暂无项目价格配置，无法编辑')
    return
  }
  form.value = { ...row }
  showEditor.value = true
}

// 保存修改 (保持不变)
const saveProjectConfig = async () => {
  try {
    const params = {
      id: form.value.id,
      price: form.value.price,
      remark: form.value.remark || '',
      projectId: form.value.projectId,
      lineId: form.value.lineId
    }

    const res = await updateProjectConfig(params)
    if (res.code === 200) {
      ElMessage.success('项目配置已更新')
      showEditor.value = false
      fetchData() // 更新后重新获取当前页数据
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('网络错误，更新失败')
  }
}

// 页面加载时首次获取数据
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

/* [新增] 分页容器样式 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>