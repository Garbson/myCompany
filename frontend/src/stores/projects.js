import { defineStore } from 'pinia'
import api from '../api'

export const useProjectStore = defineStore('projects', {
  state: () => ({
    projects: [],
    loading: false
  }),

  actions: {
    async fetch() {
      this.loading = true
      const { data } = await api.get('/projects')
      this.projects = data
      this.loading = false
    },

    async create(project) {
      const { data } = await api.post('/projects', project)
      this.projects.unshift(data)
      return data
    },

    async update(id, changes) {
      const { data } = await api.put(`/projects/${id}`, changes)
      const idx = this.projects.findIndex(p => p.id === id)
      if (idx !== -1) this.projects[idx] = data
      return data
    },

    async remove(id) {
      await api.delete(`/projects/${id}`)
      this.projects = this.projects.filter(p => p.id !== id)
    },

    async getPayments(projectId) {
      const { data } = await api.get(`/projects/${projectId}/payments`)
      return data
    },

    async addPayment(projectId, payment) {
      const { data } = await api.post(`/projects/${projectId}/payments`, payment)
      return data
    },

    async payInstallment(paymentId) {
      const { data } = await api.put(`/projects/payments/${paymentId}/pay`)
      return data
    }
  }
})
