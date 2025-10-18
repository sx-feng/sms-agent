<template>
  <el-dialog
    v-model="visible"
    :title="`编辑价格 - ${form.name}`"
    width="400px"
    @close="closeDialog"
  >
    <el-form label-width="80px">
      <el-form-item label="项目ID">
        <el-input v-model="form.id" disabled />
      </el-form-item>
      <el-form-item label="项目名">
        <el-input v-model="form.name" disabled />
      </el-form-item>
      <el-form-item label="成本价">
        <el-input v-model="form.cost" disabled />
      </el-form-item>
      <el-form-item label="最高价">
        <el-input v-model="form.max_price" disabled />
      </el-form-item>
      <el-form-item label="当前价">
        <el-input
          v-model.number="form.current_price"
          type="number"
          min="0"
          step="0.01"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="text-align: right;">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="savePrice">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({ project: Object })
const emit = defineEmits(['close', 'saved'])

const visible = ref(true)
const form = reactive({ ...props.project })

watch(() => props.project, (val) => Object.assign(form, val))

const closeDialog = () => {
  visible.value = false
  emit('close')
}

const savePrice = () => {
  if (form.current_price < form.cost) {
    ElMessage.error('不能低于成本价')
    return
  }
  if (form.current_price > form.max_price) {
    ElMessage.error('不能高于最高价')
    return
  }

  ElMessage.success('保存成功')
  emit('saved', { ...form })
  closeDialog()
}
</script>
