<template>
  <div>
    <h4 class="text-xs font-semibold text-ink-100 uppercase tracking-wide mb-2">
      Comentários
      <span v-if="items.length" class="ml-1 text-ink-50 normal-case font-normal">{{ items.length }}</span>
    </h4>

    <div v-if="items.length" class="relative space-y-3 mb-3 pl-5">
      <!-- linha da timeline -->
      <div class="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-blue-500/40 via-white/10 to-transparent"></div>

      <div v-for="c in items" :key="c.id" class="relative group">
        <div class="absolute -left-5 top-2.5 w-3 h-3 rounded-full bg-terra-500 ring-2 ring-slate-900 shadow-lg shadow-paper"></div>
        <div class="glass-light rounded-lg p-3">
          <div class="flex items-center justify-between gap-2 mb-1">
            <p class="text-xs font-medium text-ink-200 truncate">
              {{ c.user_name || 'Você' }}
            </p>
            <div class="flex items-center gap-2 shrink-0">
              <time class="text-[10px] text-ink-50">{{ formatDate(c.created_at) }}</time>
              <button
                v-if="canDelete(c)"
                @click="remove(c)"
                class="opacity-0 group-hover:opacity-100 text-ink-50 hover:text-terra-600 transition-opacity"
                aria-label="Apagar"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <p class="text-sm text-ink-300 whitespace-pre-wrap break-words">{{ c.body }}</p>
        </div>
      </div>
    </div>

    <form @submit.prevent="add" class="flex gap-2">
      <input
        v-model="newBody"
        type="text"
        placeholder="Escrever comentário…"
        class="flex-1 px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 placeholder-gray-500 focus:outline-none focus:border-indigo_ink-500"
      />
      <button
        type="submit"
        :disabled="!newBody.trim()"
        class="px-3 py-2 text-xs font-medium bg-terra-500 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-ink-400 rounded-lg transition-colors"
      >
        Enviar
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../api'
import { useAuthStore } from '../../stores/auth'
import { hapticLight } from '../../services/haptics'
import { useToast } from '../../composables/useToast'

const props = defineProps({ taskId: { type: [Number, String], required: true } })
const auth = useAuthStore()
const toast = useToast()

const items = ref([])
const newBody = ref('')

function canDelete(c) {
  return c.user_id === auth.user?.id
}

function formatDate(s) {
  if (!s) return ''
  const d = new Date(s.replace(' ', 'T'))
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

async function load() {
  try {
    const { data } = await api.get(`/tasks/${props.taskId}/comments`)
    items.value = data
  } catch {
    items.value = []
  }
}

async function add() {
  const body = newBody.value.trim()
  if (!body) return
  try {
    const { data } = await api.post(`/tasks/${props.taskId}/comments`, { body })
    items.value.push(data)
    newBody.value = ''
    hapticLight()
  } catch {
    toast.error('Falha ao comentar')
  }
}

async function remove(c) {
  items.value = items.value.filter((x) => x.id !== c.id)
  try {
    await api.delete(`/comments/${c.id}`)
    hapticLight()
  } catch {
    items.value.push(c)
    toast.error('Falha ao apagar')
  }
}

watch(() => props.taskId, load, { immediate: true })
</script>
