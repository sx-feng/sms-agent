<template>
  <el-dialog
    title="账单流水记录"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    width="80%"
    :close-on-click-modal="false"
  >
    <el-table :data="records" border style="width: 100%" v-loading="loading">
      <el-table-column type="index" label="#" width="60" />
      <el-table-column prop="time" label="时间" width="180" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="amount" label="金额 (￥)" width="120" />
      <el-table-column prop="balance" label="余额 (￥)" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
 
    <template #footer>
      <el-button @click="closeDialog">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
// import { ElMessage } from 'element-plus'

// 接收父组件的 v-model
const props = defineProps({
  modelValue: { type: Boolean, required: true }
})
const emit = defineEmits(['update:modelValue'])

// 数据
const records = ref([])
const loading = ref(false)

// 监听弹窗打开时加载数据
watch(
  () => props.modelValue,
  (val) => {
    if (val) loadRecords()
  }
)

// 模拟加载账单数据
function loadRecords() {
  loading.value = true
  setTimeout(() => {
    records.value = [
      { time: '2025-10-16 11:00:00', type: '充值', amount: 100, balance: 1200, description: '手动充值' },
      { time: '2025-10-15 18:30:00', type: '扣款', amount: -50, balance: 1100, description: '为下级扣款' }
    ]
    loading.value = false
  }, 600)
}

// 关闭弹窗
function closeDialog() {
  emit('update:modelValue', false)
}

// 透传内部对可见性的更新
function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>
