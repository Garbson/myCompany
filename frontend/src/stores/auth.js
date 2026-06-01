import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    // Modo trabalho: a company tem foco em tarefas/projetos internos, sem leads/freelas.
    // Marca-se com work_mode=1 na tabela companies.
    workMode: (state) => state.user?.work_mode === 1,
  },

  actions: {
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    },

    async register(name, email, password) {
      const { data } = await api.post('/auth/register', { name, email, password })
      this.token = data.token
      this.user = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    // Re-busca o usuário com campos atualizados (ex: work_mode da company)
    async refreshMe() {
      if (!this.token) return
      try {
        const { data } = await api.get('/auth/me')
        this.user = { ...this.user, ...data }
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch {}
    }
  }
})
