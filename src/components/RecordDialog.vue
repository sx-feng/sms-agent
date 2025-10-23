<template>
  <el-dialog
    title="账单流水"
    :model-value="modelValue"
    @update:modelValue="onUpdate"
    width="700px"
    :close-on-click-modal="false"
  >
    <el-table :data="records" v-loading="loading" max-height="400" stripe>
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="timestamp" label="时间" width="160" />
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'success' : 'danger'" size="small">
            {{ row.type === 1 ? '收入' : '支出' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="金额" width="100" />
      <el-table-column prop="balanceAfter" label="余额" width="100" />
      <el-table-column prop="remark" label="说明" show-overflow-tooltip />
    </el-table>

    <template #footer>
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { viewAgentUserLedger } from '@/api/agent'
import { ElMessage } from 'element-plus'
const props = defineProps({ modelValue: Boolean, user: Object })
const emit = defineEmits(['update:modelValue'])

const records = ref([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
const startTime = ref('')
const endTime = ref('')

// 快捷选今天/最近7天（可选）
const dateRange = ref([])
watch(dateRange, () => {
  startTime.value = dateRange.value?.[0] ?? ''
  endTime.value = dateRange.value?.[1] ?? ''
})

watch(() => props.modelValue, val => val && load(), { immediate: true })

async function load() {
  if (!props.user?.id) return
  loading.value = true
  try {
    const params = {
      targetUserId: props.user.id, // 后端字段名
      page: page.value,
      size: size.value,
   
    }
    const res = await viewAgentUserLedger(params)
    if (res.ok) {
      records.value = (res.data.records || []).map(i => ({
        ...i,
        type: Number(i.type),
        amount: Number(i.amount),
        balance: Number(i.balance)
      }))
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取账单失败')
    }
  } catch {
    ElMessage.error('网络异常')
  } finally {
    loading.value = false
  }
}

function closeDialog() {
  emit('update:modelValue', false)
}
function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>