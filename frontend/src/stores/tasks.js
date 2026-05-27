import { defineStore } from 'pinia'
import api from '../api'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false
  }),

  actions: {
    async fetch() {
      this.loading = true
      const { data } = await api.get('/tasks')
      this.tasks = data
      this.loading = false
    },

    async create(task) {
      const { data } = await api.post('/tasks', task)
      this.tasks.unshift(data)
      return data
    },

    async update(id, changes) {
      const { data } = await api.put(`/tasks/${id}`, changes)
      const idx = this.tasks.findIndex(t => t.id === id)
      if (idx !== -1) this.tasks[idx] = data
      return data
    },

    async remove(id) {
      await api.delete(`/tasks/${id}`)
      this.tasks = this.tasks.filter(t => t.id !== id)
    }
  },

  getters: {
    byStatus: (state) => (status) => state.tasks.filter(t => t.status === status)
  }
})
