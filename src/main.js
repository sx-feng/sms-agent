import { createApp } from 'vue'
import App from './App.vue'
import router from './router'       // 路由
import { createPinia } from 'pinia' // 状态管理
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
       // 你的全局样式（可选）

// 创建应用实例
const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 挂载到页面
app.mount('#app')
