<template>
  <el-dialog
    :title="isEdit ? '编辑下级' : '新增下级'"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    @open="handleOpen"
    width="850px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否代理">
            <el-switch
              v-model="form.isAgent"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="0" :inactive-value="1" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>项目价格配置</el-divider>

      <el-form-item label="快捷应用">
        <el-select
          v-model="selectedTemplateId"
          placeholder="可选择一个价格模板快速应用"
          clearable
          filterable
          @change="applyTemplate"
          style="width: 100%"
        >
          <el-option
            v-for="tpl in templates"
            :key="tpl.id"
            :label="tpl.name"
            :value="tpl.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="价格列表">
        <div class="prices-container">
          <div class="price-header">
            <span class="col-project">项目名称</span>
            <span class="col-line">线路ID</span>
            <span class="col-price">成本价</span>
            <span class="col-price">最高价</span>
            <span class="col-input">下级售价</span>
          </div>
          <div class="price-scroll-area">
            <div class="price-row" v-for="p in prices" :key="`${p.projectId}-${p.lineId}`">
              <el-input
                :value="`${p.projectName}`"
                class="col-project"
                disabled
              />
              <el-input
                :value="p.lineId"
                class="col-line"
                disabled
              />
              <el-input
                :value="p.costPrice"
                class="col-price"
                disabled
              />
              <el-input
                :value="p.maxPrice ?? '不限'"
                class="col-price"
                disabled
              />
              <el-input-number
                v-model.number="p.agentPrice"
                :min="p.costPrice"
                :max="p.maxPrice ?? Infinity"
                :step="0.01"
                controls-position="right"
                class="col-input"
              />
            </div>
             <el-empty v-if="!prices.length && !loading" description="暂无可配置的项目" :image-size="80"></el-empty>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onUpdate(false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue' // <--- 移除了未使用的 'watch'
import { ElMessage } from 'element-plus'
import { 
  createAgentUser, 
  updateAgentUser, 
  getAgentPriceTemplates, 
  getAgentProjects,
  getSubUserProjectPricesById,
  getProjectList
} from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({})
const prices = ref([])
const saving = ref(false)
const loading = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)

const isEdit = computed(() => !!(props.user && props.user.id))

// 弹窗打开时初始化所有数据
async function handleOpen() {
  loading.value = true
  selectedTemplateId.value = null
  
  // 1. 初始化表单
  if (isEdit.value) {
    form.value = {
      id: props.user.id,
      username: props.user.userName ?? '',
      password: '',
      isAgent: !!props.user.isAgent,
      status: Number(props.user.status ?? 0)
    }
  } else {
    form.value = {
      username: '',
      password: '',
      isAgent: false,
      status: 0 // 默认启用
    }
  }
  
  // 2. 并发加载模板和价格数据
  await Promise.all([
    loadTemplates(),
    loadAndProcessPrices()
  ])
  
  loading.value = false
}


// 加载并整合处理价格数据
async function loadAndProcessPrices() {
  try {
    const fetchTasks = [
      getProjectList({ size: 9999 }), // 获取所有项目
      getAgentProjects() // 获取代理自己的价格
    ];

    if (isEdit.value) {
      // 如果是编辑，额外获取该用户的价格配置
      fetchTasks.push(getSubUserProjectPricesById(props.user.id));
    }

    const [projectRes, agentPriceRes, userPriceRes] = await Promise.all(fetchTasks);

    if (projectRes.code !== 200) throw new Error('加载项目列表失败');
    if (agentPriceRes.code !== 200) ElMessage.warning('获取您的成本价失败，部分价格可能不准');
    
    const allProjects = projectRes.data?.records || [];
    const agentPrices = agentPriceRes.data || [];
    const userPrices = isEdit.value ? (userPriceRes?.data || []) : [];

    // 创建映射表以提高查找效率
    // ✅ FIX: 修正了 .map() 的用法
    const agentPriceMap = new Map(agentPrices.map(p => [`${p.projectId}_${p.lineId}`, p.agentPrice]));
    const userPriceMap = new Map(userPrices.map(p => [`${p.projectId}_${p.lineId}`, p.agentPrice]));


    // 整合数据
    prices.value = allProjects.map(p => {
      const key = `${p.projectId}_${p.lineId}`;
      const costPrice = agentPriceMap.get(key) ?? p.minPrice; // 代理的售价是下级的成本价
      const userPrice = userPriceMap.get(key);

      return {
        id:p.id,
        projectName: p.projectName,
        projectId: p.projectId,
        lineId: p.lineId,
        costPrice: Number(costPrice),
        maxPrice: p.maxPrice ? Number(p.maxPrice) : null,
        // 核心逻辑：编辑时用用户价，否则用成本价作为默认售价
        agentPrice: Number(userPrice ?? costPrice)
      };
    });

  } catch (error) {
    console.error("加载价格数据出错:", error);
    ElMessage.error(error.message || '网络异常，加载价格数据失败');
    prices.value = []; // 出错时清空
  }
}

// 加载价格模板
async function loadTemplates() {
  try {
    const res = await getAgentPriceTemplates()
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (e) {
    console.error('加载模板失败', e)
  }
}

// 应用模板
function applyTemplate(templateId) {
  if (!templateId) return
  const tpl = templates.value.find(t => t.id === templateId)
  if (!tpl) return

  const templatePriceMap = new Map(
    (tpl.items || []).map(item => [`${item.projectId}_${item.lineId}`, item.price])
  )

  prices.value.forEach(p => {
    const key = `${p.projectId}_${p.lineId}`
    if (templatePriceMap.has(key)) {
      const templatePrice = templatePriceMap.get(key)
      // 保证应用的价格在有效区间内
      if (templatePrice >= p.costPrice && (!p.maxPrice || templatePrice <= p.maxPrice)) {
        p.agentPrice = templatePrice
      }
    }
  })
  ElMessage.success(`已应用模板「${tpl.name}」的售价`)
}

// 保存
async function save() {
  const projectPrices = prices.value.map(p => ({
    userProjectLineId: p.id, // 用户项目线路表 ID
    agentPrice: Number(p.agentPrice),
    projectId: p.projectId,
    lineId: p.lineId
  }))

  const payload = { ...form.value, projectPrices };
  if (!payload.password) {
    delete payload.password;
  }
  
  saving.value = true;
  try {
    // 根据是否为编辑模式，调用不同接口
    const apiCall = isEdit.value ? updateAgentUser : createAgentUser;
    const res = await apiCall(payload);

    if (res.code === 200) {
      ElMessage.success('保存成功');
      emit('update:modelValue', false);
      emit('updated'); // 通知父组件刷新列表
    } else {
      ElMessage.error(res.message || '保存失败');
    }
  } catch {
    ElMessage.error('网络异常，请稍后重试');
  } finally {
    saving.value = false;
  }
}

function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>

<style scoped>
.prices-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.price-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
}
.price-scroll-area {
    max-height: 300px;
    overflow-y: auto;
}

.price-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
}
.price-row:not(:last-child) {
    border-bottom: 1px solid #ebeef5;
}

.col-input {
  width: 100%;
}
</style>