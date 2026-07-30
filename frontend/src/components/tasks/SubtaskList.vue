<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-xs font-semibold text-ink-100 uppercase tracking-wide">
        Subtarefas
        <span v-if="items.length" class="ml-1 text-ink-50 normal-case font-normal">
          {{ doneCount }}/{{ items.length }}
        </span>
      </h4>
      <div v-if="items.length" class="flex items-center gap-2">
        <div class="w-20 h-1.5 bg-[var(--paper-surface-2)] rounded-full overflow-hidden">
          <div
            class="h-full bg-terra-500 transition-all"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
        <span class="text-[10px] text-ink-50 tabular-nums">{{ progress }}%</span>
      </div>
    </div>

    <ul v-if="items.length" class="space-y-1 mb-2">
      <li
        v-for="s in items"
        :key="s.id"
        class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--paper-surface-2)] group"
      >
        <button
          @click="toggle(s)"
          class="w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors"
          :class="s.is_done ? 'bg-olive-500 border-green-500' : 'border-[var(--paper-border-strong)] hover:border-blue-400'"
        >
          <svg v-if="s.is_done" class="w-2.5 h-2.5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <span
          class="flex-1 text-sm text-ink-300 break-words"
          :class="{ 'line-through opacity-50': s.is_done }"
        >{{ s.title }}</span>
        <button
          @click="remove(s)"
          class="opacity-0 group-hover:opacity-100 text-ink-50 hover:text-terra-600 transition-opacity"
          aria-label="Remover"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    </ul>

    <form @submit.prevent="add" class="flex gap-2">
      <input
        v-model="newTitle"
        type="text"
        placeholder="+ Adicionar subtarefa"
        class="flex-1 px-3 py-1.5 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 placeholder-gray-500 focus:outline-none focus:border-indigo_ink-500 transition-colors"
      />
      <button
        v-if="newTitle.trim()"
        type="submit"
        class="px-3 py-1.5 text-xs bg-terra-500 hover:bg-blue-500 text-ink-400 rounded-lg transition-colors"
      >
        Adicionar
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '../../api'
import { hapticLight, hapticSuccess } from '../../services/haptics'
import { useToast } from '../../composables/useToast'
import { useRealtimeRefresh } from '../../composables/useRealtimeRefresh'

const props = defineProps({ taskId: { type: [Number, String], required: true } })
const toast = useToast()

const items = ref([])
const newTitle = ref('')

const doneCount = computed(() => items.value.filter((s) => s.is_done).length)
const progress = computed(() =>
  items.value.length ? Math.round((doneCount.value / items.value.length) * 100) : 0
)

async function load() {
  try {
    const { data } = await api.get(`/tasks/${props.taskId}/subtasks`)
    items.value = data
  } catch {
    items.value = []
  }
}

async function add() {
  const title = newTitle.value.trim()
  if (!title) return
  try {
    const { data } = await api.post(`/tasks/${props.taskId}/subtasks`, { title })
    items.value.push(data)
    newTitle.value = ''
    hapticLight()
  } catch {
    toast.error('Falha ao adicionar')
  }
}

async function toggle(s) {
  const next = s.is_done ? 0 : 1
  s.is_done = next
  try {
    await api.put(`/subtasks/${s.id}`, { is_done: next })
    if (next) hapticSuccess()
    else hapticLight()
  } catch {
    s.is_done = next ? 0 : 1
    toast.error('Falha ao atualizar')
  }
}

async function remove(s) {
  items.value = items.value.filter((x) => x.id !== s.id)
  try {
    await api.delete(`/subtasks/${s.id}`)
    hapticLight()
  } catch {
    items.value.push(s)
    toast.error('Falha ao remover')
  }
}

useRealtimeRefresh(load, ['/api/tasks/', '/api/subtasks/'])
watch(() => props.taskId, load, { immediate: true })
</script>
