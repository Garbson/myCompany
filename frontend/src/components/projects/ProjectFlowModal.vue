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
              <p class="text-xs text-gray-500 leading-none">Fluxograma</p>
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
            v-for="t in nodeTypes"
            :key="t.type"
            @click="addNode(t.type)"
            class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass-light rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span class="w-2 h-2 rounded-full" :style="{ background: t.color }"></span>
            {{ t.label }}
          </button>
          <div class="w-px h-5 bg-white/10 mx-1"></div>
          <button
            @click="clearAll"
            class="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Limpar tudo
          </button>
          <p class="hidden md:block ml-auto text-[10px] text-gray-500 shrink-0">
            Arraste para mover · Conecte das bordas · Duplo-clique pra renomear
          </p>
        </div>

        <!-- Canvas -->
        <div class="flex-1 relative min-h-0" @drop="onDrop" @dragover.prevent>
          <VueFlow
            v-if="show"
            v-model:nodes="nodes"
            v-model:edges="edges"
            :default-edge-options="defaultEdgeOptions"
            :fit-view-on-init="true"
            :connect-on-click="false"
            class="flow-canvas"
            @nodes-change="onChange"
            @edges-change="onChange"
            @connect="onConnect"
            @node-double-click="renameNode"
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
              <p class="text-xs text-gray-600">Use a barra acima para adicionar etapas, decisões ou marcos.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import { hapticLight, hapticSuccess } from '../../services/haptics'

const props = defineProps({
  show: Boolean,
  project: Object,
})
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

const nodeTypes = [
  { type: 'start', label: '+ Início', color: '#22c55e' },
  { type: 'step', label: '+ Etapa', color: '#3b82f6' },
  { type: 'decision', label: '+ Decisão', color: '#eab308' },
  { type: 'end', label: '+ Fim', color: '#ef4444' },
]

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: 'rgba(96, 165, 250, 0.6)', strokeWidth: 2 },
  type: 'smoothstep',
}

const styleByType = {
  start: { background: 'rgba(34, 197, 94, 0.18)', borderColor: '#22c55e' },
  step: { background: 'rgba(59, 130, 246, 0.18)', borderColor: '#3b82f6' },
  decision: { background: 'rgba(234, 179, 8, 0.18)', borderColor: '#eab308' },
  end: { background: 'rgba(239, 68, 68, 0.18)', borderColor: '#ef4444' },
}

const labelByType = { start: 'Início', step: 'Etapa', decision: 'Decisão?', end: 'Fim' }

function buildStyle(type) {
  const s = styleByType[type] || styleByType.step
  return {
    background: s.background,
    borderColor: s.borderColor,
    color: '#ffffff',
    border: `1.5px solid ${s.borderColor}`,
    borderRadius: '12px',
    padding: '10px 16px',
    fontWeight: '500',
    backdropFilter: 'blur(12px)',
    boxShadow: `0 4px 20px ${s.borderColor}33`,
    minWidth: '120px',
    textAlign: 'center',
  }
}

let nextId = 0
function genId() {
  nextId += 1
  return `n${Date.now().toString(36)}-${nextId}`
}

function addNode(type) {
  const id = genId()
  const offsetX = 80 + (nodes.value.length % 4) * 30
  const offsetY = 80 + (nodes.value.length % 3) * 30
  nodes.value.push({
    id,
    type: 'default',
    position: { x: offsetX, y: offsetY },
    data: { label: labelByType[type] || 'Nó', kind: type },
    style: buildStyle(type),
  })
  dirty.value = true
  hapticLight()
}

function renameNode({ node }) {
  const next = window.prompt('Renomear', node.data?.label || '')
  if (next === null) return
  node.data = { ...node.data, label: next }
  dirty.value = true
}

function onConnect(conn) {
  edges.value.push({
    id: `e-${conn.source}-${conn.target}-${Date.now().toString(36)}`,
    source: conn.source,
    target: conn.target,
    sourceHandle: conn.sourceHandle,
    targetHandle: conn.targetHandle,
    ...defaultEdgeOptions,
  })
  dirty.value = true
  hapticLight()
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
      style: n.style || buildStyle(n.data?.kind),
    }))
    edges.value = (flow.edges || []).map((e) => ({ ...defaultEdgeOptions, ...e }))
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
    nodes: nodes.value.map((n) => ({
      id: n.id,
      position: n.position,
      data: n.data,
      style: n.style,
    })),
    edges: edges.value.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
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

function onDrop() {}

watch(
  () => props.show,
  (v) => {
    if (v && props.project) load(props.project.id)
    else {
      if (saveTimer) clearTimeout(saveTimer)
      nodes.value = []
      edges.value = []
      dirty.value = false
      loadedOnce.value = false
    }
  }
)
</script>

<style>
/* Override do tema vue-flow para combinar com glass */
.flow-canvas {
  background: transparent;
}
.flow-canvas .vue-flow__handle {
  background: rgba(96, 165, 250, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.4);
  width: 10px;
  height: 10px;
}
.flow-canvas .vue-flow__handle:hover {
  background: rgb(96, 165, 250);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.7);
}
.flow-canvas .vue-flow__edge-path {
  filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.4));
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
</style>
