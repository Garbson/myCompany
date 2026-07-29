<template>
  <div class="flex gap-3 h-full -mx-4 md:-mx-6 -mt-3 md:mt-0 overflow-hidden" style="height: calc(100dvh - var(--header-offset, 0px))">

    <!-- ── PAINEL ESQUERDO: pastas + notas ── -->
    <div
      class="flex flex-col shrink-0 overflow-hidden transition-all duration-200"
      :class="activeNote && isMobile ? 'hidden' : 'w-full md:w-64 lg:w-72'"
    >
      <!-- Cabeçalho -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--paper-border)] shrink-0">
        <h1 class="text-base font-semibold text-ink-400">Anotações</h1>
        <div class="flex items-center gap-1">
          <button
            @click="startCreateFolder"
            class="p-1.5 rounded-lg text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
            title="Nova pasta"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </button>
          <button
            @click="createNote(null)"
            class="p-1.5 rounded-lg text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
            title="Nova anotação"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Lista scrollável -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-slim">

        <!-- Anotações sem pasta -->
        <div
          class="mb-1"
          @dragover.prevent="dragOverFolder = 'root'"
          @dragleave="dragOverFolder = null"
          @drop.prevent="dropOnFolder(null)"
        >
          <button
            @click="selectedFolder = null"
            class="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-lg mx-1"
            :class="[
              selectedFolder === null ? 'text-terra-600 bg-terra-500/10' : 'text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)]',
              dragOverFolder === 'root' ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''
            ]"
            style="width: calc(100% - 8px)"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            Todas as anotações
            <span class="ml-auto text-ink-50">{{ notes.length }}</span>
          </button>

          <template v-if="selectedFolder === null">
            <NoteItem
              v-for="note in notesWithoutFolder"
              :key="note.id"
              :note="note"
              :active="activeNote?.id === note.id"
              @click="openNote(note)"
              @delete="confirmDelete(note)"
            />
            <button
              v-if="selectedFolder === null"
              @click="createNote(null)"
              class="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-ink-50 hover:text-ink-100 transition-colors"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Nova anotação
            </button>
          </template>
        </div>

        <!-- Pastas -->
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="mb-1"
          @dragover.prevent="dragOverFolder = folder.id"
          @dragleave="dragOverFolder = null"
          @drop.prevent="dropOnFolder(folder.id)"
        >
          <!-- Cabeçalho da pasta -->
          <div
            class="flex items-center gap-1 mx-1 group transition-colors rounded-lg"
            :class="dragOverFolder === folder.id ? 'ring-1 ring-blue-500/50 bg-blue-500/5' : ''"
          >
            <button
              @click="toggleFolder(folder.id)"
              class="flex-1 flex items-center gap-2 px-2 py-1.5 text-xs font-medium transition-colors rounded-lg"
              :class="selectedFolder === folder.id ? 'text-terra-600 bg-terra-500/10' : 'text-ink-100 hover:text-ink-300 hover:bg-[var(--paper-surface-2)]'"
              @click.right.prevent="startRenameFolder(folder)"
            >
              <svg
                class="w-3 h-3 shrink-0 transition-transform"
                :class="openFolders.has(folder.id) ? 'rotate-90' : ''"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
              <span v-if="renamingFolder?.id !== folder.id" class="truncate flex-1 text-left">{{ folder.name }}</span>
              <input
                v-else
                ref="renameFolderRef"
                v-model="renamingFolder.name"
                class="flex-1 bg-transparent outline-none text-ink-400 text-xs min-w-0"
                @blur="submitRenameFolder"
                @keydown.enter.prevent="submitRenameFolder"
                @keydown.escape.prevent="renamingFolder = null"
                @click.stop
              />
              <span class="ml-auto text-ink-50 shrink-0">{{ notesByFolder(folder.id).length }}</span>
            </button>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                @click.stop="createNote(folder.id)"
                class="p-1 rounded text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
                title="Nova anotação nesta pasta"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
              <button
                @click.stop="startRenameFolder(folder)"
                class="p-1 rounded text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
                title="Renomear"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              <button
                @click.stop="confirmDeleteFolder(folder)"
                class="p-1 rounded text-ink-50 hover:text-terra-600 hover:bg-[var(--paper-surface-2)] transition-colors"
                title="Excluir pasta"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Notas dentro da pasta -->
          <div v-if="openFolders.has(folder.id)" class="pl-2">
            <NoteItem
              v-for="note in notesByFolder(folder.id)"
              :key="note.id"
              :note="note"
              :active="activeNote?.id === note.id"
              @click="openNote(note)"
              @delete="confirmDelete(note)"
            />
            <button
              @click="createNote(folder.id)"
              class="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-ink-50 hover:text-ink-100 transition-colors"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Nova anotação
            </button>
          </div>
        </div>

        <!-- Criar pasta inline -->
        <div v-if="creatingFolder" class="mx-1 px-2 py-1.5">
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--paper-surface-2)]">
            <svg class="w-3.5 h-3.5 text-ink-100 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <input
              ref="newFolderRef"
              v-model="newFolderName"
              placeholder="Nome da pasta"
              class="flex-1 bg-transparent outline-none text-xs text-ink-400 placeholder-gray-600 min-w-0"
              @keydown.enter.prevent="submitCreateFolder"
              @keydown.escape.prevent="creatingFolder = false"
              @blur="submitCreateFolder"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="notes.length === 0 && folders.length === 0 && !loading" class="px-4 py-8 text-center">
          <p class="text-xs text-ink-50">Nenhuma anotação ainda</p>
        </div>
      </div>
    </div>

    <!-- Divisor -->
    <div class="hidden md:block w-px bg-[var(--paper-surface-2)] shrink-0 self-stretch"></div>

    <!-- ── PAINEL DIREITO: editor ── -->
    <div
      class="flex-1 min-w-0 flex flex-col overflow-hidden"
      :class="!activeNote && isMobile ? 'hidden' : ''"
    >
      <template v-if="activeNote">
        <!-- Toolbar do editor -->
        <div class="flex items-center gap-2 px-4 py-2 border-b border-[var(--paper-border)] shrink-0">
          <!-- Voltar (mobile) -->
          <button
            v-if="isMobile"
            @click="activeNote = null"
            class="p-1.5 rounded-lg text-ink-50 hover:text-ink-400 hover:bg-[var(--paper-surface-2)] transition-colors mr-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div class="flex-1 min-w-0">
            <span v-if="savingNote" class="text-[10px] text-terra-600 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Salvando…
            </span>
            <span v-else class="text-[10px] text-ink-50">{{ formatDate(activeNote.updated_at) }}</span>
          </div>

          <!-- Mover para pasta -->
          <div class="relative">
            <button
              @click="showMoveMenu = !showMoveMenu"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
              title="Mover para pasta"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
              </svg>
              {{ activeNote.folder_id ? folders.find(f => f.id === activeNote.folder_id)?.name : 'Sem pasta' }}
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <Teleport to="body">
              <Transition enter-active-class="transition duration-100 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-75 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                <div v-if="showMoveMenu" class="fixed glass-strong rounded-xl overflow-hidden z-[200] py-1 w-44 shadow-xl" :style="moveMenuStyle">
                  <button @click="moveNote(null)" class="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors" :class="!activeNote.folder_id ? 'text-terra-600' : 'text-ink-200 hover:bg-[var(--paper-surface-2)] hover:text-ink-400'">
                    Sem pasta
                  </button>
                  <div class="h-px bg-[var(--paper-surface-2)] my-1"></div>
                  <button v-for="f in folders" :key="f.id" @click="moveNote(f.id)" class="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors" :class="activeNote.folder_id === f.id ? 'text-terra-600' : 'text-ink-200 hover:bg-[var(--paper-surface-2)] hover:text-ink-400'">
                    <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                    {{ f.name }}
                  </button>
                </div>
              </Transition>
              <div v-if="showMoveMenu" class="fixed inset-0 z-[199]" @click="showMoveMenu = false"/>
            </Teleport>
          </div>

          <button @click="confirmDelete(activeNote)" class="p-1.5 rounded-lg text-ink-50 hover:text-terra-600 hover:bg-[var(--paper-surface-2)] transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <!-- Área de escrita -->
        <div class="flex-1 overflow-y-auto scrollbar-slim px-6 py-6 md:py-8">
          <input
            v-model="editTitle"
            placeholder="Título"
            class="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-bold text-ink-400 placeholder-gray-700 mb-4 block"
            @input="debounceSave"
          />
          <RichEditor v-model="editContent" @update:modelValue="debounceSave" />
          <BacklinksPanel target-type="note" :target-id="activeNote.id" />
        </div>
      </template>

      <!-- Empty state quando nenhuma nota selecionada -->
      <div v-else class="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <div class="w-16 h-16 rounded-2xl glass-light flex items-center justify-center">
          <svg class="w-8 h-8 text-ink-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </div>
        <p class="text-sm text-ink-50">Selecione uma anotação ou crie uma nova</p>
        <button @click="createNote(null)" class="px-4 py-2 bg-terra-500 text-ink-400 text-sm rounded-lg hover:bg-blue-500 transition-colors">
          Nova anotação
        </button>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :show="!!noteToDelete"
    title="Excluir anotação?"
    :message="noteToDelete ? `&quot;${noteToDelete.title || 'Sem título'}&quot; será removida permanentemente.` : ''"
    confirm-label="Excluir"
    danger
    @confirm="doDeleteNote"
    @cancel="noteToDelete = null"
  />

  <ConfirmDialog
    :show="!!folderToDelete"
    title="Excluir pasta?"
    :message="folderToDelete ? `A pasta &quot;${folderToDelete.name}&quot; será removida. As anotações dentro dela ficam sem pasta.` : ''"
    confirm-label="Excluir"
    danger
    @confirm="doDeleteFolder"
    @cancel="folderToDelete = null"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defineComponent, h } from 'vue'
