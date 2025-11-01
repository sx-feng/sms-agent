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
// 下级账单流水（GET，参数放 Query）
export const UserLedger = (params) =>
  request(0, '/api/agent/subordinate-ledgers', params, true)
// ==================== 仪表盘统计 ====================
// 获取首页四个统计卡片数据（GET）
export const getDashboardStats = (params = {}) => request(0, '/api/agent/dashboard-stats', params, true)

// 项目价格配置
// 代理获取「项目列表」接口（GET）
export const getAgentProjects = (params) =>
  request(0, '/api/agent/get/by-agent/project', params, true)

// 更新
export const getProjectConfig = () =>
  request(0, '/api/agent/get/by-agent/project', {}, true)

export function updateProjectConfig(data) {
  return request(
    1,  // 1 表示 POST
    '/api/agent/update/by-agent/project-config',  // ✅ 这是第二个参数 url
    {
      userProjectLineId: Number(data.id),
      agentPrice: Number(data.price),
      remark: data.remark ?? '',
           projectId: data.projectId,             // ✅ 新增字段
      lineId: data.lineId   
    }
  )
}
// ==================== 数据报表 ====================

// 获取代理端数据报表（GET）
// 返回各项目的汇总与线路明细
export const getAgentReportData = (params = {}) => {
  const query = {
    current: params.current ?? 1,
    size: params.size ?? 10,
    projectName: params.projectName || '',
    projectId: params.projectId || '',
    lineId: params.lineId || ''
  }
  return request(1, '/api/agent/get/data', query)
}
// 查询代理下级用户的取号记录（支持多条件筛选）
export const getAgentSubordinateNumberRecords = (data) =>
  request(1, '/api/agent/subordinate-number-records', data)
// ==================== 价格模板管理 ====================

// 获取自己创建的所有价格模板（GET）
export const getAgentPriceTemplates = () =>
  request(0, '/api/agent/price-templates/get')

// 创建新的价格模板（POST）
export const addAgentPriceTemplate = (data) =>
  request(1, '/api/agent/price-templates/add', data)

// 更新已有价格模板（POST）
export const updateAgentPriceTemplate = (templateId, data) =>
  request(1, `/api/agent/price-templates/update/${templateId}`, data)

// 删除价格模板（GET）
export const deleteAgentPriceTemplate = (templateId) =>
  request(0, `/api/agent/price-templates/delete/${templateId}`)
