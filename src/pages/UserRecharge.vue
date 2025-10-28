<template>
  <div class="agent-recharge-page">
     <button class="back-float-btn" @click="goBack">
      ⬅ 返回
    </button>
    <div class="card">
      <h2 class="title">下级充值 / 扣款</h2>

      <!-- 输入表单 -->
      <div class="form">
        <label>下级用户ID：</label>
        <input v-model="userId" type="text" placeholder="请输入下级ID" />

        <label>金额：</label>
        <input v-model.number="amount" type="number" placeholder="请输入金额" />

        <label>操作类型：</label>
        <select v-model="actionType">
          <option value="recharge">充值</option>
          <option value="deduct">扣款</option>
        </select>

        <button class="btn" @click="handleSubmit" :disabled="loading">
          {{ loading ? '处理中...' : (actionType === 'recharge' ? '确认充值' : '确认扣款') }}
        </button>
      </div>

      <!-- 操作结果提示 -->
      <div v-if="message" class="message" :class="{'success': success, 'error': !success}">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { rechargeAgentUser, deductAgentUser } from '@/api/agent'

const route = useRoute()
const router = useRouter()

const userId   = ref('')
const amount   = ref('')
const actionType = ref('recharge')
const loading  = ref(false)

onMounted(() => {
  userId.value = route.query.userId || ''   // ① 自动带参
})

async function handleSubmit() {
  if (!userId.value || !amount.value || Number(amount.value) <= 0) {
    ElMessage.warning('请输入有效的用户ID和正数金额')
    return
  }

  loading.value = true
  try {
    
    const res = await (
  actionType.value === 'recharge' ? rechargeAgentUser : deductAgentUser
)(
  Number(userId.value),
  Number(amount.value)
)
    if (res.ok) {
      ElMessage.success(actionType.value === 'recharge' ? '充值成功' : '扣款成功')
      userId.value = ''
      amount.value = ''
      router.back()          // ② 返回上级
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch {
    ElMessage.error('网络异常')
  } finally {
    loading.value = false
  }
}
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/reseller/sub-users') // 无历史则直接返回“下级管理”页
  }
}




</script>

<style scoped>
.agent-recharge-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: 40px;
}

.card {
  width: 90%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 24px 28px;
}

.title {
  text-align: center;
  font-size: 20px;
  color: #333;
  margin-bottom: 18px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

label {
  font-weight: 600;
  font-size: 14px;
  color: #444;
}

input,
select {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  outline: none;
  transition: border-color 0.25s;
}

input:focus,
select:focus {
  border-color: #f6c244;
  box-shadow: 0 0 3px rgba(246, 194, 68, 0.3);
}

.btn {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: 10px;
}

.btn:hover {
  background: linear-gradient(90deg, #ffd54f, #f9a825);
}

.message {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.message.success {
  color: #4caf50;
}

.message.error {
  color: #f44336;
}
.back-float-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.25s ease;
}

.back-float-btn:hover {
  background: #f6c244;
  color: #000;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

</style>
