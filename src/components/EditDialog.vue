<template>
  <el-dialog
    :title="isEdit ? '编辑下级' : '新增下级'"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    width="850px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px">
      <!-- ... 其他表单项保持不变 ... -->
       <el-form-item label="用户名">
        <el-input
          v-model="form.username"
          placeholder="请输入用户名"
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item label="密码" v-if="!isEdit">
        <el-input
          v-model="form.password"
          placeholder="请输入密码"
        />
      </el-form-item>
        <el-form-item label="密码" v-else>
        <el-input
          v-model="form.password"
          placeholder="不修改请留空"
        />
      </el-form-item>
      <el-form-item label="是否代理" >
        <el-switch
          v-model="form.isAgent"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
      </el-form-item>
      <el-form-item label="选择模板">
        <el-select
          v-model="selectedTemplateId"
          placeholder="可选择一个价格模板快速应用"
          clearable
          filterable
          @change="applyTemplate"
          style="width: 400px"
        >
          <el-option
            v-for="tpl in templates"
            :key="tpl.id"
            :label="tpl.name"
            :value="tpl.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="项目价格">
        <div class="prices-container">
          <div class="price-header">
            <span class="col-project">项目名称</span>
            <span class="col-line">线路ID</span>
            <span class="col-price">最高价</span>
            <span class="col-price">最低价</span>
            <span class="col-input">售价</span>
            <span class="col-action">操作</span>
          </div>
          <div class="price-row" v-for="(p, idx) in prices" :key="`${p.projectId}-${p.lineId}`">
            <el-input
              :value="`${p.projectName} (ID: ${p.projectId})`"
              class="col-project"
              disabled
            />
            <el-input
              v-model.number="p.lineId"
              class="col-line"
              disabled
            />
            <el-input
              v-model.number="p.priceMax"
              class="col-price"
              disabled
            />
            <el-input
              v-model.number="p.priceMin"
              class="col-price"
              disabled
            />
            <el-input-number
              v-model.number="p.price"
              :min="p.priceMin"
              :max="p.priceMax"
              :step="0.01"
              controls-position="right"
              class="col-input"
            />
            <el-button type="danger" link @click="removePrice(idx)" class="col-action">删除</el-button>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createAgentUser, updateAgentUser, getAgentPriceTemplates, getProjectList } from '@/api/agent'
import { getAgentProjectPrice } from '@/api/agent.projectPrice'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({})
const prices = ref([])
const saving = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)

const isEdit = computed(() => !!(props.user && (props.user.userId || props.user.id)))

async function loadAndProcessPrices() {
  try {
    const [projectRes, agentPriceRes] = await Promise.all([
      getProjectList({ pageSize: -1 }),
      getAgentProjectPrice()
    ])

    if (projectRes.code !== 200) {
      ElMessage.error('加载项目列表失败')
      return
    }
    if (agentPriceRes.code !== 200) {
      ElMessage.warning('获取您的项目价格失败，将使用系统默认最低价')
    }

    const latestProjects = projectRes.data.records || []
    const agentPrices = agentPriceRes.data || []
    
    const agentPriceMap = new Map(
      agentPrices.map(item => [`${item.projectId}_${item.lineId}`, item.agentPrice])
    )

    let savedPriceMap = new Map()
    if (isEdit.value) {
      let priceObj = props.user.projectPrices || {}
      // 兼容旧数据，这里假设 projectPrices 是一个数组
      if (Array.isArray(priceObj)) {
         priceObj.forEach(item => {
           savedPriceMap.set(`${item.projectId}_${item.lineId}`, item.price)
         })
      }
    }

    prices.value = latestProjects.map(p => {
      const key = `${p.projectId}_${p.lineId}`
      const agentPrice = agentPriceMap.get(key)
      const savedPrice = isEdit.value ? savedPriceMap.get(key) : undefined

      const priceMin = agentPrice !== undefined ? agentPrice : p.priceMin
      const priceMax = p.priceMax

      let finalPrice = savedPrice !== undefined ? savedPrice : (priceMax ?? priceMin)

      return {
        projectId: p.projectId,
        projectName: p.projectName,
        lineId: p.lineId,
        priceMax: priceMax,
        priceMin: priceMin,
        price: finalPrice,
      }
    })

  } catch (error) {
    console.error("加载价格数据出错:", error)
    ElMessage.error('网络异常，加载价格数据失败')
  }
}

watch(() => props.modelValue, async (isVisible) => {
  if (isVisible) {
    selectedTemplateId.value = null
    if (isEdit.value) {
      form.value = {
        userId: String(props.user.id ?? props.user.userId),
        username: props.user.username ?? '',
        password: '',
        isAgent: !!props.user.isAgent,
        status: Number(props.user.status ?? 1)
      }
    } else {
      form.value = {
        username: '',
        password: '',
        isAgent: false,
        status: 1
      }
    }
    await loadAndProcessPrices()
  }
})

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

onMounted(() => {
  loadTemplates()
})

function removePrice(idx) {
  prices.value.splice(idx, 1)
}

function applyTemplate(templateId) {
  if (!templateId) return
  const tpl = templates.value.find(t => t.id === templateId)
  if (!tpl) return

  // 1. 创建一个模板价格的映射表，方便快速查找
  // Key: 'projectId_lineId', Value: price
  const templatePriceMap = new Map(
    tpl.items.map(item => [`${item.projectId}_${item.lineId}`, item.price])
  )

  // 2. 遍历当前的价格列表 (prices)
  prices.value.forEach(priceItem => {
    const key = `${priceItem.projectId}_${priceItem.lineId}`
    
    // 3. 如果在模板中找到了对应的项目，则只更新其售价 (price)
    if (templatePriceMap.has(key)) {
      const templatePrice = templatePriceMap.get(key)
      
      // 确保模板价格不低于当前代理的最低价，不高于最高价
      if (templatePrice < priceItem.priceMin) {
        priceItem.price = priceItem.priceMin
      } else if (templatePrice > priceItem.priceMax) {
        priceItem.price = priceItem.priceMax
      } else {
        priceItem.price = templatePrice
      }
    }
  })

  ElMessage.success(`已应用模板「${tpl.name}」的售价`)
}


async function save() {
  const projectPrices = prices.value.map(p => ({
    projectId: Number(p.projectId),
    lineId: Number(p.lineId),
    price: Number(p.price)
  }))

  const payload = { ...form.value, projectPrices }
  
  if (!payload.password) {
    delete payload.password
  }
  
  saving.value = true
  try {
    const res = isEdit.value
      ? await updateAgentUser(payload)
      : await createAgentUser(payload)

    if (res.code === 200) {
      ElMessage.success('保存成功')
      emit('update:modelValue', false)
      emit('updated', payload)
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch {
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    saving.value = false
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
  padding: 10px;
}

.price-header,
.price-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 0.5fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.price-header {
  font-weight: 600;
  color: #606266;
  padding: 0 5px;
}

.price-row:last-child {
  margin-bottom: 0;
}

.col-input {
  width: 100%;
}
.col-action {
  text-align: center;
}
</style>