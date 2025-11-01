import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
const LoginPage = () => import('@/pages/LoginPage.vue')
const DashBoard = () => import('@/pages/DashBoard.vue')
const SubUsers = () => import('@/pages/SubUsers.vue')
const PriceConfig = () => import('@/pages/PriceConfig.vue')
const UserBill = () => import('@/pages/UserBill.vue')
const ReportPage = () => import('@/pages/ReportPage.vue') // ✅ 新增引入

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/dashboard', component: DashBoard },

    // 快捷入口对应的路由 👇
    { path: '/reseller/users', component: SubUsers, meta: { title: '下级管理' } },

    // ✅ 新增路径 /reseller/report
    { path: '/reseller/report', component: ReportPage, meta: { title: '数据报表' } },

    { path: '/reseller/projects', component: PriceConfig, meta: { title: '项目价格配置' } },
    { path: '/reseller/userbill', component: UserBill, meta: { title: '账单记录' } },
  ]
})

// 登录拦截逻辑
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token') || localStorage.getItem('agent_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
