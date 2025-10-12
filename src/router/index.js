import { createRouter, createWebHistory } from 'vue-router'
// import { useResellerStore } from '@/store/resellerStore'

// ✅ 改这里：引用 LoginPage.vue
const LoginPage = () => import('@/pages/LoginPage.vue')
const DashBoard = () => import('@/pages/DashBoard.vue')


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: LoginPage, // ✅ 使用新文件名
      meta: { title: '登录', public: true }
    },
    {
      path: '/DashBoard',
      name: 'Dashboard',
      component: DashBoard,
      meta: { title: '控制台' }
    }
  ]
})

// 路由守卫：未登录禁止进入受限页面
// router.beforeEach((to, from, next) => {
//   const store = useResellerStore()
//   const token = store.token || localStorage.getItem('reseller_token')

//   // 设置页面标题
//   if (to.meta.title) {
//     document.title = to.meta.title
//   }

//   // 允许访问公开页面（如登录页）
//   if (to.meta.public) {
//     next()
//     return
//   }

//   // 未登录自动跳转登录
//   if (!token) {
//     next('/login')
//   } else {
//     next()
//   }
// })

export default router
