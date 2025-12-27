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

// 批量删除下级用户
// data 参数示例: [101, 102, 103]
export const deleteAgentUsers = (data) => request(1, '/api/agent/deleteUsers', data)

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


//获取自己的项目价格配置
/**
 * 
 * @returns {Promise} 返回包含代理自己项目价格配置的 Promise 对象
 * 返回数据：{
    "code": 200,
    "message": "查询成功！",
    "data": [
        
        {
            "id": 130,
            "createTime": "2025-11-06 16:14:04",
            "updateTime": "2025-11-06 16:14:04",
            "userId": 2,
            "projectTableId": 19,
            "projectName": "222",
            "projectId": "222",
            "lineId": "222",
            "costPrice": 2.00,
            "remark": null,
            "agentPrice": 3.00
        },
        {
            "id": 170,
            "createTime": "2025-11-07 15:21:32",
            "updateTime": "2025-11-07 15:21:32",
            "userId": 2,
            "projectTableId": 20,
            "projectName": "MM首③24H",
            "projectId": "101",
            "lineId": "3",
            "costPrice": 5.50,
            "remark": null,
            "agentPrice": 10.00
        }
    ]
}
 */
export const getAgentProjectPrice = () =>
  request(0, '/api/agent/project/price', {}, true)

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
    lineId: params.lineId || '',
    startTime: params.startTime || '',   // ✅ 新增
    endTime: params.endTime || ''        // ✅ 新增
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


// 分页查询项目列表
export const getProjectList = (params) => request(0, '/api/project/find/all', params, true)

/**
 * 编辑或更新指定用户的项目价格配置
 * @param {object} data - 包含用户ID和该用户全新的项目价格配置列表
 * @param {number} data.userId - 目标用户的ID
 * @param {Array<object>} data.projectPrices - 项目价格配置数组
 *  {
    userId: 123, // 示例用户ID
    userName: 'exampleUser', // 用户名（如果需要）
    projectPrices: [
      {
        // 第一个项目的价格信息
        id: 1, // 项目配置表id
        userProjectLineTableId: 101, // 用户项目线路配置表id
        projectName: '项目A',
        projectId: 'PROJ_A',
        lineId: 'LINE_1',
        price: 15.50,
        costPrice: 10.00,
        maxPrice: 20.00,
        minPrice: 12.00,
      },
      {
        // 第二个项目的价格信息
        id: 2,
        userProjectLineTableId: 102,
        projectName: '项目B',
        projectId: 'PROJ_B',
        lineId: 'LINE_2',
        price: 25.00,
        costPrice: 18.00,
        maxPrice: 30.00,
        minPrice: 22.00,
      }
      // ... 其他项目
    ]
  };
 * @returns {Promise}
 */
export const updateUserProjectPrices = (data) => {
  return request(
 1,'/api/agent/sub-user-project-prices/update', // 后端 Controller 中定义的 URL
    data // 请求体，其结构应与后端的 SubUserProjectPriceDTO 匹配
  );
}

/**
 * 根据下级用户ID获取其项目价格配置列表
 * @param {number} userId - 下级用户的ID
 * @returns {Promise} - 返回包含项目价格配置列表的 Promise 对象
 * {
    "code": 200,
    "message": "查询成功",
    "data": [
        {
            "id": 32,
            "createTime": "2025-10-23 16:47:07",
            "updateTime": "2025-10-23 16:47:07",
            "userId": 11,
            "projectTableId": null,
            "projectName": "陌陌15",
            "projectId": "16",
            "lineId": "16",
            "costPrice": 1.00,
            "remark": null,
            "agentPrice": 1.00
        },
        {
            "id": 52,
            "createTime": "2025-11-04 15:14:06",
            "updateTime": "2025-11-04 15:14:06",
            "userId": 11,
            "projectTableId": 16,
            "projectName": "JD①",
            "projectId": "109",
            "lineId": "1",
            "costPrice": 7.80,
            "remark": null,
            "agentPrice": 15.00
        }
    ]
}
 */
export const getSubUserProjectPricesById = (userId) => {
  return request(
    0,
    '/api/agent/user/project-prices',
    { userId },
    true
  );
};

/**
 * 查询代理总利润
  GET /api/agent/by-user/totalProfit
  数据在data中
  接口ID：374305239
  接口地址：https://app.apifox.com/link/project/7230479/apis/api-374305239
 */
export const getAgentTotalProfit = () => {
  return request(0,'/api/agent/by-user/totalProfit');
}

/**
 * 代理-获取下级用户线路统计数据
  POST /api/agent/stats/user-line
  接口ID：383783497
  接口地址：https://app.apifox.com/link/project/7230479/apis/api-383783497
 */
export const getUserLineStats = (data) => {
  return request(1,'/api/agent/stats/user-line',data);
}

/**
 * 查询代理自己的账本记录 (对应图片中的筛选功能)
  GET /api/agent/my-ledger
  Query 参数
userName
string 
用户名
可选
remark
string 
备注
可选
startTime
string 
开始时间
可选
endTime
string 
结束时间
可选
fundType
integer 
资金类型
可选
ledgerType
integer 
账本类型
可选
page
integer 
页码
必需
示例值:
1
size
integer 
每页条数
必需
示例值:
10
  接口ID：383883159
  接口地址：https://app.apifox.com/link/project/7230479/apis/api-383883159
 */
export const getAgentMyLedger = (params) => {
  return request(0,'/api/agent/my-ledger',params,true);
}

// 1. 根据用户id获取用户模板配置的接口 (用于编辑回显)
export const getAgentSubUserConfig = (userId) => {
  // 注意：这里传参是 { userId } 对象，对应后端 @RequestParam
  return request(0, '/api/agent/user/config-info', { userId }, true);
};

// 2. 根据id获取价格模板明细接口 (用于选中模板后的预览)
export const getAgentTemplateItems = (templateId) => {
  return request(0, `/api/agent/price-templates/${templateId}/items`)
}

// 3. 获取当前代理自己的价格模板列表 (用于下拉框选择)
export const getAgentPriceTemplatesby = () => {
  return request(0, '/api/agent/template/list');
}

// 获取代理自己的模板配置（成本价）
// 对应后端: @GetMapping("/price-templates/my")
export const getAgentSelfTemplateItems = () => {
  return request(0, '/api/agent/price-templates/my');
}
/**
代理：清理自己的历史账本记录
  POST /api/agent/ledger/clear
  接口ID：397832353
  接口地址：https://app.apifox.com/link/project/7230479/apis/api-397832353
 */
export const leaderClear =()=>{
  return request(1,`/api/agent/ledger/clear`);
} 
/**
 * 代理：清理自己的历史号码记录
  POST /api/agent/number/clear
  接口ID：397832354
  接口地址：https://app.apifox.com/link/project/7230479/apis/api-397832354
 */
export const numberClear =()=>{
  return request(1,`/api/agent/number/clear`);
} 
