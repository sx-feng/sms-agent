import { defineStore } from 'pinia'

export const useAgentStore = defineStore('agentStore', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: (() => {
      try { return JSON.parse(localStorage.getItem('agent_user') || '{}') } catch { return {} }
    })(),
  }),
  actions: {
    setToken(t) {
      this.token = t
      localStorage.setItem('token', t)
    },
    setUserInfo(u) {
      this.userInfo = u || {}
      localStorage.setItem('agent_user', JSON.stringify(this.userInfo))
    },
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('token')
      localStorage.removeItem('agent_user')
    }
  }
})

