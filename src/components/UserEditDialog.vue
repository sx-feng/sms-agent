<template>
  <el-dialog
    title="下级编辑"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    width="720px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="120px">
      <!-- 用户ID -->
      <el-form-item label="用户ID">
        <el-input v-model="form.id" placeholder="自动生成/不可修改" disabled />
      </el-form-item>

      <!-- 用户名 -->
      <el-form-item label="用户名">
        <el-input v-model="form.username" placeholder="请输入用户名" />
      </el-form-item>

      <!-- 密码 -->
      <el-form-item label="密码">
        <el-input
          v-model="form.password"
          placeholder="请输入新密码（留空则不修改）"
          type="password"
          show-password
        />
      </el-form-item>

      <!-- 状态 -->
      <el-form-item label="状态">
        <el-switch v-model="form.status" active-text="启用" inactive-text="禁用" />
      </el-form-item>

      <!-- 是否代理 -->
      <el-form-item label="是否代理">
        <el-switch
          v-model="form.isAgent"
         
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <!-- 以下为暂不启用部分 -->
      <!-- <el-form-item label="取号总数">
        <el-input
          v-model.number="form.totalGetCount"
          placeholder="请输入取号总数"
          type="number"
        />
      </el-form-item>

      <el-form-item label="回码率(%)">
        <el-input
          v-model.number="form.totalCodeRate"
          placeholder="请输入回码率，如 81"
          type="number"
        />
      </el-form-item>

      <el-form-item label="项目价格">
        <div class="prices">
          <div
            class="price-row"
            v-for="(p, idx) in prices"
            :key="`${p.projectId}-${idx}`"
          >
            <el-input
              v-model="p.projectId"
              placeholder="项目ID 如 xhs/14"
              style="width: 180px"
            />
            <el-input
              v-model.number="p.lineId"
              placeholder="线路ID 如 22"
              type="number"
              style="width: 140px"
            />
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
      </el-form-item> -->
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updateAgentUser } from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({
  id: '',
  username: '',
  password: '',
    isAgent: false, // ✅ 改为布尔
  status: 1       // ✅ 数字 0/1
  // totalGetCount: 0,
  // totalCodeRate: 0,
  // projectPrices: {}
})

const prices = ref([]) // 保留但不启用
const saving = ref(false)

// 监听传入的用户数据
watch(
  () => props.user,
  (val) => {
    if (val) {
      const id = val.id ?? ''
      let priceObj = val.projectPrices || val.priceJson || {}
      if (typeof priceObj === 'string') {
        try {
          priceObj = JSON.parse(priceObj)
        } catch {
          priceObj = {}
        }
      }

      prices.value = Object.entries(priceObj || {}).map(([k, v]) => ({
        projectId: String(k),
        lineId: undefined,
        price: Number(v)
      }))

      form.value = {
        id: String(id),
        username: val.username ?? '',
        password: '',
         isAgent: false,
        status: 1
        // totalGetCount: Number(val.totalGetCount ?? 0),
        // totalCodeRate: Number(val.totalCodeRate ?? 0),
        // projectPrices: priceObj
      }
    } else {
      prices.value = []
      form.value = {
        id: '',
        username: '',
        password: '',
       isAgent: false,
        status: 1
        // totalGetCount: 0,
        // totalCodeRate: 0,
        // projectPrices: {}
      }
    }
  },
  { immediate: true }
)

// 保存（只走 update 接口）
async function save() {
  const payload = {
    id: form.value.id,
    username: form.value.username,
    password: form.value.password,
        isAgent: form.value.isAgent,          // ✅ 保持布尔
    status: Number(form.value.status)
    // totalGetCount: form.value.totalGetCount,
    // totalCodeRate: form.value.totalCodeRate,
    // projectPrices: buildPriceArray()
  }

  saving.value = true
  try {
    const res = await updateAgentUser(payload)
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
.prices {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.price-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
