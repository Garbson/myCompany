<template>
  <BaseEdge
    :id="id"
    :path="edgePath[0]"
    :style="mergedStyle"
    :marker-end="markerEnd"
    :marker-start="bidirectional ? computedMarkerStart : undefined"
  />
  <!-- Path invisível grosso pra capturar dblclick em qualquer ponto da linha -->
  <path
    ref="hitPathRef"
    :d="edgePath[0]"
    fill="none"
    stroke="transparent"
    stroke-width="34"
    class="bpmn-edge-hit"
    @dblclick.stop="placeLabelAt($event)"
    style="pointer-events: stroke; cursor: text;"
  />
  <EdgeLabelRenderer>
    <!-- Botão de toggle bidirecional (aparece quando a edge está selecionada) -->
    <div
      v-if="selected"
      :style="{
        position: 'absolute',
        transform: `translate(-50%, calc(-50% - 26px)) translate(${labelFinalPos.x}px, ${labelFinalPos.y}px)`,
        pointerEvents: 'all',
      }"
      class="bpmn-edge-toolbar nodrag nopan"
      @pointerdown.stop
      @mousedown.stop
      @click.stop
    >
      <button
        type="button"
        @click="toggleBidirectional"
        :title="bidirectional ? 'Tornar unidirecional (→)' : 'Tornar bidirecional (⇄)'"
        class="bpmn-edge-toolbar-btn"
        :class="{ 'is-active': bidirectional }"
      >
        <svg v-if="bidirectional" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7L4 11m0 0l4 4m-4-4h16m0 0l-4-4m4 4l-4 4" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7-7 7M3 12h18" />
        </svg>
      </button>
    </div>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelFinalPos.x}px, ${labelFinalPos.y}px)`,
        pointerEvents: hasLabel || editing || dragging ? 'all' : 'none',
        cursor: editing ? 'text' : (dragging ? 'grabbing' : 'grab'),
      }"
      class="bpmn-edge-label nodrag nopan"
      :class="{ 'is-dragging': dragging, 'has-label': hasLabel }"
      @dblclick.stop="startEdit"
      @pointerdown="startDrag"
      @click.stop
    >
      <input
        v-if="editing"
        ref="inputRef"
        v-model="draft"
        type="text"
        placeholder="legenda"
        class="bpmn-edge-label-input"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="cancel"
        @pointerdown.stop
        @mousedown.stop
      />
      <span
        v-else-if="label"
        class="bpmn-edge-label-text"
      >{{ label }}</span>
      <!-- sem label e não editando: nenhum elemento visível (pointer-events já none no wrapper) -->
    </div>
  </EdgeLabelRenderer>
</template>

<script setup>
import { computed, ref, nextTick, inject, onMounted, watch } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useVueFlow } from '@vue-flow/core'

const props = defineProps({
  id: String,
  source: String,
  target: String,
  sourceX: Number,
  sourceY: Number,
  targetX: Number,
  targetY: Number,
  sourcePosition: String,
  targetPosition: String,
  label: String,
  selected: Boolean,
  animated: Boolean,
  markerEnd: [Object, String],
  style: [Object, String],
  data: Object,
})

const { findEdge, getViewport, screenToFlowCoordinate, project } = useVueFlow()
const onDirty = inject('onFlowDirty', null)

const hitPathRef = ref(null)
const hasLabel = computed(() => !!(props.label && props.label.trim()))
const bidirectional = computed(() => !!props.data?.bidirectional)

// Deriva um marker-start similar ao marker-end (para bidirecional)
const computedMarkerStart = computed(() => {
  const base = { type: 'arrowclosed', color: 'rgba(44, 74, 92, 0.9)' }
  if (props.markerEnd && typeof props.markerEnd === 'object') {
    return { ...base, ...props.markerEnd }
  }
  return base
})

function toggleBidirectional() {
  const edge = findEdge(props.id)
  if (!edge) return
  edge.data = {
    ...(edge.data || {}),
    bidirectional: !bidirectional.value,
  }
  onDirty?.()
}

// Converte coord do viewport pro sistema de coordenadas do canvas
function toFlowCoord(clientX, clientY) {
  if (typeof screenToFlowCoordinate === 'function') {
    return screenToFlowCoordinate({ x: clientX, y: clientY })
  }
  if (typeof project === 'function') {
    return project({ x: clientX, y: clientY })
  }
  const pane = document.querySelector('.vue-flow__viewport')
  if (!pane) return { x: clientX, y: clientY }
  const rect = pane.getBoundingClientRect()
  const vp = getViewport()
  return {
    x: (clientX - rect.left - vp.x) / (vp.zoom || 1),
    y: (clientY - rect.top - vp.y) / (vp.zoom || 1),
  }
}

const edgePath = computed(() =>
  getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 14,
    offset: 24,
  })
)

// Posição centro-padrão do path
const pathCenter = computed(() => ({
  x: edgePath.value[1] ?? (props.sourceX + props.targetX) / 2,
  y: edgePath.value[2] ?? (props.sourceY + props.targetY) / 2,
}))

// === Ancoragem do label no PATH ===
// labelT (0..1): posição ao longo do path
// labelPerp: deslocamento perpendicular ao path (positivo = "acima" na direção do normal)
const labelT = computed(() => {
  const v = Number(props.data?.labelT)
  return isFinite(v) && v >= 0 && v <= 1 ? v : null
})
const labelPerp = computed(() => {
  const v = Number(props.data?.labelPerp)
  return isFinite(v) ? v : 0
})

// Recalcula posição do label toda vez que o path muda
const anchoredPos = ref(null)

function computeAnchoredPos() {
  const t = labelT.value
  if (t === null || !hitPathRef.value) {
    anchoredPos.value = null
    return
  }
  try {
    const total = hitPathRef.value.getTotalLength()
    const p = hitPathRef.value.getPointAtLength(t * total)
    // Tangente e normal pra offset perpendicular
    const eps = Math.max(0.5, total * 0.005)
    const p1 = hitPathRef.value.getPointAtLength(Math.max(0, t * total - eps))
    const p2 = hitPathRef.value.getPointAtLength(Math.min(total, t * total + eps))
    const tx = p2.x - p1.x
    const ty = p2.y - p1.y
    const nlen = Math.hypot(tx, ty) || 1
    const nx = -ty / nlen
    const ny = tx / nlen
    const perp = labelPerp.value
    anchoredPos.value = {
      x: p.x + nx * perp,
      y: p.y + ny * perp,
    }
  } catch {
    anchoredPos.value = null
  }
}

// Recomputa quando o path muda
watch(edgePath, () => nextTick(computeAnchoredPos), { flush: 'post' })
watch(labelT, () => nextTick(computeAnchoredPos), { flush: 'post' })
watch(labelPerp, () => nextTick(computeAnchoredPos), { flush: 'post' })
onMounted(() => nextTick(computeAnchoredPos))

const labelFinalPos = computed(() => anchoredPos.value || pathCenter.value)

// === Cálculo de labelT/labelPerp a partir de um ponto no canvas ===
function computeLabelAnchor(flowX, flowY) {
  if (!hitPathRef.value) return null
  const total = hitPathRef.value.getTotalLength()
  if (!total) return null
  // Bisect coarse pra achar t ótimo (100 amostras)
  let bestT = 0.5
  let bestDist = Infinity
  const samples = 100
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const p = hitPathRef.value.getPointAtLength(t * total)
    const dx = flowX - p.x
    const dy = flowY - p.y
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      bestT = t
    }
  }
  // Refinamento local
  const win = 1 / samples
  for (let i = -10; i <= 10; i++) {
    const t = Math.max(0, Math.min(1, bestT + (i / 20) * win))
    const p = hitPathRef.value.getPointAtLength(t * total)
    const dx = flowX - p.x
    const dy = flowY - p.y
    const d = dx * dx + dy * dy
    if (d < bestDist) {
      bestDist = d
      bestT = t
    }
  }
  // Perpendicular offset (projeção do vetor click no normal)
  const p = hitPathRef.value.getPointAtLength(bestT * total)
  const eps = Math.max(0.5, total * 0.005)
  const p1 = hitPathRef.value.getPointAtLength(Math.max(0, bestT * total - eps))
  const p2 = hitPathRef.value.getPointAtLength(Math.min(total, bestT * total + eps))
  const tx = p2.x - p1.x
  const ty = p2.y - p1.y
  const nlen = Math.hypot(tx, ty) || 1
  const nx = -ty / nlen
  const ny = tx / nlen
  const perp = (flowX - p.x) * nx + (flowY - p.y) * ny
  return { t: bestT, perp: Math.round(perp * 10) / 10 }
}

// === Drag pra reposicionar o label ao longo da linha ===
const dragging = ref(false)
let dragStart = null

function startDrag(e) {
  if (editing.value) return
  if (e.button !== undefined && e.button !== 0) return
  e.stopPropagation()
  dragStart = {
    px: e.clientX,
    py: e.clientY,
    moved: false,
  }
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd, { once: true })
}

function onDragMove(e) {
  if (!dragStart) return
  const dx = e.clientX - dragStart.px
  const dy = e.clientY - dragStart.py
  if (!dragStart.moved && Math.hypot(dx, dy) > 3) {
    dragStart.moved = true
    dragging.value = true
  }
  if (!dragging.value) return
  const flow = toFlowCoord(e.clientX, e.clientY)
  const anchor = computeLabelAnchor(flow.x, flow.y)
  if (!anchor) return
  const edge = findEdge(props.id)
  if (!edge) return
  edge.data = {
    ...(edge.data || {}),
    labelT: anchor.t,
    labelPerp: anchor.perp,
  }
}

function onDragEnd() {
  window.removeEventListener('pointermove', onDragMove)
  const moved = dragStart?.moved
  dragStart = null
  if (dragging.value) {
    dragging.value = false
    onDirty?.()
  }
  return moved
}

const mergedStyle = computed(() => {
  const base = {
    stroke: 'rgba(44, 74, 92, 0.75)',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (props.selected) base.stroke = 'rgba(184, 89, 61, 0.95)'
  if (typeof props.style === 'object') return { ...base, ...props.style }
  return base
})

const editing = ref(false)
const draft = ref('')
const inputRef = ref(null)

async function startEdit() {
  draft.value = props.label || ''
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

// Duplo clique em qualquer ponto da linha: ancora o label ali e abre editor
async function placeLabelAt(e) {
  const flow = toFlowCoord(e.clientX, e.clientY)
  const anchor = computeLabelAnchor(flow.x, flow.y)
  if (!anchor) return
  const edge = findEdge(props.id)
  if (edge) {
    edge.data = {
      ...(edge.data || {}),
      labelT: anchor.t,
      labelPerp: anchor.perp,
    }
  }
  onDirty?.()
  await nextTick()
  await startEdit()
}

function commit() {
  if (!editing.value) return
  const newLabel = draft.value.trim()
  if (newLabel !== (props.label || '')) {
    const edge = findEdge(props.id)
    if (edge) edge.label = newLabel
    onDirty?.()
  }
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>

<style scoped>
.bpmn-edge-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  user-select: none;
  touch-action: none;
}
.bpmn-edge-label.is-dragging .bpmn-edge-label-text {
  opacity: 0.85;
  box-shadow: 0 0 0 2px rgba(184, 89, 61, 0.55);
}
.bpmn-edge-label-text {
  display: inline-block;
  padding: 3px 9px;
  background: rgba(253, 251, 245, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(184, 89, 61, 0.35);
  border-radius: 8px;
  color: #1F1B15;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: border-color 0.2s, background 0.2s;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(94, 79, 45, 0.12);
}
.bpmn-edge-label-text:hover {
  border-color: rgba(184, 89, 61, 0.7);
  background: rgba(253, 251, 245, 1);
}
.bpmn-edge-label-input {
  background: rgba(253, 251, 245, 1);
  border: 1.5px solid rgba(184, 89, 61, 0.7);
  border-radius: 6px;
  padding: 3px 8px;
  color: #1F1B15;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  min-width: 100px;
  max-width: 220px;
  outline: none;
  box-shadow: 0 0 0 3px rgba(184, 89, 61, 0.15);
}
.bpmn-edge-label-input::placeholder {
  color: rgba(94, 79, 45, 0.35);
}

/* === Toolbar da edge selecionada === */
.bpmn-edge-toolbar {
  z-index: 6;
}
.bpmn-edge-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(253, 251, 245, 0.95);
  border: 1px solid rgba(94, 79, 45, 0.25);
  color: #4A453B;
  cursor: pointer;
  box-shadow: 0 3px 10px rgba(94, 79, 45, 0.18);
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
}
.bpmn-edge-toolbar-btn:hover {
  background: #FDFBF5;
  color: #B8593D;
  border-color: rgba(184, 89, 61, 0.55);
}
.bpmn-edge-toolbar-btn:active {
  transform: translateY(1px);
}
.bpmn-edge-toolbar-btn.is-active {
  background: #B8593D;
  color: #FDFBF5;
  border-color: #994932;
}
</style>
