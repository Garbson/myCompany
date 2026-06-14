import { defineStore } from 'pinia'

export const SECTIONS = [
  {
    path: '/',
    label: 'Dashboard',
    component: 'Dashboard',
    icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10',
  },
  {
    path: '/tarefas',
    label: 'Tarefas',
    component: 'Tarefas',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    path: '/projetos',
    label: 'Projetos',
    component: 'Projetos',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    path: '/anotacoes',
    label: 'Anotações',
    component: 'Anotacoes',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    path: '/rotina',
    label: 'Rotina',
    component: 'Rotina',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    workOnly: true,
  },
  {
    path: '/leads',
    label: 'Leads',
    component: 'Leads',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    noWork: true,
  },
  {
    path: '/freelas',
    label: 'Freelas',
    component: 'Freelas',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    noWork: true,
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    component: 'Configuracoes',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

function load() {
  try {
    return JSON.parse(localStorage.getItem('tabs') || '[]')
  } catch {
    return []
  }
}

function save(tabs) {
  localStorage.setItem('tabs', JSON.stringify(tabs))
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: load(),
  }),

  getters: {
    keepAliveNames: (state) => state.tabs.map((t) => t.component),

    isOpen: (state) => (path) => state.tabs.some((t) => t.path === path),

    hasTabs: (state) => state.tabs.length > 0,
  },

  actions: {
    openTab(section) {
      if (!this.tabs.some((t) => t.path === section.path)) {
        this.tabs.push({ ...section })
        save(this.tabs)
      }
    },

    closeTab(path) {
      this.tabs = this.tabs.filter((t) => t.path !== path)
      save(this.tabs)
    },

    ensureTab(path) {
      const section = SECTIONS.find((s) => s.path === path)
      if (section) this.openTab(section)
    },
  },
})
