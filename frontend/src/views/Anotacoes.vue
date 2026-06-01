<template>
  <div>
    <div class="flex items-center justify-between mb-6 md-sticky-title">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-white tracking-tight">Anotações</h1>
        <p class="text-xs text-gray-500 mt-0.5">
          {{ notes.length }} {{ notes.length === 1 ? 'anotação' : 'anotações' }}
        </p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nova anotação
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && notes.length === 0" class="text-center py-20">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-light mb-4">
        <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <p class="text-sm text-gray-400">Nenhuma anotação ainda</p>
      <p class="text-xs text-gray-600 mt-1">Clique em <span class="text-blue-400">Nova anotação</span> pra começar</p>
    </div>

    <!-- Grid de anotações -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="note in notes"
        :key="note.id"
        @click="openEdit(note)"
        class="glass rounded-xl glow-hover p-4 cursor-pointer transition-all hover:bg-white/[0.02] flex flex-col gap-2 min-h-[120px]"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-semibold text-white truncate flex-1">
            {{ note.title || 'Sem título' }}
          </h3>
          <button
            @click.stop="confirmDelete(note)"
            class="text-gray-500 hover:text-red-400 transition-colors p-1 -m-1 shrink-0"
            title="Excluir"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p
          v-if="note.content"
          class="text-xs text-gray-400 line-clamp-4 whitespace-pre-wrap break-words flex-1"
        >{{ note.content }}</p>
        <p v-else class="text-xs text-gray-600 italic">Sem conteúdo</p>
        <p class="text-[10px] text-gray-600 mt-auto">
          {{ formatDate(note.updated_at) }}
        </p>
      </div>
    </div>

    <!-- Modal de edição -->
    <Modal :show="!!editing" :title="editing?.id ? 'Editar anotação' : 'Nova anotação'" size="lg" @close="closeModal">
      <form @submit.prevent="save" class="-m-4">
        <div class="p-5 md:p-6 space-y-4">
          <input
            v-model="form.title"
            ref="titleRef"
            type="text"
            placeholder="Título da anotação"
            class="w-full bg-transparent border-0 outline-none text-xl md:text-2xl font-bold text-white placeholder-gray-600 focus:bg-white/[0.03] rounded-lg px-2 -mx-2 py-1 transition-colors"
          />
          <textarea
            v-model="form.content"
            ref="contentRef"
            rows="8"
            placeholder="Escreva aqui…"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-900/60 transition-colors resize-none overflow-hidden leading-relaxed min-h-[200px]"
            @input="autoResize"
          ></textarea>
        </div>
        <div class="flex items-center gap-3 px-5 py-3 md:px-6 border-t border-white/5 bg-slate-950/60">
          <span v-if="saving" class="text-xs text-blue-400 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Salvando…
          </span>
          <div class="flex-1"></div>
          <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors">Fechar</button>
          <button type="submit" class="px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium">
            {{ editing?.id ? 'Salvar' : 'Criar' }}
          </button>
        </div>
      </form>
    </Modal>

    <ConfirmDialog
      :show="!!noteToDelete"
      title="Excluir anotação?"
      :message="noteToDelete ? `“${noteToDelete.title || 'Sem título'}” será removida.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDelete"
      @cancel="noteToDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import api from '../api'
import Modal from '../components/ui/Modal.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { useToast } from '../composables/useToast'
import { hapticLight, hapticSuccess } from '../services/haptics'

const toast = useToast()

const notes = ref([])
const loading = ref(false)
const editing = ref(null)
const noteToDelete = ref(null)
const saving = ref(false)
const titleRef = ref(null)
const contentRef = ref(null)

const form = reactive({ title: '', content: '' })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/notes')
    notes.value = data
  } catch {
    toast.error('Falha ao carregar anotações')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = {}
  form.title = ''
  form.content = ''
  nextTick(() => {
    titleRef.value?.focus()
    autoResize()
  })
}

function openEdit(note) {
  editing.value = { ...note }
  form.title = note.title || ''
  form.content = note.content || ''
  nextTick(() => autoResize())
}

function closeModal() {
  editing.value = null
}

function autoResize() {
  const ta = contentRef.value
  if (!ta) return
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}

async function save() {
  saving.value = true
  try {
    if (editing.value?.id) {
      const { data } = await api.put(`/notes/${editing.value.id}`, { title: form.title, content: form.content })
      const idx = notes.value.findIndex((n) => n.id === data.id)
      if (idx !== -1) notes.value[idx] = data
      else notes.value.unshift(data)
      // re-sort por updated_at desc
      notes.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      toast.success('Anotação salva')
    } else {
      const { data } = await api.post('/notes', { title: form.title, content: form.content })
      notes.value.unshift(data)
      toast.success('Anotação criada')
    }
    hapticSuccess()
    closeModal()
  } catch {
    toast.error('Falha ao salvar')
  } finally {
    saving.value = false
  }
}

function confirmDelete(note) {
  noteToDelete.value = note
}

async function doDelete() {
  if (!noteToDelete.value) return
  const id = noteToDelete.value.id
  noteToDelete.value = null
  try {
    await api.delete(`/notes/${id}`)
    notes.value = notes.value.filter((n) => n.id !== id)
    hapticLight()
    toast.success('Anotação excluída')
  } catch {
    toast.error('Falha ao excluir')
  }
}

function formatDate(s) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

onMounted(load)
</script>
