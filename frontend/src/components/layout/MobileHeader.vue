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
        @click="showSheet = true"
        class="shrink-0 flex items-center gap-2 px-1 py-1 rounded-full hover:bg-gray-800/60 transition"
        aria-label="Abrir menu da conta"
      >
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white">
          {{ userInitial }}
        </div>
      </button>
    </div>
  </header>

  <!-- Bottom sheet com info da conta -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showSheet" class="fixed inset-0 z-50 md:hidden" @click.self="showSheet = false">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="showSheet"
            class="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl"
            style="padding-bottom: calc(var(--safe-bottom) + 0.5rem)"
          >
            <div class="flex justify-center pt-2 pb-1">
              <div class="w-10 h-1 rounded-full bg-gray-700"></div>
            </div>
            <div class="p-5 flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base font-semibold text-white">
                {{ userInitial }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ user?.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ user?.email }}</p>
              </div>
            </div>
            <div class="px-2 pb-2">
              <button
                @click="confirmLogout"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 active:bg-red-500/15 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span class="text-sm font-medium">Sair da conta</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <ConfirmDialog
    :show="showConfirm"
    title="Sair da conta?"
    message="Você precisará fazer login novamente."
    confirm-label="Sair"
    danger
    @confirm="doLogout"
    @cancel="showConfirm = false"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ConfirmDialog from '../ui/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const user = computed(() => auth.user)
const userInitial = computed(() => user.value?.name?.charAt(0)?.toUpperCase() || '?')

const showSheet = ref(false)
const showConfirm = ref(false)

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

function confirmLogout() {
  showSheet.value = false
  showConfirm.value = true
}

function doLogout() {
  showConfirm.value = false
  auth.logout()
  router.push('/login')
}
</script>
