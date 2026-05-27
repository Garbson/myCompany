import { defineStore } from 'pinia'
import api from '../api'

export const useLeadStore = defineStore('leads', {
  state: () => ({
    leads: [],
    loading: false
  }),

  actions: {
    async fetch() {
      this.loading = true
      const { data } = await api.get('/leads')
      this.leads = data
      this.loading = false
    },

    async create(lead) {
      const { data } = await api.post('/leads', lead)
      this.leads.unshift(data)
      return data
    },

    async update(id, changes) {
      const { data } = await api.put(`/leads/${id}`, changes)
      const idx = this.leads.findIndex(l => l.id === id)
      if (idx !== -1) this.leads[idx] = data
      return data
    },

    async remove(id) {
      await api.delete(`/leads/${id}`)
      this.leads = this.leads.filter(l => l.id !== id)
    }
  },

  getters: {
    byStatus: (state) => (status) => state.leads.filter(l => l.status === status)
  }
})
