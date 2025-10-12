import { defineStore } from 'pinia'

export const useResellerStore = defineStore('resellerStore', {
  state: () => ({
    token: '',
    userInfo: {}
  }),
  actions: {
    setToken(t) {
      this.token = t
      localStorage.setItem('reseller_token', t)
    },
    setUserInfo(u) {
      this.userInfo = u
      localStorage.setItem('reseller_user', JSON.stringify(u))
    },
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.clear()
    }
  }
})
