<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--paper-border)]"
    style="padding-bottom: var(--safe-bottom); padding-left: var(--safe-left); padding-right: var(--safe-right); background: var(--paper-surface); backdrop-filter: blur(12px);"
  >
    <div class="flex items-stretch justify-around px-1 pt-1">
      <router-link
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-0 transition-colors"
        :class="isActive(item.path) ? 'text-terra-500' : 'text-ink-50 hover:text-ink-200'"
        @click="hapticSelection()"
      >
        <div
          class="flex items-center justify-center w-10 h-7 rounded-full transition-colors"
          :class="isActive(item.path) ? 'bg-terra-500/12' : ''"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
          </svg>
        </div>
        <span class="text-[10px] font-medium leading-tight truncate max-w-full">{{ item.label }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { hapticSelection } from '../../services/haptics'

const route = useRoute()
const auth = useAuthStore()

const workMode = computed(() => !!auth.workMode)

const allMenu = [
  { path: '/', label: 'Início', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10' },
  { path: '/tarefas', label: 'Tarefas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { path: '/projetos', label: 'Projetos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/anotacoes', label: 'Notas', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { path: '/fluxogramas', label: 'Fluxos', icon: 'M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' },
  { path: '/leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { path: '/freelas', label: 'Freelas', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
]

const menu = computed(() => {
  if (workMode.value) return allMenu.filter(m => !['/leads', '/freelas'].includes(m.path))
  return allMenu.filter(m => !m.workOnly)
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
