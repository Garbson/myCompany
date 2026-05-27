<template>
  <BaseEdge :id="id" :path="edgePath" :style="mergedStyle" :marker-end="markerEnd" />
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
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
        class="bpmn-edge-label-placeholder"
        @mousedown.stop
      >Duplo clique</span>
    </div>
  </EdgeLabelRenderer>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
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

const { updateEdge } = useVueFlow()

const edgePath = computed(() =>
  getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 8,
  })
)

const labelX = computed(() => (props.sourceX + props.targetX) / 2)
const labelY = computed(() => (props.sourceY + props.targetY) / 2)

const mergedStyle = computed(() => {
  const base = { stroke: 'rgba(96, 165, 250, 0.7)', strokeWidth: 2 }
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
  updateEdge(props.id, { label: newLabel })
  editing.value = false
  props.data?.onDirty?.()
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
  padding: 3px 8px;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: border-color 0.2s;
}
.bpmn-edge-label-text:hover {
  border-color: rgba(96, 165, 250, 0.7);
}
.bpmn-edge-label-placeholder {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.2);
  font-size: 10px;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;
}
.bpmn-edge-label-placeholder:hover {
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.3);
}
.bpmn-edge-label-input {
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid rgba(96, 165, 250, 0.7);
  border-radius: 6px;
  padding: 3px 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  min-width: 80px;
  max-width: 200px;
  outline: none;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.3);
}
</style>
