<template>
  <el-dialog
    title="下级充值 / 扣款"
    :model-value="modelValue"
    width="420px"
    :close-on-click-modal="false"
    @update:modelValue="emit('update:modelValue', $event)"
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
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
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
})
const emit = defineEmits(['update:modelValue', 'success'])

const userId = ref('')
const amount = ref(0)
const actionType = ref('recharge')
const loading = ref(false)

// 初始化 userId
watch(
  () => props.userIdProp,
  (val) => {
    if (val) userId.value = val
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
    const res =
      actionType.value === 'recharge'
        ? await rechargeAgentUser(Number(userId.value), Number(amount.value))
        : await deductAgentUser(Number(userId.value), Number(amount.value))

    if (res.ok) {
      ElMessage.success(actionType.value === 'recharge' ? '充值成功' : '扣款成功')
      emit('success')
      emit('update:modelValue', false)
      resetForm()
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  amount.value = 0
  actionType.value = 'recharge'
}
</script>
