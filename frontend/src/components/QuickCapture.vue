<template>
  <button
    v-if="!open"
    @click="openCapture"
    class="quick-capture-fab fixed z-30 inline-flex items-center gap-2 px-4 py-3"
    aria-label="Capturar uma ideia rapidamente"
    title="Captura rápida"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>
    </svg>
    <span class="hidden md:inline text-sm font-semibold">Capturar</span>
  </button>

  <Modal :show="open" title="Caixa de entrada" size="md" @close="closeCapture">
    <form class="space-y-4" @submit.prevent="save">
      <p class="text-sm text-ink-100">
        Registre agora. Você decide onde organizar depois.
      </p>
      <textarea
        ref="inputRef"
        v-model="content"
        rows="5"
        required
        placeholder="Uma ideia, tarefa, lembrete ou qualquer coisa que não pode se perder…"
        class="w-full px-4 py-3 bg-[#FFF4C2] border border-[var(--paper-border-strong)] rounded-[3px] text-ink-400 placeholder-ink-50 outline-none focus:border-terra-500 resize-none shadow-paper"
        @keydown.meta.enter.prevent="save"
        @keydown.ctrl.enter.prevent="save"
      ></textarea>
      <div class="flex items-center gap-2">
        <span class="text-xs text-ink-50 mr-1">Parece uma</span>
        <button
          v-for="option in kinds"
          :key="option.value"
          type="button"
          class="px-3 py-1.5 text-xs font-semibold rounded-[3px] border transition-colors"
          :class="kind === option.value
            ? 'bg-[#F2D99B] text-[#674A0B] border-[#B88627]'
            : 'bg-[var(--paper-surface)] text-ink-100 border-[var(--paper-border)]'"
          @click="kind = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="px-4 py-2 text-sm text-ink-100" @click="closeCapture">Cancelar</button>
        <button
          type="submit"
          :disabled="saving || !content.trim()"
          class="px-5 py-2 bg-terra-500 text-white text-sm font-semibold rounded-[3px] disabled:opacity-50"
        >
          {{ saving ? 'Guardando…' : 'Guardar na Inbox' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import api from '../api'
import Modal from './ui/Modal.vue'
import { useToast } from '../composables/useToast'
import { hapticSuccess } from '../services/haptics'

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const content = ref('')
const kind = ref('capture')
const inputRef = ref(null)
const kinds = [
  { value: 'capture', label: 'Ideia' },
  { value: 'task', label: 'Tarefa' },
  { value: 'note', label: 'Nota' },
]

function openCapture() {
  open.value = true
  nextTick(() => inputRef.value?.focus())
}
function closeCapture() {
  open.value = false
}
async function save() {
  if (!content.value.trim() || saving.value) return
  saving.value = true
  try {
    await api.post('/workspace/inbox', { content: content.value, kind: kind.value })
    content.value = ''
    kind.value = 'capture'
    closeCapture()
    window.dispatchEvent(new CustomEvent('inbox:changed'))
    hapticSuccess()
    toast.success('Guardado na caixa de entrada')
  } catch {
    toast.error('Não foi possível guardar agora')
  } finally {
    saving.value = false
  }
}
function onShortcut(event) {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === 'Space') {
    event.preventDefault()
    openCapture()
  }
}
onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<style scoped>
.quick-capture-fab {
  right: 1rem;
  bottom: 1rem;
  color: #fffaf0;
  background: #b8593d;
  border: 1px solid rgba(122, 57, 39, .35);
  border-radius: 3px;
  box-shadow: 0 10px 24px rgba(74, 57, 29, .2);
}
@media (max-width: 767px) {
  .quick-capture-fab {
    left: 1rem;
    right: auto;
    bottom: calc(var(--safe-bottom) + 5.2rem);
    width: 3.25rem;
    height: 3.25rem;
    padding: 0;
    justify-content: center;
  }
}
</style>
