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
      
      <!-- 展示用户基础信息 -->
      <el-form-item label="用户名">
        <el-input :model-value="userInfo?.userName || '--'" disabled />
      </el-form-item>
      
      <el-form-item label="当前余额">
         <el-tag type="info" size="large">{{ userInfo?.balance || 0 }}</el-tag>
      </el-form-item>

      <el-form-item label="金额">
        <el-input-number
          v-model="amount"
          :min="0"
          style="width: 100%"
          :placeholder="actionType === 'recharge' ? '请输入充值金额' : '请输入扣款金额'"
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
import { ref } from 'vue' // 不需要 watch 了，直接用 props 即可
import { ElMessage } from 'element-plus'
import { rechargeAgentUser, deductAgentUser } from '@/api/agent'

const props = defineProps({
  modelValue: Boolean,
  // 核心修改：接收整个对象
  userInfo: {
    type: Object,
    default: () => ({}),
  },
  actionTypeProp: {
    type: String,
    default: 'recharge',
    validator: (value) => ['recharge', 'deduct'].includes(value),
  },
})
const emit = defineEmits(['update:modelValue', 'success'])

const amount = ref()
const loading = ref(false)

// 初始化 actionType
const actionType = ref(props.actionTypeProp)

async function handleSubmit() {
  // 直接从 props.userInfo 中获取 id
  const targetUserId = props.userInfo?.id
  
  if (!targetUserId) {
    ElMessage.error('用户信息缺失，无法操作')
    return
  }

  if (!amount.value || Number(amount.value) <= 0) {
    ElMessage.warning('请输入有效的金额')
    return
  }

  loading.value = true
  try {
    const res =
      actionType.value === 'recharge'
        ? await rechargeAgentUser(targetUserId, amount.value)
        : await deductAgentUser(targetUserId, amount.value)

    if (res.ok) { // 假设你的 request 封装返回结构包含 ok  res.message || '操作成功:'+res.data || ''
      console.log('操作成功,返回充值参数:', res)
      ElMessage.info(`${res.message || '操作成功:'} ${res.data || ''}`)
      emit('success')
      emit('update:modelValue', false)
    } else {
      const errorMessage = typeof res.data === 'string' && res.data ? res.data : res.message
      ElMessage.error(errorMessage || '操作失败')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('网络异常，请稍后重试')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('update:modelValue', false)
}

function resetForm() {
  amount.value = undefined
  // 这里的 actionType 不需要重置，因为下次打开会根据 props 重新渲染，
  // 或者如果你希望每次打开都重置为 props 传入的值，可以在 watch(modelValue) 里处理，
  // 但目前这样通常足够了。
}
</script>