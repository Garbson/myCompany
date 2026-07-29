<template>
  <div class="flow-canvas-root h-full flex flex-col">
    <!-- Toolbar -->
    <div class="shrink-0 paper-light border-b border-[var(--paper-border)] px-3 md:px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none rounded-t-none">
      <button
        v-for="t in nodeKinds"
        :key="t.kind"
        @click="addNode(t.kind)"
        class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-200 hover:text-ink-400 hover:border-[var(--paper-border-strong)] transition-colors"
        :title="t.hint"
      >
        <span v-html="t.icon" class="text-[14px]"></span>
        {{ t.label }}
      </button>
      <div class="w-px h-5 bg-[var(--paper-border)] mx-1"></div>
      <button
        @click="clearAll"
        class="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-terra-600 hover:bg-terra-500/10 rounded-lg transition-colors"
      >
        Limpar
      </button>
    </div>

    <!-- Canvas -->
    <div class="flex-1 relative min-h-0">
      <VueFlow
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
        @node-drag="onNodeDrag"
        @node-drag-stop="onNodeDragStop"
        @viewport-change="onViewportChange"
      >
        <Background :gap="24" :size="1" pattern-color="rgba(94, 79, 45, 0.10)" />
        <Controls position="bottom-right" />
        <MiniMap pannable zoomable class="hidden md:block" />
      </VueFlow>

      <div
        v-if="helperLineV || helperLineH"
        class="flow-helper-overlay"
      >
        <div
          v-if="helperLineV"
          class="helper-line-v"
          :style="{ left: (helperLineV.x * viewport.zoom + viewport.x) + 'px' }"
        ></div>
        <div
          v-if="helperLineH"
          class="helper-line-h"
          :style="{ top: (helperLineH.y * viewport.zoom + viewport.y) + 'px' }"
        ></div>
      </div>

      <div v-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="text-center max-w-xs">
          <p class="text-sm text-ink-100 mb-1">Sem nós ainda</p>
          <p class="text-xs text-ink-50">Use a barra acima pra adicionar eventos, tarefas, gateways…</p>
        </div>
      </div>
    </div>

    <!-- Picker de anotações (pra linkar num nó) -->
    <Teleport to="body">
      <div
        v-if="notePicker.show"
        class="fixed inset-0 z-[500] flex items-start justify-center pt-24 px-4"
        @click.self="cancelNotePicker"
      >
        <div class="absolute inset-0 bg-ink-400/40 backdrop-blur-sm"></div>
        <div class="relative paper-strong rounded-2xl w-full max-w-md overflow-hidden">
          <div class="p-3 border-b border-[var(--paper-border)]">
            <input
              v-model="notePicker.query"
              type="text"
              placeholder="Buscar anotação…"
              class="w-full px-3 py-2 bg-[var(--paper-surface-2)] border border-[var(--paper-border)] rounded-lg text-sm text-ink-300 placeholder-ink-50 outline-none focus:border-terra-500"
              autofocus
            />
          </div>
          <div class="max-h-80 overflow-y-auto scrollbar-slim py-1">
            <p v-if="notePicker.loading" class="px-4 py-6 text-center text-xs text-ink-50">Carregando…</p>
            <p v-else-if="filteredNotePickerItems.length === 0" class="px-4 py-6 text-center text-xs text-ink-50">
              {{ notePicker.items.length === 0 ? 'Nenhuma anotação criada ainda' : 'Nenhum resultado' }}
            </p>
            <button
              v-for="n in filteredNotePickerItems"
              :key="n.id"
              @click="pickNoteChoose(n)"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--paper-surface-3)]"
            >
              <svg class="w-4 h-4 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-sm text-ink-300 truncate flex-1">{{ n.title || 'Sem título' }}</p>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, watch, markRaw, provide, computed } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import BpmnNode from '../projects/BpmnNode.vue'
import BpmnEdge from '../projects/BpmnEdge.vue'
import { hapticLight } from '../../services/haptics'
import api from '../../api'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ nodes: [], edges: [] }),
  },
})
const emit = defineEmits(['update:modelValue', 'change'])

const nodes = ref([])
const edges = ref([])
let suppressChange = false

// === Snap guides ===
const helperLineV = ref(null)
const helperLineH = ref(null)
const viewport = ref({ x: 0, y: 0, zoom: 1 })
const SNAP_THRESHOLD = 6

function onViewportChange(v) { viewport.value = { x: v.x, y: v.y, zoom: v.zoom } }

function getNodeBounds(n) {
  const w = n.dimensions?.width || (n.data?.kind === 'text' ? (n.data?.width || 220) : 140)
  const h = n.dimensions?.height || (n.data?.kind === 'text' ? (n.data?.height || 80) : 60)
  return {
    left: n.position.x, right: n.position.x + w,
    top: n.position.y, bottom: n.position.y + h,
    cx: n.position.x + w / 2, cy: n.position.y + h / 2,
    w, h,
  }
}

