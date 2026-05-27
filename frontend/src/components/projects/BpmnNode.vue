<template>
  <div
    class="bpmn-node group"
    :style="containerStyle"
  >
    <!-- Handles -->
    <Handle v-if="hasTarget" type="target" :position="Position.Left" class="bpmn-handle" />
    <Handle v-if="hasSource" type="source" :position="Position.Right" class="bpmn-handle" />

    <!-- Shapes -->
    <!-- Start / End / Intermediate events: círculos -->
    <div v-if="kind === 'start' || kind === 'end' || kind === 'event'" class="bpmn-shape bpmn-event" :class="{ 'bpmn-event-end': kind === 'end', 'bpmn-event-intermediate': kind === 'event' }">
      <svg v-if="kind === 'start'" class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6" />
      </svg>
      <svg v-else-if="kind === 'end'" class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="6" y="6" width="12" height="12" rx="1" />
      </svg>
      <svg v-else class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    </div>

    <!-- Gateway exclusivo / decisão (diamante) -->
    <div v-else-if="kind === 'decision'" class="bpmn-shape bpmn-gateway bpmn-gateway-xor">
      <svg class="gateway-svg" viewBox="0 0 80 80">
        <polygon points="40,2 78,40 40,78 2,40" />
      </svg>
      <span class="gateway-symbol">X</span>
    </div>

    <!-- Gateway paralelo (diamante com +) -->
    <div v-else-if="kind === 'parallel'" class="bpmn-shape bpmn-gateway bpmn-gateway-parallel">
      <svg class="gateway-svg" viewBox="0 0 80 80">
        <polygon points="40,2 78,40 40,78 2,40" />
      </svg>
      <span class="gateway-symbol">+</span>
    </div>

    <!-- Timer event (círculo com relógio) -->
    <div v-else-if="kind === 'timer'" class="bpmn-shape bpmn-event bpmn-event-timer">
      <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="13" r="9" />
        <polyline points="12,7 12,13 16,15" />
      </svg>
    </div>

    <!-- Message event (círculo com envelope) -->
    <div v-else-if="kind === 'message'" class="bpmn-shape bpmn-event bpmn-event-message">
      <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    </div>

    <!-- Error event (círculo com raio) -->
    <div v-else-if="kind === 'error'" class="bpmn-shape bpmn-event bpmn-event-error">
      <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    </div>

    <!-- Data store (cilindro) -->
    <div v-else-if="kind === 'datastore'" class="bpmn-shape bpmn-datastore">
      <svg class="datastore-svg" viewBox="0 0 80 80">
        <ellipse cx="40" cy="18" rx="34" ry="12" />
        <line x1="6" y1="18" x2="6" y2="62" />
        <line x1="74" y1="18" x2="74" y2="62" />
        <ellipse cx="40" cy="62" rx="34" ry="12" />
      </svg>
    </div>

    <!-- Document / Data object -->
    <div v-else-if="kind === 'document'" class="bpmn-shape bpmn-document">
      <svg viewBox="0 0 60 80" class="doc-svg">
        <path d="M5,3 L45,3 L55,15 L55,77 L5,77 Z M45,3 L45,15 L55,15" />
      </svg>
    </div>

    <!-- Subprocess (retângulo com + dentro) -->
    <div v-else-if="kind === 'subprocess'" class="bpmn-shape bpmn-subprocess">
      <span class="subprocess-plus">+</span>
    </div>

    <!-- Task (default) -->
    <div v-else class="bpmn-shape bpmn-task"></div>

    <!-- Label -->
    <div
      class="bpmn-label"
      :class="{ 'bpmn-label-outside': isEvent || kind === 'document' || kind === 'datastore' }"
      @dblclick.stop="startEdit"
    >
      <input
        v-if="editing"
        ref="inputRef"
        v-model="draft"
        type="text"
        class="bpmn-label-input"
        @blur="commit"
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="cancel"
      />
      <span v-else>{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'

const props = defineProps({
  id: String,
  data: Object,
})

const { updateNodeData } = useVueFlow()
const inputRef = ref(null)
const editing = ref(false)
const draft = ref('')

const kind = computed(() => props.data?.kind || 'task')
const label = computed(() => props.data?.label || '')

const isEvent = computed(() => ['start', 'end', 'event', 'timer', 'message', 'error'].includes(kind.value))
const hasTarget = computed(() => kind.value !== 'start')
const hasSource = computed(() => kind.value !== 'end')

const containerStyle = computed(() => {
  // Eventos e document são compactos; task/decision/subprocess são maiores
  return {}
})

async function startEdit() {
  draft.value = label.value
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function commit() {
  if (!editing.value) return
  updateNodeData(props.id, { label: draft.value.trim() || label.value })
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>

<style scoped>
.bpmn-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: inherit;
  color: #fff;
}

/* === Shape base === */
.bpmn-shape {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.2s, transform 0.15s;
}

/* === Task (retângulo arredondado) === */
.bpmn-task {
  min-width: 140px;
  min-height: 60px;
  padding: 14px 18px;
  background: rgba(59, 130, 246, 0.18);
  border: 2px solid #3b82f6;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
}

/* === Event (círculo) === */
.bpmn-event {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.22);
  border: 2px solid #22c55e;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
  color: #86efac;
}
.bpmn-event-end {
  background: rgba(239, 68, 68, 0.22);
  border: 4px solid #ef4444;
  box-shadow: 0 4px 24px rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}
.bpmn-event-intermediate {
  background: rgba(168, 85, 247, 0.18);
  border: 2px solid #a855f7;
  box-shadow:
    inset 0 0 0 4px rgba(15, 23, 42, 0.9),
    inset 0 0 0 6px #a855f7,
    0 4px 20px rgba(168, 85, 247, 0.3);
  color: #d8b4fe;
}

/* Timer event */
.bpmn-event-timer {
  background: rgba(6, 182, 212, 0.2);
  border: 2px solid #06b6d4;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
  color: #67e8f9;
}

/* Message event */
.bpmn-event-message {
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

/* Error event */
.bpmn-event-error {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.22);
  border: 4px solid #ef4444;
  box-shadow: 0 4px 24px rgba(239, 68, 68, 0.35);
  color: #fca5a5;
}

.event-icon {
  width: 22px;
  height: 22px;
}

/* === Gateways (losangos) === */
.bpmn-gateway {
  width: 80px;
  height: 80px;
  background: transparent;
}
.bpmn-gateway-xor {
  filter: drop-shadow(0 4px 20px rgba(234, 179, 8, 0.35));
}
.bpmn-gateway-parallel {
  filter: drop-shadow(0 4px 20px rgba(249, 115, 22, 0.35));
}
.gateway-svg {
  width: 100%;
  height: 100%;
}
.gateway-svg polygon {
  stroke-width: 2.5;
}
.bpmn-gateway-xor .gateway-svg polygon {
  fill: rgba(234, 179, 8, 0.18);
  stroke: #eab308;
}
.bpmn-gateway-parallel .gateway-svg polygon {
  fill: rgba(249, 115, 22, 0.18);
  stroke: #f97316;
}
.gateway-symbol {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  pointer-events: none;
}
.bpmn-gateway-xor .gateway-symbol {
  color: #fde047;
}
.bpmn-gateway-parallel .gateway-symbol {
  color: #fed7aa;
}

/* === Document === */
.bpmn-document {
  width: 60px;
  height: 80px;
  background: transparent;
  filter: drop-shadow(0 4px 16px rgba(244, 114, 182, 0.3));
}
.doc-svg {
  width: 100%;
  height: 100%;
}
.doc-svg path {
  fill: rgba(244, 114, 182, 0.18);
  stroke: #f472b6;
  stroke-width: 2;
  stroke-linejoin: round;
}

/* === Subprocess === */
.bpmn-subprocess {
  min-width: 140px;
  min-height: 60px;
  padding: 14px 18px;
  background: rgba(99, 102, 241, 0.18);
  border: 2px solid #6366f1;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}
.subprocess-plus {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  line-height: 1;
  background: rgba(15, 23, 42, 0.85);
}

/* === Data store (cilindro) === */
.bpmn-datastore {
  width: 80px;
  height: 80px;
  background: transparent;
  filter: drop-shadow(0 4px 18px rgba(20, 184, 166, 0.3));
}
.datastore-svg {
  width: 100%;
  height: 100%;
}
.datastore-svg ellipse {
  fill: rgba(20, 184, 166, 0.18);
  stroke: #14b8a6;
  stroke-width: 2;
}
.datastore-svg line {
  stroke: #14b8a6;
  stroke-width: 2;
}

/* Hover */
.bpmn-node:hover .bpmn-shape {
  transform: scale(1.02);
}

/* === Label === */
.bpmn-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  max-width: 130px;
  word-break: break-word;
  pointer-events: auto;
  padding: 0 6px;
  line-height: 1.25;
  color: #fff;
  user-select: none;
}
.bpmn-label-outside {
  top: calc(100% + 6px);
  transform: translateX(-50%);
  white-space: nowrap;
  max-width: 160px;
  text-overflow: ellipsis;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}
.bpmn-label-input {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(96, 165, 250, 0.6);
  border-radius: 4px;
  padding: 2px 6px;
  color: #fff;
  font-size: inherit;
  font-weight: inherit;
  text-align: center;
  min-width: 80px;
  outline: none;
}

/* === Handles === */
:global(.bpmn-handle) {
  width: 10px !important;
  height: 10px !important;
  background: rgba(96, 165, 250, 0.95) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  opacity: 0.6;
  transition: opacity 0.15s, box-shadow 0.15s;
}
.bpmn-node:hover :global(.bpmn-handle) {
  opacity: 1;
  box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);
}
</style>
