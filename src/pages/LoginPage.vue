
<template>

  <div class="login-container">
    <div class="login-card">
      <div class="title">代理后台登录</div>

      <el-form
        :model="form"
        :rules="rules"
        ref="loginForm"
        label-position="top"
        class="login-form"
      >
        <el-form-item label="账号" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入代理账号"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useResellerStore } from '@/store/resellerStore'
// 预留接口引入


const router = useRouter()
const loginForm = ref(null)
const loading = ref(false)
const resellerStore = useResellerStore()

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 登录逻辑：预留接口位置
const handleLogin = () => {
  loginForm.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      // ===============================
      // ✅ 登录接口位置（你后续替换这里）
      // const res = await resellerLogin(form.username, form.password)
      // if (res.code === 200) {
      //   resellerStore.setToken(res.data.token)
      //   resellerStore.setUserInfo(res.data.user)
      //   ElMessage.success('登录成功')
      //   router.push('/dashboard')
      // } else {
      //   ElMessage.error(res.message || '登录失败')
      // }
      // ===============================

      // 模拟登录占位逻辑（测试用）
      if (form.username === 'admin' && form.password === '123456') {
        resellerStore.setToken('mock_token')
        resellerStore.setUserInfo({ username: form.username })
        ElMessage.success('登录成功（测试模式）')
        
console.log('跳转中...')


        router.push('/DashBoard')
      } else {
        ElMessage.error('账号或密码错误')
      }
    } catch (err) {
      ElMessage.error('请求异常，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #2b5876, #4e4376);
}

.login-card {
  width: 90%;
  max-width: 360px;
  background: #fff;
  border-radius: 16px;
  padding: 30px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>
