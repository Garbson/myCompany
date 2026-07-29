<template>
  <div class="flex gap-3 h-full -mx-4 md:-mx-6 -mt-3 md:mt-0 overflow-hidden" style="height: calc(100dvh - var(--header-offset, 0px))">

    <!-- ── PAINEL ESQUERDO: pastas + fluxogramas ── -->
    <div
      class="flex flex-col shrink-0 overflow-hidden transition-all duration-200"
      :class="active && isMobile ? 'hidden' : 'w-full md:w-64 lg:w-72'"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--paper-border)] shrink-0">
        <h1 class="font-serif text-lg font-semibold text-ink-400 tracking-tight">Fluxogramas</h1>
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
            @click="createFlow(null)"
            class="p-1.5 rounded-lg text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-2)] transition-colors"
            title="Novo fluxograma"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-slim">
        <!-- Fluxogramas soltos (sem pasta) -->
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
              dragOverFolder === 'root' ? 'ring-1 ring-terra-500/50 bg-terra-500/5' : ''
            ]"
            style="width: calc(100% - 8px)"
          >
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h6l3 3h7v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z"/>
            </svg>
            Todos os fluxogramas
            <span class="ml-auto text-ink-50">{{ flows.length }}</span>
          </button>

          <template v-if="selectedFolder === null">
            <FlowItem
              v-for="fc in flowsWithoutFolder"
              :key="fc.id"
              :flow="fc"
              :active="active?.id === fc.id"
              @click="openFlow(fc)"
              @delete="confirmDelete(fc)"
            />
          </template>
        </div>

        <!-- Pastas -->
        <div v-for="folder in folders" :key="folder.id" class="mb-1">
          <div
            class="group flex items-center gap-1 px-2 mx-1 rounded-lg transition-colors"
            :class="[
              selectedFolder === folder.id ? 'bg-[var(--paper-surface-3)]' : 'hover:bg-[var(--paper-surface-2)]',
              dragOverFolder === folder.id ? 'ring-1 ring-terra-500/50 bg-terra-500/5' : ''
            ]"
            @dragover.prevent="dragOverFolder = folder.id"
            @dragleave="dragOverFolder = null"
            @drop.prevent="dropOnFolder(folder.id)"
          >
            <button
              @click="toggleFolder(folder.id)"
              class="shrink-0 p-1 text-ink-50 hover:text-ink-200 transition-colors"
            >
              <svg class="w-3 h-3 transition-transform" :class="{ 'rotate-90': isOpenFolder(folder.id) }" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            <input
              v-if="renamingFolder === folder.id"
              ref="renameFolderInput"
              v-model="renameFolderDraft"
              type="text"
              class="flex-1 bg-transparent text-xs font-medium text-ink-300 outline-none py-1.5"
              @blur="commitRenameFolder(folder)"
              @keydown.enter.prevent="commitRenameFolder(folder)"
              @keydown.esc.prevent="cancelRenameFolder"
            />
            <button
              v-else
              @click="selectFolder(folder.id)"
              @dblclick="startRenameFolder(folder)"
              class="flex-1 text-left text-xs font-medium py-1.5 truncate transition-colors"
              :class="selectedFolder === folder.id ? 'text-ink-400' : 'text-ink-100 hover:text-ink-300'"
            >
              {{ folder.name }}
            </button>
            <span class="text-[10px] text-ink-50 mr-1">{{ flowsInFolder(folder.id).length }}</span>
            <button
              @click.stop="createFlow(folder.id)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-50 hover:text-ink-200 hover:bg-[var(--paper-surface-3)] transition-all"
              title="Novo fluxograma nesta pasta"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
            <button
              @click.stop="confirmDeleteFolder(folder)"
              class="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-50 hover:text-terra-500 hover:bg-terra-500/10 transition-all"
              title="Excluir pasta"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div v-if="isOpenFolder(folder.id)" class="ml-4 mt-0.5">
            <FlowItem
              v-for="fc in flowsInFolder(folder.id)"
              :key="fc.id"
              :flow="fc"
              :active="active?.id === fc.id"
              @click="openFlow(fc)"
              @delete="confirmDelete(fc)"
            />
            <p v-if="flowsInFolder(folder.id).length === 0" class="text-[11px] text-ink-50 italic px-3 py-1">
              Nenhum fluxograma
            </p>
          </div>
        </div>

        <!-- Criando pasta -->
        <div v-if="creatingFolder" class="mx-1 mt-1">
          <input
            ref="newFolderInput"
            v-model="newFolderName"
            type="text"
            placeholder="Nome da pasta"
            class="w-full px-3 py-1.5 text-xs bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-300 placeholder-ink-50 outline-none focus:border-terra-500"
            @blur="submitCreateFolder"
            @keydown.enter.prevent="submitCreateFolder"
            @keydown.esc.prevent="cancelCreateFolder"
          />
        </div>

        <p v-if="!loading && flows.length === 0 && folders.length === 0" class="text-center text-ink-50 text-xs py-6">
          Nenhum fluxograma ainda
        </p>
      </div>
    </div>

    <div class="hidden md:block w-px bg-[var(--paper-border)]"></div>

    <!-- ── PAINEL DIREITO: canvas + título ── -->
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden" :class="{ 'hidden md:flex': !active }">
      <template v-if="active">
        <div
          ref="focusRootRef"
          class="flex-1 min-h-0 flex flex-col overflow-hidden"
          :class="fullscreen ? 'fullscreen-flow bg-[var(--paper-bg)]' : ''"
        >
          <!-- Header do fluxograma -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-[var(--paper-border)] shrink-0">
            <button
              @click="active = null"
              v-if="!fullscreen"
              class="md:hidden p-1 text-ink-100 hover:text-ink-400"
              aria-label="Voltar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <input
              v-model="active.title"
              type="text"
              placeholder="Sem título"
              class="flex-1 min-w-0 font-serif text-xl md:text-2xl font-semibold text-ink-400 tracking-tight bg-transparent outline-none placeholder-ink-50"
              @input="scheduleSave(); onTitleInput()"
            />
            <span v-if="saving" class="text-xs text-indigo_ink-500 flex items-center gap-1.5 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo_ink-500 animate-pulse"></span>
              Salvando…
            </span>
            <span v-else-if="dirty" class="text-xs text-[#C89A3F] flex items-center gap-1.5 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-[#C89A3F]"></span>
              Não salvo
            </span>
            <span v-else class="text-xs text-ink-50 hidden sm:flex items-center gap-1.5 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-olive-500"></span>
              Salvo
            </span>
            <button
              @click="toggleFullscreen"
              class="shrink-0 p-1.5 rounded-lg text-ink-100 hover:text-ink-400 hover:bg-[var(--paper-surface-3)] transition-colors"
              :title="fullscreen ? 'Sair da tela cheia (Esc)' : 'Tela cheia'"
            >
              <svg v-if="!fullscreen" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 4v4H5m10 0V4h4m0 12h-4v4M9 20v-4H5"/>
              </svg>
            </button>
          </div>

          <!-- Canvas -->
          <div class="flex-1 min-h-0 relative">
            <FlowCanvas
              :key="active.id"
              v-model="flowData"
              @change="onCanvasChange"
            />
            <!-- Backlinks flutuantes -->
            <div v-if="!fullscreen" class="absolute top-3 left-3 max-w-xs paper-strong rounded-xl px-3 py-2 pointer-events-auto" v-show="backlinksVisible">
              <BacklinksPanelInline target-type="flowchart" :target-id="active.id" @count="onBacklinksCount" />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="hidden md:flex flex-1 items-center justify-center">
          <div class="text-center max-w-sm">
            <div class="w-16 h-16 rounded-2xl paper-light flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-ink-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z"/>
              </svg>
            </div>
            <p class="text-sm text-ink-200 mb-4">Selecione um fluxograma ou crie um novo</p>
            <button @click="createFlow(null)" class="btn-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              Novo fluxograma
            </button>
          </div>
        </div>
      </template>
    </div>

    <ConfirmDialog
      :show="!!deleting"
      title="Excluir fluxograma?"
      :message="deleting ? `“${deleting.title || 'Sem título'}” será perdido.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDelete"
      @cancel="deleting = null"
    />
    <ConfirmDialog
      :show="!!deletingFolder"
      title="Excluir pasta?"
      :message="deletingFolder ? `A pasta “${deletingFolder.name}” será removida. Os fluxogramas dentro dela ficarão em “Todos”.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDeleteFolder"
      @cancel="deletingFolder = null"
    />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import { useToast } from '../composables/useToast'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import FlowCanvas from '../components/flow/FlowCanvas.vue'