import api from '../api'
import RichEditor from '../components/ui/RichEditor.vue'
import BacklinksPanel from '../components/BacklinksPanel.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { useToast } from '../composables/useToast'
import { hapticLight, hapticSuccess } from '../services/haptics'

const route = useRoute()
const router = useRouter()

// ── NoteItem inline ──
const NoteItem = defineComponent({
  props: { note: Object, active: Boolean },
  emits: ['click', 'delete'],
  setup(props, { emit }) {
    return () => h('div', {
      class: `group relative flex items-start gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${props.active ? 'bg-[var(--paper-surface-3)] text-ink-400' : 'hover:bg-[var(--paper-surface-2)] text-ink-100 hover:text-ink-300'}`,
      draggable: true,
      onDragstart: (e) => {
        e.dataTransfer.setData('note-id', String(props.note.id))
        e.dataTransfer.effectAllowed = 'move'
      },
      onClick: () => emit('click'),
    }, [
      h('div', { class: 'flex-1 min-w-0' }, [
        h('p', { class: 'text-xs font-medium truncate' + (props.active ? ' text-ink-400' : '') }, props.note.title || 'Sem título'),
        h('p', { class: 'text-[10px] text-ink-50 mt-0.5 truncate' }, previewContent(props.note.content)),
      ]),
      h('button', {
        class: 'shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-ink-50 hover:text-terra-600 transition-colors',
        onClick: (e) => { e.stopPropagation(); emit('delete') },
      }, [
        h('svg', { class: 'w-3 h-3', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' })
        ])
      ])
    ])
  }
})

