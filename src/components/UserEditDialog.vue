<template>
  <el-dialog 
    :title="isEdit ? '编辑下级' : '新增下级'" 
    :model-value="props.modelValue" 
    @update:modelValue="onUpdate"
    @open="handleOpen" 
    width="800px" 
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
      <el-button type="warning" link @click="pasteFromLocal" v-if="!isEdit || (isEdit && form.password === '')">
        粘贴上次创建的账号密码
      </el-button>
    </div>
    
    <el-form :model="form" ref="formRef" :rules="rules" label-width="110px" v-loading="loading">
      <!-- 基本信息 (保持不变) -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username">
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名" 
              :disabled="isEdit" 
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" :placeholder="isEdit ? '不修改请留空' : '请输入密码'" show-password />
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
           <el-form-item label="初始余额" v-if="!isEdit" prop="initialBalance">
              <el-input-number v-model="form.initialBalance" :precision="2" :step="100" :min="0" style="width: 100%;" />
           </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="是否代理">
            <el-switch v-model="form.isAgent" active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="用户状态">
            <el-radio-group v-model="form.status">
              <el-radio :label="0">正常启用</el-radio>
              <el-radio :label="1">禁用账户</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>项目与价格配置</el-divider>

      <!-- 价格模板选择 -->
      <el-form-item label="价格模板" prop="templateId">
        <el-select 
          v-model="form.templateId" 
          placeholder="请为下级选择一个价格模板 (必选)" 
          clearable 
          filterable 
          style="width: 100%"
          :loading="templatesLoading"
        >
          <el-option v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
        </el-select>
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
           修改模板将重置下方列表。您可以针对特定项目进行禁用操作（加入黑名单）。
        </div>
      </el-form-item>

      <!-- [修改] 价格预览表格 + 黑名单操作 -->
      <div v-if="form.templateId" style="margin-bottom: 20px; padding-left: 20px; padding-right: 20px;">
         
         <!-- 头部：提示文字 + 搜索框 -->
         <div style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
             <span style="font-size: 13px; color: #409EFF; font-weight: bold;">
                <el-icon style="vertical-align: middle; margin-right: 4px;"><InfoFilled /></el-icon>
                权限与价格预览
             </span>
             <el-input
                v-model="searchKeyword"
                placeholder="搜索项目名称或ID..."
                prefix-icon="Search"
                style="width: 250px;"
                size="small"
                clearable
              />
         </div>

         <el-table 
          :data="filteredPreviewPrices" 
          border 
          stripe
          size="small" 
          height="300" 
          v-loading="previewLoading"
          empty-text="该模板暂无配置项"
        >
          <el-table-column prop="projectName" label="项目名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="projectId" label="项目ID" width="70" align="center"/>
          <el-table-column prop="lineId" label="线路" width="60" align="center"/>
          
          <el-table-column prop="price" label="下级售价" width="100" align="center">
            <template #default="{ row }">
              <span style="color: #E6A23C; font-weight: bold;">{{ row.price }}</span>
            </template>
          </el-table-column>

          <!-- 新增：状态列 -->
          <el-table-column label="当前权限" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="isBlacklisted(row)" type="danger" size="small" effect="dark">已禁用</el-tag>
              <el-tag v-else type="success" size="small" effect="plain">正常</el-tag>
            </template>
          </el-table-column>

          <!-- 新增：操作列 -->
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button 
                v-if="!isBlacklisted(row)"
                type="danger" 
                link 
                size="small" 
                @click="toggleBlacklist(row)"
              >
                加入黑名单
              </el-button>
              <el-button 
                v-else
                type="primary" 
                link 
                size="small" 
                @click="toggleBlacklist(row)"
              >
                移除黑名单
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- [移除] 原来的 el-select 项目黑名单 -->

    </el-form>

    <template #footer>
      <el-button @click="onUpdate(false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAgentUser,
  updateAgentUser,
  getAgentPriceTemplates, 
  // getProjectList, // 移除：不再需要加载全量项目列表
  getAgentTemplateItems,  
  getAgentSubUserConfig   
} from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

// 表单数据
const form = ref({
  id: '',
  username: '',
  password: '',
  isAgent: 0,
  status: 0,
  initialBalance: 0,
  templateId: null,
  blacklistedProjects: []
})

const formRef = ref()
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  templateId: [{ required: true, message: '请选择价格模板', trigger: 'change' }]
})

// 数据源
const templates = ref([])
// const allProjects = ref([]) // 移除：不再使用
const previewPrices = ref([])

// Loading 状态
const loading = ref(false)
const saving = ref(false)
const templatesLoading = ref(false)
// const projectListLoading = ref(false) // 移除
const previewLoading = ref(false)

// [新增] 搜索关键词
const searchKeyword = ref('')

const isEdit = computed(() => !!(props.user && props.user.id))

// [新增] 计算属性：前端过滤表格
const filteredPreviewPrices = computed(() => {
  if (!searchKeyword.value) return previewPrices.value
  const kw = searchKeyword.value.toLowerCase()
  return previewPrices.value.filter(item => {
    return (
      (item.projectName && item.projectName.toLowerCase().includes(kw)) ||
      String(item.projectId).includes(kw) ||
      String(item.lineId).includes(kw)
    )
  })
})

// [新增] 判断是否在黑名单
function isBlacklisted(row) {
  const key = `${row.projectId}-${row.lineId}`
  // 确保 blacklistedProjects 是数组
  return Array.isArray(form.value.blacklistedProjects) && form.value.blacklistedProjects.includes(key)
}