import BacklinksPanelInline from '../components/BacklinksPanelInline.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const folders = ref([])
const flows = ref([])
const active = ref(null)
const flowData = ref({ nodes: [], edges: [] })
const loading = ref(true)
const saving = ref(false)
const dirty = ref(false)
let saveTimer = null
let suppressDirty = false

const selectedFolder = ref(null)
const openFolders = ref(new Set())
const dragOverFolder = ref(null)

const creatingFolder = ref(false)
const newFolderName = ref('')
const newFolderInput = ref(null)
let creatingFolderLock = false

const renamingFolder = ref(null)
const renameFolderDraft = ref('')
const renameFolderInput = ref(null)

const deleting = ref(null)
const deletingFolder = ref(null)

const backlinksVisible = ref(false)
function onBacklinksCount(n) { backlinksVisible.value = n > 0 }

// === Fullscreen (foco no fluxo) ===
const focusRootRef = ref(null)
const fullscreen = ref(false)

function isBrowserFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement)
}

async function toggleFullscreen() {
  const el = focusRootRef.value
  if (!el) return
  if (!isBrowserFullscreen()) {
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    } catch {}
  } else {
    try {
      if (document.exitFullscreen) await document.exitFullscreen()
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
    } catch {}
  }
}

function onFullscreenChange() {
  fullscreen.value = isBrowserFullscreen()
}

