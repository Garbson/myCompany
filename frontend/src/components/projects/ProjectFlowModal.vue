<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl">
        <!-- Header -->
        <header
          class="shrink-0 glass border-b border-white/5 flex items-center justify-between px-4 md:px-6 h-14"
          style="padding-top: var(--safe-top); padding-left: max(var(--safe-left), 1rem); padding-right: max(var(--safe-right), 1rem)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <button @click="$emit('close')" class="text-gray-400 hover:text-white p-1 -m-1 transition-colors shrink-0" aria-label="Fechar">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="min-w-0">
              <p class="text-xs text-gray-500 leading-none">Fluxograma BPMN</p>
              <h2 class="text-sm md:text-base font-semibold text-white truncate">{{ project?.name }}</h2>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span v-if="saving" class="text-xs text-blue-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              Salvando…
            </span>
            <span v-else-if="dirty" class="text-xs text-yellow-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
              Não salvo
            </span>
            <span v-else-if="loadedOnce" class="text-xs text-gray-500 hidden sm:flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
              Salvo
            </span>
            <button
              @click="saveNow"
              :disabled="!dirty || saving"
              class="px-3 py-1.5 text-xs font-medium bg-gradient-to-br from-indigo-500 to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all"
            >
              Salvar
            </button>
          </div>
        </header>

        <!-- Toolbar -->
        <div class="shrink-0 glass-light border-b border-white/5 px-3 md:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            v-for="t in nodeKinds"
            :key="t.kind"
            @click="addNode(t.kind)"
            class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-light rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            :title="t.hint"
          >
            <span v-html="t.icon" class="text-[14px]"></span>
            {{ t.label }}
          </button>
          <div class="w-px h-5 bg-white/10 mx-1"></div>
          <button
            @click="clearAll"
            class="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Limpar
          </button>
        </div>

        <!-- Canvas -->
        <div class="flex-1 relative min-h-0">
          <VueFlow
            v-if="show"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :default-edge-options="defaultEdgeOptions"
            :fit-view-on-init="true"
            :connect-on-click="false"
            class="flow-canvas"
            @nodes-change="onChange"
            @edges-change="onChange"
            @connect="onConnect"
          >
            <Background :gap="24" :size="1" pattern-color="rgba(255,255,255,0.05)" />
            <Controls position="bottom-right" />
            <MiniMap pannable zoomable class="hidden md:block" />
          </VueFlow>

          <div v-if="loading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="glass-strong rounded-xl px-4 py-3 text-sm text-gray-300">Carregando…</div>
          </div>
          <div v-else-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center max-w-xs">
              <p class="text-sm text-gray-400 mb-1">Sem nós ainda</p>
              <p class="text-xs text-gray-600">Use a barra acima pra adicionar eventos, tarefas, gateways…</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, markRaw, provide } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import BpmnNode from './BpmnNode.vue'
import BpmnEdge from './BpmnEdge.vue'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import { hapticLight, hapticSuccess } from '../../services/haptics'

const props = defineProps({ show: Boolean, project: Object })
const emit = defineEmits(['close'])
const toast = useToast()

const nodes = ref([])
const edges = ref([])
const loading = ref(false)
const saving = ref(false)
const dirty = ref(false)
const loadedOnce = ref(false)
let suppressDirty = false
let saveTimer = null

const nodeTypes = { bpmn: markRaw(BpmnNode) }
const edgeTypes = { 'bpmn-edge': markRaw(BpmnEdge) }

