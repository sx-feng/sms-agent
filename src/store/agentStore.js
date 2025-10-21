import { defineStore } from 'pinia'

export const useAgentStore = defineStore('agent', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: {}
  }),
  actions: {
    setToken(token) {
      const v = typeof token === 'string' ? token : (token ? String(token) : '')
      this.token = v
      localStorage.setItem('token', v)
    },
    clearToken() {
      this.token = ''
      localStorage.removeItem('token')
    },
    setUserInfo(info) {
      this.userInfo = info
    }
  }
})
