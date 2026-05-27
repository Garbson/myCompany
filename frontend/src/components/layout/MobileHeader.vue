<template>
  <header
    class="md:hidden sticky top-0 z-30 bg-gray-950/85 backdrop-blur-xl border-b border-gray-800/60"
    style="padding-top: var(--safe-top); padding-left: var(--safe-left); padding-right: var(--safe-right)"
  >
    <div class="flex items-center justify-between px-4 h-12">
      <div class="flex items-center gap-2 min-w-0">
        <img src="/logo.svg" alt="myCompany" class="w-7 h-7 shrink-0" />
        <h1 class="text-base font-semibold text-white truncate">{{ title }}</h1>
      </div>
      <button
        v-if="user"
        @click="logout"
        class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-800/60 transition"
        :title="user.email"
      >
        <div class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-semibold text-white">
          {{ userInitial }}
        </div>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const userInitial = computed(() => user.value?.name?.charAt(0)?.toUpperCase() || '?')

const titles = {
  '/': 'Dashboard',
  '/tarefas': 'Tarefas',
  '/projetos': 'Projetos',
  '/leads': 'Leads',
  '/freelas': 'Freelas'
}

const title = computed(() => {
  const path = route.path
  if (path === '/') return titles['/']
  const match = Object.keys(titles).find(p => p !== '/' && path.startsWith(p))
  return match ? titles[match] : 'myCompany'
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>