function onNodeDrag(event) {
  const dragged = event.node
  if (!dragged) return
  const me = getNodeBounds(dragged)
  let snapDx = null, snapDy = null, lineV = null, lineH = null

  for (const n of nodes.value) {
    if (n.id === dragged.id) continue
    const o = getNodeBounds(n)
    for (const [ours, theirs] of [[me.cx, o.cx], [me.left, o.left], [me.right, o.right]]) {
      const d = theirs - ours
      if (Math.abs(d) < SNAP_THRESHOLD && (snapDx === null || Math.abs(d) < Math.abs(snapDx))) {
        snapDx = d; lineV = theirs
      }
    }
    for (const [ours, theirs] of [[me.cy, o.cy], [me.top, o.top], [me.bottom, o.bottom]]) {
      const d = theirs - ours
      if (Math.abs(d) < SNAP_THRESHOLD && (snapDy === null || Math.abs(d) < Math.abs(snapDy))) {
        snapDy = d; lineH = theirs
      }
    }
  }

  if (snapDx !== null) dragged.position.x += snapDx
  if (snapDy !== null) dragged.position.y += snapDy

  helperLineV.value = lineV !== null ? { x: lineV } : null
  helperLineH.value = lineH !== null ? { y: lineH } : null
}

function onNodeDragStop() {
  helperLineV.value = null
  helperLineH.value = null
}

const nodeTypes = { bpmn: markRaw(BpmnNode) }
const edgeTypes = { 'bpmn-edge': markRaw(BpmnEdge) }

