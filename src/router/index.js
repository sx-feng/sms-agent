import { createRouter, createWebHistory } from 'vue-router'

// 页面组件
const LoginPage = () => import('@/pages/LoginPage.vue')
const DashBoard = () => import('@/pages/DashBoard.vue')
const SubUsers = () => import('@/pages/SubUsers.vue')
const UserRecharge = () => import('@/pages/UserRecharge.vue')
const PriceConfig = () => import('@/pages/PriceConfig.vue')
const UserBill = () => import('@/pages/UserBill.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginPage },
    { path: '/dashboard', component: DashBoard },

    // 快捷入口对应的路由 👇
    { path: '/reseller/users', component: SubUsers, meta: { title: '下级管理' } },
    { path: '/reseller/recharge', component: UserRecharge, meta: { title: '充值 / 扣款' } },
    { path: '/reseller/projects', component: PriceConfig, meta: { title: '项目价格配置' } },
    { path: '/reseller/records', component: UserBill, meta: { title: '账单记录' } },
  ]
})

export default router
