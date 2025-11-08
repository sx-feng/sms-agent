<template>
  <el-dialog
    :title="actionType === 'recharge' ? '下级充值' : '下级扣款'"
    :model-value="modelValue"
    width="420px"
    :close-on-click-modal="false"
    @update:modelValue="handleClose"
    @closed="resetForm"
  >
    <el-form label-width="100px" label-position="left">
      <el-form-item label="下级用户ID">
        <el-input v-model="userId" placeholder="请输入下级ID" clearable />
      </el-form-item>

      <el-form-item label="金额">
        <el-input-number
          v-model="amount"
          :min="1"
          style="width: 100%"
          placeholder="请输入金额"
        />
      </el-form-item>

      <el-form-item label="操作类型">
        <el-select v-model="actionType" style="width: 100%">
          <el-option label="充值" value="recharge" />
          <el-option label="扣款" value="deduct" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: flex-end; gap: 10px;">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ actionType === 'recharge' ? '确认充值' : '确认扣款' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { rechargeAgentUser, deductAgentUser } from '@/api/agent'

const props = defineProps({
  modelValue: Boolean,
  userIdProp: [String, Number],
  actionTypeProp: {
    type: String,
    default: 'recharge',
    validator: (value) => ['recharge', 'deduct'].includes(value),
  },
})
const emit = defineEmits(['update:modelValue', 'success'])

const userId = ref('')
const amount = ref() // 默认 undefined 以便显示 placeholder
const loading = ref(false)

// --- 核心修改在这里 ---
// 直接使用 prop 初始化 actionType，而不是通过 watch。
// 这种方式更直接，避免了组件创建时的潜在时序问题。
const actionType = ref(props.actionTypeProp)
// --- 修改结束 ---

// 监听 userIdProp 仍然是必要的
watch(
  () => props.userIdProp,
  (val) => {
    if (val) userId.value = String(val) // 确保是字符串
  },
  { immediate: true }
)

async function handleSubmit() {
  if (!userId.value || !amount.value || Number(amount.value) <= 0) {
    ElMessage.warning('请输入有效的用户ID和金额')
    return
  }

  loading.value = true
  try {
    const params = {
      userId: Number(userId.value),
      amount: Number(amount.value),
    }
    const res =
      actionType.value === 'recharge'
        ? await rechargeAgentUser(params)
        : await deductAgentUser(params)

    if (res.ok) {
      ElMessage.success(actionType.value === 'recharge' ? '充值成功' : '扣款成功')
      emit('success')
      emit('update:modelValue', false)
    } else {
      const errorMessage = typeof res.data === 'string' && res.data ? res.data : res.message
      ElMessage.error(errorMessage || '操作失败')
    }
  } catch {
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

function resetForm() {
  // 当弹窗关闭时，仅重置金额字段即可
  // userId 和 actionType 会在下次打开时由 props 重新初始化
  amount.value = undefined
}
</script>