const nodeKinds = [
  { kind: 'start', label: 'Início', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#6B7A3F" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>', hint: 'Evento de início' },
  { kind: 'task', label: 'Tarefa', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#2C4A5C" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>', hint: 'Atividade / tarefa' },
  { kind: 'decision', label: 'Gateway X', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#C89A3F" stroke-width="8"><polygon points="40,4 76,40 40,76 4,40"/></svg>', hint: 'Gateway exclusivo (XOR)' },
  { kind: 'parallel', label: 'Gateway +', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#B8593D" stroke-width="8"><polygon points="40,4 76,40 40,76 4,40"/></svg>', hint: 'Gateway paralelo (AND)' },
  { kind: 'event', label: 'Evento', icon: '<span style="color:#8A9A5B;font-size:18px;line-height:1">◎</span>', hint: 'Evento intermediário' },
  { kind: 'timer', label: 'Timer', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#2C4A5C" stroke-width="2"><circle cx="12" cy="13" r="9"/><polyline points="12,7 12,13 16,15"/></svg>', hint: 'Evento de timer' },
  { kind: 'message', label: 'Mensagem', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#2C4A5C" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>', hint: 'Evento de mensagem' },
  { kind: 'error', label: 'Erro', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#B8593D" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', hint: 'Evento de erro' },
  { kind: 'subprocess', label: 'Subproc.', icon: '<span style="color:#556231;font-size:15px;line-height:1">⊞</span>', hint: 'Subprocesso' },
  { kind: 'document', label: 'Documento', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 60 80" fill="none" stroke="#B8593D" stroke-width="6"><path stroke-linejoin="round" d="M8,3 L48,3 L56,13 L56,77 L8,77 Z M48,3 L48,13 L56,13"/></svg>', hint: 'Documento / dado' },
  { kind: 'datastore', label: 'Dados', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 80 80" fill="none" stroke="#6B7A3F" stroke-width="5"><ellipse cx="40" cy="18" rx="34" ry="12"/><line x1="6" y1="18" x2="6" y2="62"/><line x1="74" y1="18" x2="74" y2="62"/><ellipse cx="40" cy="62" rx="34" ry="12"/></svg>', hint: 'Armazenamento de dados' },
  { kind: 'end', label: 'Fim', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#B8593D" stroke-width="3"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>', hint: 'Evento de fim' },
  { kind: 'text', label: 'Texto', icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#6B6558" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h16"/></svg>', hint: 'Texto livre (redimensionável)' },
]

const labelByKind = {
  start: 'Início', task: 'Nova tarefa', decision: 'Decisão?', parallel: 'Paralelo',
  event: 'Evento', timer: 'Timer', message: 'Mensagem', error: 'Erro',
  subprocess: 'Subprocesso', document: 'Documento', datastore: 'Dados', end: 'Fim', text: '',
}

const defaultEdgeOptions = {
  type: 'bpmn-edge',
  animated: true,
  style: { stroke: 'rgba(44, 74, 92, 0.7)', strokeWidth: 2 },
  markerEnd: { type: 'arrowclosed', color: 'rgba(44, 74, 92, 0.9)' },
}

const LEGACY_MAP = { step: 'task' }
function normalizeKind(k) { return LEGACY_MAP[k] || k || 'task' }

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
    id, type: 'bpmn',
    position: { x: offsetX, y: offsetY },
    data,
  })
  hapticLight()
  emitChange()
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
    style: { stroke: 'rgba(44, 74, 92, 0.7)', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: 'rgba(44, 74, 92, 0.9)' },
  })
  hapticLight()
  emitChange()
}

function onChange() {
  if (suppressChange) return
  emitChange()
}

function clearAll() {
  if (!nodes.value.length && !edges.value.length) return
  if (!window.confirm('Apagar todos os nós e conexões?')) return
  nodes.value = []
  edges.value = []
  emitChange()
}

function serialize() {
  return {
    nodes: nodes.value.map((n) => {
      const d = n.data || {}
      const data = { label: d.label || '', kind: d.kind || 'task' }
      if (data.kind === 'text') {
        data.width = d.width || 220
        data.height = d.height || 80
        data.fontSize = d.fontSize || 16
      }
      if (d.linkedNoteId) {
        data.linkedNoteId = d.linkedNoteId
        data.linkedNoteTitle = d.linkedNoteTitle || ''
      }
      return { id: n.id, type: 'bpmn', position: n.position, data }
    }),
    edges: edges.value.map((e) => {
      const out = {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label || '',
      }
      if (e.data && Object.keys(e.data).length) out.data = e.data
      return out
    }),
  }
}

function emitChange() {
  const payload = serialize()
  emit('update:modelValue', payload)
  emit('change', payload)
}

// Callback usado pelo BpmnNode / BpmnEdge quando edita label
provide('onFlowDirty', () => emitChange())

// ── Picker de anotações (pra linkar num nó) ──
const notePicker = reactive({
  show: false,
  query: '',
  loading: false,
  items: [],
  resolver: null,
})

const filteredNotePickerItems = computed(() => {
  if (!notePicker.query) return notePicker.items
  const q = notePicker.query.toLowerCase()
  return notePicker.items.filter((n) => (n.title || '').toLowerCase().includes(q))
})

async function openNotePicker() {
  notePicker.show = true
  notePicker.query = ''
  notePicker.loading = true
  try {
    const { data } = await api.get('/notes')
    notePicker.items = data || []
  } catch {
    notePicker.items = []
  } finally {
    notePicker.loading = false
  }
  return new Promise((resolve) => { notePicker.resolver = resolve })
}
function pickNoteChoose(note) {
  notePicker.show = false
  const r = notePicker.resolver
  notePicker.resolver = null
  r?.(note)
}
function cancelNotePicker() {
  notePicker.show = false
  const r = notePicker.resolver
  notePicker.resolver = null
  r?.(null)
}

// BpmnNode chama esta função quando o usuário clica "Linkar doc"
provide('onPickNoteFor', () => openNotePicker())

// Carrega valor externo quando muda (troca de fluxograma)
watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    suppressChange = true
    nodes.value = (val.nodes || []).map((n) => ({
      ...n,
      type: 'bpmn',
      data: { ...n.data, kind: normalizeKind(n.data?.kind) },
      style: undefined,
    }))
    edges.value = (val.edges || []).map((e) => ({
      ...defaultEdgeOptions,
      ...e,
      type: 'bpmn-edge',
    }))
    setTimeout(() => { suppressChange = false }, 80)
  },
  { immediate: true, deep: false }
)
</script>

<style>
.flow-canvas { background: transparent; }

.flow-helper-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}
.helper-line-v, .helper-line-h {
  position: absolute;
  background: rgba(184, 89, 61, 0.75);
  box-shadow: 0 0 6px rgba(184, 89, 61, 0.5);
}
.helper-line-v { top: 0; bottom: 0; width: 1px; }
.helper-line-h { left: 0; right: 0; height: 1px; }

.flow-canvas .vue-flow__edge-path {
  filter: drop-shadow(0 0 4px rgba(44, 74, 92, 0.25));
}
.flow-canvas .vue-flow__edge-text {
  fill: #1F1B15;
  font-size: 11px;
  font-weight: 500;
}
.flow-canvas .vue-flow__edge-textbg {
  fill: rgba(253, 251, 245, 0.92);
}
.flow-canvas .vue-flow__edge.selected .vue-flow__edge-path {
  stroke: rgba(184, 89, 61, 0.95);
}
.flow-canvas .vue-flow__controls {
  background: rgba(253, 251, 245, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(94, 79, 45, 0.14);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(94, 79, 45, 0.10);
  overflow: hidden;
}
.flow-canvas .vue-flow__controls-button {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(94, 79, 45, 0.10);
  color: #4A453B;
  fill: currentColor;
}
.flow-canvas .vue-flow__controls-button:hover {
  background: rgba(94, 79, 45, 0.06);
  color: #1F1B15;
}
.flow-canvas .vue-flow__minimap {
  background: rgba(253, 251, 245, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(94, 79, 45, 0.14);
  border-radius: 10px;
  overflow: hidden;
}
.flow-canvas .vue-flow__node-bpmn {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}
.flow-canvas .vue-flow__node-bpmn.selected .bpmn-shape,
.flow-canvas .vue-flow__node-bpmn:focus .bpmn-shape {
  outline: 2px solid rgba(184, 89, 61, 0.7);
  outline-offset: 4px;
  border-radius: inherit;
}
</style>
