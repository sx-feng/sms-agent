// src/api/agent.js
import { request } from '@/utils/request'

// ==================== 登录 ====================
// 代理登录（POST）
export const agentLogin = (data) => request(1, '/api/agent/login', data)
// 公告（获取当前用户公告列表，GET/Query）
export const agentNotice = (params = {}) => request(0, '/api/agent/notice', params)
// 代理仪表盘统计
export const getAgentDashboard = () =>
  request(0, '/api/agent/dashboard-stats', {}, true)
// ==================== 用户管理 ====================

// 查询下级用户列表（分页）
export const listAgentUsers = (params) => request(0, '/api/agent/listUsers', params, true)

// 创建下级用户
export const createAgentUser = (data) => request(1, '/api/agent/createUser', data)

// 修改下级用户信息
export const updateAgentUser = (data) => request(1, '/api/agent/updateUser', data)

// ==================== 余额操作 ====================

// 为下级用户充值
export const rechargeAgentUser = (targetUserId, amount) =>
  request(1, '/api/agent/rechargeUser', { targetUserId, amount },true)

// 扣减下级用户余额
export const deductAgentUser = (targetUserId, amount) =>
  request(1, '/api/agent/deductUser', { targetUserId, amount },true)

// ==================== 账本查看 ====================

// 查看下级用户资金账本
export const viewAgentUserLedger = (params) => request(0, '/api/agent/viewUserLedger', params, true)

// ==================== 仪表盘统计 ====================
// 获取首页四个统计卡片数据（GET）
export const getDashboardStats = (params = {}) => request(0, '/api/agent/dashboard-stats', params, true)

