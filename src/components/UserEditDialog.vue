<template>
  <el-dialog
    title="下级编辑"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="用户ID">
        <el-input v-model="form.userId" placeholder="自动生成" disabled />
      </el-form-item>

      <el-form-item label="密码">
        <el-input v-model="form.password" placeholder="输入新密码" type="password" />
      </el-form-item>

      <el-form-item label="状态">
        <el-switch v-model="form.status" active-text="启用" inactive-text="禁用" />
      </el-form-item>

      <el-form-item label="项目价格JSON">
        <el-input
          v-model="form.priceJson"
          type="textarea"
          placeholder='例如 {"xhs":0.6,"dy":0.8}'
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
  
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({
  userId: '',
  password: '',
  status: 1,
  priceJson: '{}'
})

watch(
  () => props.user,
  (val) => {
    form.value = val
      ? { ...val }
      : { userId: '', password: '', status: 1, priceJson: '{}' }
  },
  { immediate: true }
)

function save() {
  emit('update:modelValue', false)
  emit('updated', form.value)
}

function onUpdate(val) {
  emit('update:modelValue', val)
}
</script>