const isMobile = computed(() =>
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches
)

const flowsWithoutFolder = computed(() =>
  flows.value.filter((f) => f.folder_id == null)
)
function flowsInFolder(id) {
  return flows.value.filter((f) => f.folder_id === id)
}
function isOpenFolder(id) { return openFolders.value.has(id) }
function toggleFolder(id) {
  openFolders.value.has(id) ? openFolders.value.delete(id) : openFolders.value.add(id)
  openFolders.value = new Set(openFolders.value)
}
function selectFolder(id) {
  selectedFolder.value = id
  openFolders.value.add(id)
  openFolders.value = new Set(openFolders.value)
}

// === Carregamento ===
async function loadAll() {
  loading.value = true
  try {
    const [{ data: fs }, { data: fcs }] = await Promise.all([
      api.get('/flowchart-folders'),
      api.get('/flowcharts'),
    ])
    folders.value = fs
    flows.value = fcs
  } catch {
    toast.error('Falha ao carregar fluxogramas')
  } finally {
    loading.value = false
  }
}

async function openFlow(fc) {
  if (dirty.value && active.value) {
    try { await saveNow() } catch {}
  }
  try {
    const { data } = await api.get(`/flowcharts/${fc.id}`)
    active.value = { ...data }
    suppressDirty = true
    flowData.value = data.data || { nodes: [], edges: [] }
    dirty.value = false
    setTimeout(() => { suppressDirty = false }, 100)
  } catch {
    toast.error('Falha ao abrir fluxograma')
  }
}

