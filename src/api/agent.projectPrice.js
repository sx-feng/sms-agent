// src/api/agent.projectPrice.js
// 接口：代理端查询当前登录代理自己的项目价格
// 方法：GET /api/agent/project/price
// 返回示例：
// {
//   code: 200,
//   message: "查询成功！",
//   data: [
//     {
//       id: 6,
//       createTime: "2025-10-23 16:47:07",
//       updateTime: "2025-10-23 16:47:07",
//       userId: 2,
//       projectTableId: null,
//       projectName: "陌陌1",
//       projectId: "14",
//       lineId: "14",
//       costPrice: 1.0,
//       remark: null,
//       agentPrice: 1.0
//     }
//   ]
// }
import { request } from '@/utils/request'

export const getAgentProjectPrice = () =>
  request(0, '/api/agent/project/price', {}, true)




