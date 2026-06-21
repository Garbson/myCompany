<template>
  <BaseEdge :id="id" :path="edgePath[0]" :style="mergedStyle" :marker-end="markerEnd" />
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
        pointerEvents: 'all',
      }"
      class="bpmn-edge-label nodrag nopan"
      @dblclick.stop="startEdit"
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
        @mousedown.stop
      >{{ label }}</span>
      <span
        v-else
        class="bpmn-edge-label-empty"
        @mousedown.stop
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
  markerEnd: Object,
  style: [Object, String],
  data: Object,
})

const { findEdge } = useVueFlow()
const onDirty = inject('onFlowDirty', null)

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
  cursor: default;
  user-select: none;
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