function previewContent(content) {
  if (!content) return ''
  try {
    const doc = JSON.parse(content)
    return extractText(doc).slice(0, 80)
  } catch {
    return content.slice(0, 80)
  }
}

function extractText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  if (node.content) return node.content.map(extractText).join(' ')
  return ''
}

const toast = useToast()

const notes = ref([])
const folders = ref([])
const loading = ref(false)
const activeNote = ref(null)
const openFolders = ref(new Set())
const selectedFolder = ref(null)
const savingNote = ref(false)
const noteToDelete = ref(null)
const folderToDelete = ref(null)
const creatingFolder = ref(false)
const newFolderName = ref('')
const newFolderRef = ref(null)
const renamingFolder = ref(null)
const renameFolderRef = ref(null)
const showMoveMenu = ref(false)
const dragOverFolder = ref(null)
const moveMenuStyle = ref({})
const editTitle = ref('')
const editContent = ref('')

let saveTimer = null

const isMobile = computed(() => window.innerWidth < 768)

const notesWithoutFolder = computed(() =>
  notes.value.filter(n => !n.folder_id).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
)

function notesByFolder(folderId) {
  return notes.value.filter(n => n.folder_id === folderId).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
}

async function load() {
  loading.value = true
  try {
    const [{ data: n }, { data: f }] = await Promise.all([api.get('/notes'), api.get('/note-folders')])
    notes.value = n
    folders.value = f
  } catch {
    toast.error('Falha ao carregar anotações')
  } finally {
    loading.value = false
  }
}

function openNote(note) {
  activeNote.value = note
  editTitle.value = note.title || ''
  editContent.value = note.content || ''
}

function toggleFolder(id) {
  selectedFolder.value = id
  if (openFolders.value.has(id)) {
    openFolders.value.delete(id)
    openFolders.value = new Set(openFolders.value)
  } else {
    openFolders.value.add(id)
    openFolders.value = new Set(openFolders.value)
  }
}

async function createNote(folderId) {
  try {
    const { data } = await api.post('/notes', { title: '', content: '', folder_id: folderId })
    notes.value.unshift(data)
    if (folderId) {
      openFolders.value.add(folderId)
      openFolders.value = new Set(openFolders.value)
    }
    openNote(data)
    nextTick(() => {
      document.querySelector('.prose-editor .ProseMirror')?.focus()
    })
  } catch {
    toast.error('Falha ao criar anotação')
  }
}

function debounceSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNote, 800)
}