const nodeKinds = [
  { kind: 'start', label: 'Início', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>', hint: 'Evento de início' },
  { kind: 'task', label: 'Tarefa', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>', hint: 'Atividade / tarefa' },
  { kind: 'decision', label: 'Gateway X', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#eab308" stroke-width="8"><polygon points="40,4 76,40 40,76 4,40"/></svg>', hint: 'Gateway exclusivo (XOR)' },
  { kind: 'parallel', label: 'Gateway +', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#f97316" stroke-width="8"><polygon points="40,4 76,40 40,76 4,40"/></svg>', hint: 'Gateway paralelo (AND)' },
  { kind: 'event', label: 'Evento', icon: '<span style="color:#a855f7;font-size:18px;line-height:1">◎</span>', hint: 'Evento intermediário' },
  { kind: 'timer', label: 'Timer', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2"><circle cx="12" cy="13" r="9"/><polyline points="12,7 12,13 16,15"/></svg>', hint: 'Evento de timer' },
  { kind: 'message', label: 'Mensagem', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>', hint: 'Evento de mensagem' },
  { kind: 'error', label: 'Erro', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', hint: 'Evento de erro' },
  { kind: 'subprocess', label: 'Subproc.', icon: '<span style="color:#6366f1;font-size:15px;line-height:1">⊞</span>', hint: 'Subprocesso' },
  { kind: 'document', label: 'Documento', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 60 80" fill="none" stroke="#f472b6" stroke-width="6"><path stroke-linejoin="round" d="M8,3 L48,3 L56,13 L56,77 L8,77 Z M48,3 L48,13 L56,13"/></svg>', hint: 'Documento / dado' },
  { kind: 'datastore', label: 'Dados', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#14b8a6" stroke-width="5"><ellipse cx="40" cy="18" rx="34" ry="12"/><line x1="6" y1="18" x2="6" y2="62"/><line x1="74" y1="18" x2="74" y2="62"/><ellipse cx="40" cy="62" rx="34" ry="12"/></svg>', hint: 'Armazenamento de dados' },
  { kind: 'end', label: 'Fim', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>', hint: 'Evento de fim' },
  { kind: 'text', label: 'Texto', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h16"/></svg>', hint: 'Texto livre (redimensionável)' },
]

const labelByKind = {
  start: 'Início',
  task: 'Nova tarefa',
  decision: 'Decisão?',
  parallel: 'Paralelo',
  event: 'Evento',
  timer: 'Timer',
  message: 'Mensagem',
  error: 'Erro',
  subprocess: 'Subprocesso',
  document: 'Documento',
  datastore: 'Dados',
  end: 'Fim',
  text: '',
}
function handleEdgeLabelChange() {
  dirty.value = true
  scheduleAutosave()
}
provide('onFlowDirty', handleEdgeLabelChange)

// Compat: mapeia kinds antigos (step -> task)
const LEGACY_MAP = { step: 'task' }
function normalizeKind(k) {
  return LEGACY_MAP[k] || k || 'task'
}

const defaultEdgeOptions = {
  type: 'bpmn-edge',
  animated: true,
  style: { stroke: 'rgba(96, 165, 250, 0.7)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'rgba(96, 165, 250, 0.9)' },
}

let nextId = 0
function genId() {
  nextId += 1
  return `n${Date.now().toString(36)}-${nextId}`
}

function addNode(kind) {
  const id = genId()
  const offsetX = 80 + (nodes.value.length % 4) * 40
  const offsetY = 100 + (nodes.value.length % 3) * 40
  const defaultLabel = labelByKind[kind] ?? 'Nó'
  const data = { label: defaultLabel, kind }
  if (kind === 'text') {
    data.width = 240
    data.height = 80
    data.fontSize = 16
  }
  nodes.value.push({
    id,
    type: 'bpmn',
    position: { x: offsetX, y: offsetY },
    data,
  })
  dirty.value = true
  hapticLight()
  scheduleAutosave()
}

function onConnect(conn) {
  edges.value.push({
    id: `e-${conn.source}-${conn.target}-${Date.now().toString(36)}`,
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    label: '',
    type: 'bpmn-edge',
    animated: true,
    style: { stroke: 'rgba(96, 165, 250, 0.7)', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: 'rgba(96, 165, 250, 0.9)' },
  })
  dirty.value = true
  hapticLight()
  scheduleAutosave()
}

function onChange() {
  if (suppressDirty) return
  dirty.value = true
  scheduleAutosave()
}

function scheduleAutosave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveNow(), 1500)
}

async function load(projectId) {
  loading.value = true
  suppressDirty = true
  try {
    const { data } = await api.get(`/projects/${projectId}/flow`)
    const flow = data.data || { nodes: [], edges: [] }
    nodes.value = (flow.nodes || []).map((n) => ({
      ...n,
      type: 'bpmn',
      data: { ...n.data, kind: normalizeKind(n.data?.kind) },
      style: undefined, // limpa estilos legacy
    }))
    edges.value = (flow.edges || []).map((e) => ({
      ...defaultEdgeOptions,
      ...e,
      type: 'bpmn-edge',
    }))
    loadedOnce.value = true
    dirty.value = false
  } catch {
    toast.error('Falha ao carregar fluxograma')
    nodes.value = []
    edges.value = []
  } finally {
    loading.value = false
    setTimeout(() => (suppressDirty = false), 100)
  }
}

async function saveNow() {
  if (!props.project) return
  if (saveTimer) clearTimeout(saveTimer)
  saving.value = true
  const payload = {
    nodes: nodes.value.map((n) => {
      const d = n.data || {}
      const data = { label: d.label || '', kind: d.kind || 'task' }
      if (data.kind === 'text') {
        data.width = d.width || 220
        data.height = d.height || 80
        data.fontSize = d.fontSize || 16
      }
      return { id: n.id, type: 'bpmn', position: n.position, data }
    }),
    edges: edges.value.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label || '',
    })),
  }
  try {
    await api.put(`/projects/${props.project.id}/flow`, { data: payload })
    dirty.value = false
    hapticSuccess()
  } catch {
    toast.error('Falha ao salvar')
  } finally {
    saving.value = false
  }
}

function clearAll() {
  if (!nodes.value.length && !edges.value.length) return
  if (!window.confirm('Apagar todos os nós e conexões?')) return
  nodes.value = []
  edges.value = []
  dirty.value = true
  scheduleAutosave()
}

watch(
  () => props.show,
  async (v) => {
    if (v && props.project) {
      load(props.project.id)
    } else {
      // Se estava com mudanças pendentes (ex: legenda da edge), salva antes de limpar
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      if (dirty.value && props.project) {
        try {
          await saveNow()
        } catch {}
      }
      nodes.value = []
      edges.value = []
      dirty.value = false
      loadedOnce.value = false
    }
  }
)
</script>

<style>
/* Tema vue-flow combinando com glass */
.flow-canvas {
  background: transparent;
}
.flow-canvas .vue-flow__edge-path {
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.4));
}
.flow-canvas .vue-flow__edge-text {
  fill: #fff;
  font-size: 11px;
  font-weight: 500;
}
.flow-canvas .vue-flow__edge-textbg {
  fill: rgba(15, 23, 42, 0.85);
}
.flow-canvas .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: rgba(168, 85, 247, 0.95);
}
.flow-canvas .vue-flow__controls {
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}
.flow-canvas .vue-flow__controls-button {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #cbd5e1;
  fill: currentColor;
}
.flow-canvas .vue-flow__controls-button:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}
.flow-canvas .vue-flow__minimap {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}
/* Garante que o custom node fica visivel/clicavel sem container do tema default */
.flow-canvas .vue-flow__node-bpmn {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
.flow-canvas .vue-flow__node-bpmn.selected .bpmn-shape,
.flow-canvas .vue-flow__node-bpmn:focus .bpmn-shape {
  outline: 2px solid rgba(168, 85, 247, 0.7);
  outline-offset: 4px;
  border-radius: inherit;
}
</style>
