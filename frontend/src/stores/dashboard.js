import { defineStore } from 'pinia'
import api from '../api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    data: null,
    loading: false
  }),

  actions: {
    async fetch() {
      this.loading = true
      const { data } = await api.get('/dashboard')
      this.data = data
      this.loading = false
    }
  }
})
