<template>
  <el-dialog
    title="新增下级"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    width="720px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="用户ID">
        <el-input v-model="form.userId" placeholder="自动生成/不可修改" disabled />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.status" active-text="启用" inactive-text="禁用" />
      </el-form-item>
            <!-- 用户名 -->
      <el-form-item label="用户名">
        <el-input
          v-model="form.username"
          placeholder="请输入用户名"
          :disabled="isEdit"
        />
      </el-form-item>

      <!-- 密码 -->
      <el-form-item label="密码">
        <el-input
          v-model="form.password"
          placeholder="请输入密码"
          :show-password="true"
          type="password"
          :disabled="isEdit"
        />
      </el-form-item>

      <!-- <el-form-item label="取号总数">
        <el-input v-model.number="form.totalGetCount" placeholder="请输入取号总数" type="number" />
      </el-form-item>

      <el-form-item label="回码率(%)">
        <el-input v-model.number="form.totalCodeRate" placeholder="请输入回码率，如 81" type="number" />
      </el-form-item> -->
<el-form-item label="是否代理" >
  <el-switch
    v-model="form.isAgent"
    
    active-text="是"
    inactive-text="否"
  />
</el-form-item>
    <!-- todo编辑暂未实现 -->

      <el-form-item label="项目价格">
        <div class="prices">
  <div
  class="price-row"
  v-for="(p, idx) in prices"
  :key="`${p.projectId}-${idx}`"
>
  <!-- 项目 ID -->
  <el-input
    v-model="p.projectId"
    placeholder="项目ID 如 xhs/14"
    style="width: 180px"
  />
  <!-- 线路 ID -->
  <el-input
    v-model.number="p.lineId"
    placeholder="线路ID 如 22"
    type="number"
    style="width: 140px"
  />
  <!-- 价格 -->
  <el-input
    v-model.number="p.price"
    placeholder="价格 如 0.6"
    type="number"
    style="width: 140px"
  />
  <el-button type="danger" link @click="removePrice(idx)">删除</el-button>
</div>
          <el-button type="primary" link @click="addPrice">+ 添加项目价格</el-button>
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
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { createAgentUser, updateAgentUser } from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({
   userId: '',
  username: '',
  password: '',
  isAgent: false, // ✅ 改为布尔值
  status: 1       // ✅ 用 0/1
//   totalGetCount: 0,
//   totalCodeRate: 0,
//   projectPrices: {}
})

const prices = ref([]) // [{ projectId, price }]
const saving = ref(false)
// eslint-disable-next-line no-unused-vars
const isEdit = computed(() => !!props.user)

watch(
  () => props.user,
  (val) => {
    if (val) {
      // 只认 id
      const id = val.id ?? ''
      let priceObj = val.projectPrices || val.priceJson || {}
      if (typeof priceObj === 'string') {
        try { priceObj = JSON.parse(priceObj) } catch { priceObj = {} }
      }
      prices.value = Object.entries(priceObj || {}).map(([k, v]) => ({
        projectId: String(k),
        lineId: undefined,
        price: Number(v)
      }))
      form.value = {
         userId: String(id),
        username: val.username ?? '',
        password: '',
        isAgent: !!val.isAgent,          // ✅ 转布尔
        status: Number(val.status ?? 1)  // ✅ 转数字
        // projectPrices: priceObj
      }
    } else {
      prices.value = []
      form.value = { 
        userId: '', 
        isAgent: false,
        status: 1,
         totalGetCount: 0, 
         totalCodeRate: 0,
          age: undefined, 
          projectPrices: {} }
    }
  },
  { immediate: true }
)

// 添加一行
function addPrice() {
  prices.value.push({ projectId: '', lineId: undefined, price: 0 })
}
function removePrice(idx) {
  prices.value.splice(idx, 1)
}

// function buildPriceArray() {
//   return prices.value
//     .filter(p => p.projectId != null && p.projectId !== '' && p.price != null)
//     .map(p => ({
//       projectId: String(p.projectId).trim(),
//       lineId: p.lineId != null ? Number(p.lineId) : undefined,
//       price: Number(p.price)
//     }))
// }
async function save() {
  const isEdit = !!(props.user && (props.user.userId || props.user.id))
  const payload = {
   username: form.value.username,
    password: form.value.password,
  isAgent: form.value.isAgent,   // ✅ 布尔
    status: Number(form.value.status) // ✅ 数字
    // totalGetCount: form.value.totalGetCount,
    // totalCodeRate: form.value.totalCodeRate,
    // projectPrices: buildPriceArray()
  
}

  // ✅ 编辑才带 userId
 if (isEdit) {
  payload.userId = form.value.userId  
}

  saving.value = true
  try {
    const res = isEdit
      ? await updateAgentUser(payload)
      : await createAgentUser(payload)

    if (!res.ok) {
      ElMessage.error(res.message || '保存失败')
      return
    }
    ElMessage.success('保存成功')
    emit('update:modelValue', false)
    emit('updated', payload)
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
.prices { display: flex; flex-direction: column; gap: 8px; }
.price-row { display: flex; gap: 8px; align-items: center; }
</style>