// === Criar / renomear / apagar fluxograma ===
async function createFlow(folderId) {
  try {
    const { data } = await api.post('/flowcharts', { folder_id: folderId })
    flows.value.push({
      id: data.id,
      title: data.title,
      folder_id: data.folder_id,
      position: data.position,
      updated_at: data.updated_at,
    })
    if (folderId) {
      openFolders.value.add(folderId)
      openFolders.value = new Set(openFolders.value)
    }
    active.value = data
    suppressDirty = true
    flowData.value = data.data
    dirty.value = false
    setTimeout(() => { suppressDirty = false }, 100)
  } catch {
    toast.error('Falha ao criar fluxograma')
  }
}

function scheduleSave() {
  dirty.value = true
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNow, 1500)
}

function onCanvasChange(payload) {
  if (suppressDirty) return
  flowData.value = payload
  scheduleSave()
}
function onTitleInput() {
  const list = flows.value.find((f) => f.id === active.value.id)
  if (list) list.title = active.value.title
}

async function saveNow() {
  if (!active.value) return
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  saving.value = true
  try {
    await api.put(`/flowcharts/${active.value.id}`, {
      title: active.value.title,
      data: flowData.value,
    })
    dirty.value = false
  } catch {
    toast.error('Falha ao salvar')
  } finally {
    saving.value = false
  }
}

function confirmDelete(fc) { deleting.value = fc }
async function doDelete() {
  const fc = deleting.value
  if (!fc) return
  deleting.value = null
  try {
    await api.delete(`/flowcharts/${fc.id}`)
    flows.value = flows.value.filter((f) => f.id !== fc.id)
    if (active.value?.id === fc.id) {
      active.value = null
      flowData.value = { nodes: [], edges: [] }
    }
  } catch {
    toast.error('Falha ao excluir')
  }
}

// === Pastas ===
async function startCreateFolder() {
  creatingFolder.value = true
  newFolderName.value = ''
  await nextTick()
  const el = Array.isArray(newFolderInput.value) ? newFolderInput.value[0] : newFolderInput.value
  el?.focus?.()
}

async function submitCreateFolder() {
  if (creatingFolderLock) return
  const name = newFolderName.value.trim()
  if (!name) { cancelCreateFolder(); return }
  creatingFolderLock = true
  try {
    const { data } = await api.post('/flowchart-folders', { name })
    folders.value.push(data)
    openFolders.value.add(data.id)
    openFolders.value = new Set(openFolders.value)
  } catch {
    toast.error('Falha ao criar pasta')
  } finally {
    creatingFolder.value = false
    newFolderName.value = ''
    creatingFolderLock = false
  }
}
function cancelCreateFolder() {
  creatingFolder.value = false
  newFolderName.value = ''
}

async function startRenameFolder(folder) {
  renamingFolder.value = folder.id
  renameFolderDraft.value = folder.name
  await nextTick()
  const el = Array.isArray(renameFolderInput.value) ? renameFolderInput.value[0] : renameFolderInput.value
  el?.focus?.()
  el?.select?.()
}
async function commitRenameFolder(folder) {
  if (renamingFolder.value !== folder.id) return
  const name = renameFolderDraft.value.trim()
  renamingFolder.value = null
  if (!name || name === folder.name) return
  try {
    await api.put(`/flowchart-folders/${folder.id}`, { name })
    folder.name = name
  } catch {
    toast.error('Falha ao renomear pasta')
  }
}
function cancelRenameFolder() { renamingFolder.value = null }

function confirmDeleteFolder(folder) { deletingFolder.value = folder }
async function doDeleteFolder() {
  const folder = deletingFolder.value
  if (!folder) return
  deletingFolder.value = null
  try {
    await api.delete(`/flowchart-folders/${folder.id}`)
    folders.value = folders.value.filter((f) => f.id !== folder.id)
    // Backend faz SET NULL nos fluxogramas da pasta
    flows.value = flows.value.map((f) => f.folder_id === folder.id ? { ...f, folder_id: null } : f)
    if (selectedFolder.value === folder.id) selectedFolder.value = null
  } catch {
    toast.error('Falha ao excluir pasta')
  }
}

