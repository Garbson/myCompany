<template>
  <header
    class="md:hidden sticky top-0 z-30 border-b border-[var(--paper-border)]"
    style="padding-top: var(--safe-top); padding-left: var(--safe-left); padding-right: var(--safe-right); background: var(--paper-surface); backdrop-filter: blur(12px);"
  >
    <div class="flex items-center justify-between px-4 h-12">
      <div class="flex items-center gap-2 min-w-0">
        <PageLogo size="sm" />
        <h1 class="font-serif text-base font-semibold text-ink-400 truncate">{{ title }}</h1>
      </div>
      <button
        v-if="user"
        @click="showSheet = true"
        class="shrink-0 flex items-center gap-2 px-1 py-1 rounded-full hover:bg-[var(--paper-surface-3)] transition"
        aria-label="Abrir menu da conta"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold overflow-hidden ring-1 ring-[var(--paper-border-strong)]"
          style="background: linear-gradient(135deg, #6B7A3F, #2C4A5C); color: #FDFBF5;"
        >
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="w-full h-full object-cover" />
          <span v-else>{{ userInitial }}</span>
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
        <div class="absolute inset-0 bg-ink-400/40 backdrop-blur-sm"></div>
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
            class="absolute bottom-0 left-0 right-0 paper-strong border-t border-[var(--paper-border-strong)] rounded-t-2xl"
            style="padding-bottom: calc(var(--safe-bottom) + 0.5rem)"
          >
            <div class="flex justify-center pt-2 pb-1">
              <div class="w-10 h-1 rounded-full bg-paper-300"></div>
            </div>
            <div class="p-5 flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold"
                style="background: linear-gradient(135deg, #6B7A3F, #2C4A5C); color: #FDFBF5;"
              >
                {{ userInitial }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-ink-400 truncate">{{ user?.name }}</p>
                <p class="text-xs text-ink-100 truncate">{{ user?.email }}</p>
              </div>
            </div>
            <div class="px-2 pb-2 space-y-0.5">
              <button
                @click="goConfig"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-ink-300 hover:bg-[var(--paper-surface-3)] active:bg-[var(--paper-surface-3)] transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="text-sm font-medium">Configurações</span>
              </button>
              <button
                @click="confirmLogout"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-terra-600 hover:bg-terra-500/10 active:bg-terra-500/15 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
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
import { hapticLight } from '../../services/haptics'
import PageLogo from '../brand/PageLogo.vue'

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
  '/anotacoes': 'Anotações',
  '/fluxogramas': 'Fluxogramas',
  '/leads': 'Leads',
  '/freelas': 'Freelas',
  '/configuracoes': 'Configurações',
}

const title = computed(() => {
  const path = route.path
  if (path === '/') return titles['/']
  const match = Object.keys(titles).find(p => p !== '/' && path.startsWith(p))
  return match ? titles[match] : 'myPaper'
})

function confirmLogout() {
  showSheet.value = false
  showConfirm.value = true
  hapticLight()
}

function goConfig() {
  showSheet.value = false
  hapticLight()
  router.push('/configuracoes')
}

function doLogout() {
  showConfirm.value = false
  auth.logout()
  router.push('/login')
}
</script>
