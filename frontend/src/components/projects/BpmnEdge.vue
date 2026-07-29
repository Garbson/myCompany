<template>
  <BaseEdge :id="id" :path="edgePath[0]" :style="mergedStyle" :marker-end="markerEnd" />
  <!-- Path invisível grosso pra capturar dblclick em qualquer ponto da linha -->
  <path
    :d="edgePath[0]"
    fill="none"
    stroke="transparent"
    stroke-width="22"
    class="bpmn-edge-hit"
    @dblclick.stop="placeLabelAt($event)"
    style="pointer-events: stroke; cursor: text;"
  />
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelFinalPos.x}px, ${labelFinalPos.y}px)`,
        pointerEvents: 'all',
        cursor: editing ? 'text' : (dragging ? 'grabbing' : 'grab'),
      }"
      class="bpmn-edge-label nodrag nopan"
      :class="{ 'is-dragging': dragging }"
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
      <span
        v-else
        class="bpmn-edge-label-empty"
        aria-hidden="true"
      ></span>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup>
import { computed, ref, nextTick, inject } from 'vue'
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

// Converte coord do viewport pro sistema de coordenadas do canvas.
// Vue Flow expõe screenToFlowCoordinate na v1.34+, e project na v0.x.
function toFlowCoord(clientX, clientY) {
  if (typeof screenToFlowCoordinate === 'function') {
    return screenToFlowCoordinate({ x: clientX, y: clientY })
  }
  if (typeof project === 'function') {
    return project({ x: clientX, y: clientY })
  }
  // Fallback manual — pega o viewport pane e calcula
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

const labelPos = computed(() => ({
  x: edgePath.value[1] ?? (props.sourceX + props.targetX) / 2,
  y: edgePath.value[2] ?? (props.sourceY + props.targetY) / 2,
}))

const labelOffset = computed(() => ({
  x: Number(props.data?.labelOffset?.x) || 0,
  y: Number(props.data?.labelOffset?.y) || 0,
}))

const labelFinalPos = computed(() => ({
  x: labelPos.value.x + labelOffset.value.x,
  y: labelPos.value.y + labelOffset.value.y,
}))

// === Drag pra reposicionar o label ao longo do canvas ===
const dragging = ref(false)
let dragStart = null

function startDrag(e) {
  if (editing.value) return
  // Só botão esquerdo, e não dispara se estiver editando input dentro
  if (e.button !== undefined && e.button !== 0) return
  e.stopPropagation()
  const initial = { x: labelOffset.value.x, y: labelOffset.value.y }
  dragStart = {
    px: e.clientX,
    py: e.clientY,
    initialX: initial.x,
    initialY: initial.y,
    moved: false,
  }
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', onDragEnd, { once: true })
}

function onDragMove(e) {
  if (!dragStart) return
  const { zoom } = getViewport()
  const dx = (e.clientX - dragStart.px) / (zoom || 1)
  const dy = (e.clientY - dragStart.py) / (zoom || 1)
  if (!dragStart.moved && Math.hypot(dx, dy) > 2) {
    dragStart.moved = true
    dragging.value = true
  }
  if (!dragging.value) return
  const edge = findEdge(props.id)
  if (!edge) return
  edge.data = {
    ...(edge.data || {}),
    labelOffset: {
      x: Math.round(dragStart.initialX + dx),
      y: Math.round(dragStart.initialY + dy),
    },
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
  // Se não moveu, foi um click limpo — deixa passar (dblclick ainda funciona)
  return moved
}

const mergedStyle = computed(() => {
  const base = {
    stroke: 'rgba(96, 165, 250, 0.75)',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (props.selected) base.stroke = 'rgba(168, 85, 247, 0.95)'
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

// Duplo clique em qualquer ponto da linha: reposiciona o label ali e abre editor
async function placeLabelAt(e) {
  const flowPos = toFlowCoord(e.clientX, e.clientY)
  const newOffset = {
    x: Math.round(flowPos.x - labelPos.value.x),
    y: Math.round(flowPos.y - labelPos.value.y),
  }
  const edge = findEdge(props.id)
  if (edge) {
    edge.data = { ...(edge.data || {}), labelOffset: newOffset }
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
.bpmn-edge-label.is-dragging .bpmn-edge-label-text,
.bpmn-edge-label.is-dragging .bpmn-edge-label-empty {
  opacity: 0.85;
  box-shadow: 0 0 0 2px rgba(184, 89, 61, 0.55);
}
.bpmn-edge-label-text {
  display: inline-block;
  padding: 3px 9px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 8px;
  color: #e2e8f0;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: border-color 0.2s, background 0.2s;
  cursor: text;
}
.bpmn-edge-label-text:hover {
  border-color: rgba(96, 165, 250, 0.8);
  background: rgba(15, 23, 42, 0.95);
}
/* área clicável discreta quando não há texto */
.bpmn-edge-label-empty {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
.bpmn-edge-label:hover .bpmn-edge-label-empty {
  background: rgba(96, 165, 250, 0.45);
  box-shadow: 0 0 8px rgba(96, 165, 250, 0.6);
}
.bpmn-edge-label-input {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(96, 165, 250, 0.7);
  border-radius: 6px;
  padding: 3px 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  min-width: 100px;
  max-width: 220px;
  outline: none;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.3);
}
.bpmn-edge-label-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
</style>