// [新增] 切换黑名单状态
function toggleBlacklist(row) {
  const key = `${row.projectId}-${row.lineId}`
  if (!Array.isArray(form.value.blacklistedProjects)) {
    form.value.blacklistedProjects = []
  }
  
  const index = form.value.blacklistedProjects.indexOf(key)
  if (index > -1) {
    form.value.blacklistedProjects.splice(index, 1) // 移除
  } else {
    form.value.blacklistedProjects.push(key) // 添加
  }
}

// 监听模板选择，加载预览
watch(() => form.value.templateId, async (newVal) => {
  if (newVal) {
    previewLoading.value = true
    try {
      if (typeof getAgentTemplateItems !== 'function') {
        console.error('API getAgentTemplateItems 未定义，请检查 src/api/agent.js')
        return
      }
      const res = await getAgentTemplateItems(newVal)
      previewPrices.value = res.data || []
    } catch (e) {
      console.error(e)
      previewPrices.value = []
    } finally {
      previewLoading.value = false
    }
  } else {
    previewPrices.value = []
  }
})

// 监听弹窗关闭/打开，清空搜索
watch(() => props.modelValue, (val) => {
    if(!val) {
        searchKeyword.value = ''
    }
})

async function handleOpen() {
  loading.value = true
  searchKeyword.value = '' // 重置搜索
  try {
    // 1. 初始化表单数据
    if (isEdit.value) {
      const userNameVal = props.user.userName || props.user.username || ''
      
      form.value = {
        id: props.user.id,
        username: userNameVal,
        password: '',
        isAgent: props.user.isAgent ? 1 : 0, 
        status: Number(props.user.status ?? 0),
        initialBalance: 0,
        templateId: null,
        blacklistedProjects: []
      }
    } else {
      form.value = {
        username: '',
        password: '',
        isAgent: 0,
        status: 0,
        initialBalance: 0,
        templateId: null,
        blacklistedProjects: []
      }
    }

    // 2. 加载下拉框数据 (移除 loadProjectList)
    const promises = [loadTemplates()]
    
    // 3. 如果是编辑模式，加载用户的配置详情
    if (isEdit.value) {
      if (typeof getAgentSubUserConfig === 'function') {
        promises.push(loadUserConfig(props.user.id))
      }
    }

    await Promise.all(promises)
    
  } catch (error) {
    console.error('弹窗初始化失败:', error)
    ElMessage.error('初始化数据失败，请检查网络或控制台日志')
  } finally {
    loading.value = false
  }
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    const res = await getAgentPriceTemplates()
    templates.value = res.data || []
  } catch (e) {
    console.error('加载模板列表失败', e)
  } finally {
    templatesLoading.value = false
  }
}

// 移除 loadProjectList 函数，因为已删除对应的 Select

async function loadUserConfig(userId) {
  try {
    const res = await getAgentSubUserConfig(userId)
    const config = res.data || {}
    
    // 回显模板ID
    if (config.templateId) {
      form.value.templateId = config.templateId
    }
    
    // 回显黑名单 (后端存的是字符串 "pid-lid,pid-lid"，转为数组)
    if (config.blacklist && typeof config.blacklist === 'string') {
      form.value.blacklistedProjects = config.blacklist.split(',')
    } else {
      form.value.blacklistedProjects = []
    }
  } catch (e) {
    console.error('加载用户详细配置失败', e)
  }
}

async function save() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    const currentUsername = form.value.username
    const currentPassword = form.value.password

    try {
      const payload = { ...form.value }
      
      if (!payload.password) delete payload.password
      
      if (isEdit.value) {
        delete payload.initialBalance 
        const res = await updateAgentUser(payload)
        if (res.code !== 200) throw new Error(res.message)
      } else {
        const res = await createAgentUser(payload)
        if (res.code !== 200) throw new Error(res.message)
      }

      ElMessage.success('保存成功')
      emit('update:modelValue', false)
      emit('updated')

      if (currentPassword) {
        saveLocalAndAlert(currentUsername, currentPassword)
      }

    } catch (e) {
      console.error(e)
      ElMessage.error(e.message || '操作失败')
    } finally {
      saving.value = false
    }
  })
}

function saveLocalAndAlert(username, password) {
  localStorage.setItem('LAST_AGENT_SUB_CREDS', JSON.stringify({ username, password }));
  const text = `账号：${username}\n密码：${password}`;
  ElMessageBox.alert(
    `
    <div style="text-align: center;">
       <p>下级用户已保存</p>
       <div style="background: #f0f9eb; color: #67c23a; padding: 10px; margin: 10px 0; border-radius: 4px;">
         <div>账号: <strong>${username}</strong></div>
         <div>密码: <strong>${password}</strong></div>
       </div>
    </div>
    `,
    '操作成功',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '复制并关闭',
      callback: () => {
        navigator.clipboard.writeText(text).then(() => ElMessage.success('已复制')).catch(() => {})
      }
    }
  );
}

function pasteFromLocal() {
  const cached = localStorage.getItem('LAST_AGENT_SUB_CREDS');
  if (cached) {
    try {
      const { username, password } = JSON.parse(cached);
      form.value.username = username;
      form.value.password = password;
      ElMessage.success('已粘贴上次信息');
    } catch (e) { console.error(e) }
  } else {
    ElMessage.info('没有可粘贴的记录');
  }
}

function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>

<style scoped>
/* 按钮紧凑样式 */
:deep(.el-table .cell) {
  padding: 0 8px;
}
</style>