// === Drag & drop de fluxograma pra pasta ===
async function dropOnFolder(folderId) {
  const flowId = Number(event?.dataTransfer?.getData('flow-id'))
  dragOverFolder.value = null
  if (!flowId) return
  const fc = flows.value.find((f) => f.id === flowId)
  if (!fc || fc.folder_id === folderId) return
  try {
    await api.put(`/flowcharts/${flowId}`, { folder_id: folderId })
    fc.folder_id = folderId
    if (folderId) {
      openFolders.value.add(folderId)
      openFolders.value = new Set(openFolders.value)
    }
  } catch {
    toast.error('Falha ao mover')
  }
}

// === Item de fluxograma (arrastável) ===
const FlowItem = defineComponent({
  props: { flow: Object, active: Boolean },
  emits: ['click', 'delete'],
  setup(props, { emit }) {
    return () => h('div', {
      draggable: true,
      onDragstart: (e) => e.dataTransfer.setData('flow-id', String(props.flow.id)),
      onClick: () => emit('click'),
      class: `group relative flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg cursor-pointer transition-colors ${props.active ? 'bg-[var(--paper-surface-3)] text-ink-400' : 'hover:bg-[var(--paper-surface-2)] text-ink-100 hover:text-ink-300'}`,
    }, [
      h('svg', { class: 'w-3.5 h-3.5 shrink-0 text-ink-50', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '1.75' }, [
        h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z' })
      ]),
      h('span', { class: 'text-xs font-medium truncate flex-1' }, props.flow.title || 'Sem título'),
      h('button', {
        onClick: (e) => { e.stopPropagation(); emit('delete') },
        class: 'opacity-0 group-hover:opacity-100 p-0.5 rounded text-ink-50 hover:text-terra-500 hover:bg-terra-500/10 transition-all',
        title: 'Excluir',
      }, [
        h('svg', { class: 'w-3 h-3', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'stroke-width': '2.5' }, [
          h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M6 18L18 6M6 6l12 12' })
        ])
      ])
    ])
  }
})

// === Deep link ?open=id ===
async function openById(id) {
  const num = Number(id)
  if (!num) return
  if (active.value?.id === num) return
  // Se ainda não carregou a lista, espera pra achar folder_id e abrir a pasta
  if (flows.value.length === 0) {
    try { await loadAll() } catch {}
  }
  const listItem = flows.value.find((f) => f.id === num)
  if (listItem?.folder_id) {
    openFolders.value.add(listItem.folder_id)
    openFolders.value = new Set(openFolders.value)
  }
  try {
    const { data } = await api.get(`/flowcharts/${num}`)
    active.value = { ...data }
    suppressDirty = true
    flowData.value = data.data || { nodes: [], edges: [] }
    dirty.value = false
    setTimeout(() => { suppressDirty = false }, 100)
    // Se veio via query, limpa pra não reabrir ao mudar de aba e voltar
    if (route.query.open) {
      router.replace({ path: '/fluxogramas', query: {} })
    }
  } catch {
    toast.error('Fluxograma não encontrado')
  }
}

// === Lifecycle ===
onMounted(async () => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('webkitfullscreenchange', onFullscreenChange)
  await loadAll()
  if (route.query.open) await openById(route.query.open)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
  if (saveTimer) clearTimeout(saveTimer)
  if (dirty.value && active.value) { saveNow().catch(() => {}) }
})

watch(() => route.query.open, (v) => { if (v) openById(v) })

// Salva antes de trocar de fluxograma / fechar
watch(() => active.value?.id, (newId, oldId) => {
  if (oldId && newId !== oldId && dirty.value) saveNow().catch(() => {})
})
</script>

<style scoped>
/* Quando fullscreen, o container preenche a tela (o browser já dá 100vw/100vh) */
.fullscreen-flow {
  width: 100vw;
  height: 100vh;
  padding: 0;
}
</style>