async function saveNote() {
  if (!activeNote.value?.id) return
  savingNote.value = true
  try {
    const { data } = await api.put(`/notes/${activeNote.value.id}`, {
      title: editTitle.value,
      content: editContent.value,
    })
    const idx = notes.value.findIndex(n => n.id === data.id)
    if (idx !== -1) notes.value[idx] = data
    activeNote.value = { ...data }
    notes.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  } catch {
    toast.error('Falha ao salvar')
  } finally {
    savingNote.value = false
  }
}

async function moveNote(folderId) {
  if (!activeNote.value?.id) return
  showMoveMenu.value = false
  try {
    const { data } = await api.put(`/notes/${activeNote.value.id}`, { folder_id: folderId })
    const idx = notes.value.findIndex(n => n.id === data.id)
    if (idx !== -1) notes.value[idx] = data
    activeNote.value = { ...data }
  } catch {
    toast.error('Falha ao mover')
  }
}

async function dropOnFolder(folderId) {
  dragOverFolder.value = null
  const noteId = event.dataTransfer?.getData('note-id')
  if (!noteId) return
  const id = Number(noteId)
  const note = notes.value.find(n => n.id === id)
  if (!note || note.folder_id === folderId) return
  try {
    const { data } = await api.put(`/notes/${id}`, { folder_id: folderId })
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value[idx] = data
    if (activeNote.value?.id === id) activeNote.value = { ...data }
    if (folderId) {
      openFolders.value.add(folderId)
      openFolders.value = new Set(openFolders.value)
    }
    toast.success('Anotação movida')
  } catch {
    toast.error('Falha ao mover')
  }
}

function confirmDelete(note) {
  noteToDelete.value = note
}

async function doDeleteNote() {
  if (!noteToDelete.value) return
  const id = noteToDelete.value.id
  noteToDelete.value = null
  try {
    await api.delete(`/notes/${id}`)
    notes.value = notes.value.filter(n => n.id !== id)
    if (activeNote.value?.id === id) activeNote.value = null
    hapticLight()
    toast.success('Anotação excluída')
  } catch {
    toast.error('Falha ao excluir')
  }
}

// ── Pastas ──
function startCreateFolder() {
  creatingFolder.value = true
  newFolderName.value = ''
  nextTick(() => newFolderRef.value?.focus())
}

let creatingFolderLock = false
async function submitCreateFolder() {
  if (creatingFolderLock) return
  const name = newFolderName.value.trim()
  creatingFolder.value = false
  if (!name) return
  creatingFolderLock = true
  try {
    const { data } = await api.post('/note-folders', { name })
    folders.value.push(data)
    openFolders.value.add(data.id)
    openFolders.value = new Set(openFolders.value)
    selectedFolder.value = data.id
  } catch {
    toast.error('Falha ao criar pasta')
  } finally {
    creatingFolderLock = false
  }
}

function startRenameFolder(folder) {
  renamingFolder.value = { ...folder }
  nextTick(() => renameFolderRef.value?.[0]?.focus())
}

async function submitRenameFolder() {
  const f = renamingFolder.value
  renamingFolder.value = null
  if (!f?.name?.trim()) return
  try {
    const { data } = await api.put(`/note-folders/${f.id}`, { name: f.name.trim() })
    const idx = folders.value.findIndex(x => x.id === data.id)
    if (idx !== -1) folders.value[idx] = data
  } catch {
    toast.error('Falha ao renomear')
  }
}

function confirmDeleteFolder(folder) {
  folderToDelete.value = folder
}

async function doDeleteFolder() {
  if (!folderToDelete.value) return
  const id = folderToDelete.value.id
  folderToDelete.value = null
  try {
    await api.delete(`/note-folders/${id}`)
    folders.value = folders.value.filter(f => f.id !== id)
    notes.value.forEach(n => { if (n.folder_id === id) n.folder_id = null })
    if (selectedFolder.value === id) selectedFolder.value = null
  } catch {
    toast.error('Falha ao excluir pasta')
  }
}

function formatDate(s) {
  if (!s) return ''
  const d = new Date(s)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `Hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function openById(id) {
  const num = Number(id)
  if (!num) return
  if (activeNote.value?.id === num) return
  if (notes.value.length === 0) {
    try { await load() } catch {}
  }
  let note = notes.value.find((n) => n.id === num)
  if (!note) {
    try {
      const { data } = await api.get(`/notes/${num}`)
      note = data
    } catch {
      toast.error('Anotação não encontrada')
      return
    }
  }
  if (note.folder_id) {
    openFolders.value.add(note.folder_id)
    openFolders.value = new Set(openFolders.value)
    selectedFolder.value = note.folder_id
  }
  openNote(note)
  if (route.query.open) {
    router.replace({ path: '/anotacoes', query: {} })
  }
}

onMounted(async () => {
  await load()
  if (route.query.open) await openById(route.query.open)
})

watch(() => route.query.open, (v) => { if (v) openById(v) })
</script>
