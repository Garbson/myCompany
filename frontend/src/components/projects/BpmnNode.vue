<template>
  <div class="bpmn-node group" :class="[`bpmn-kind-${kind}`, { 'is-selected': selected }]">
    <!-- 4 handles em cada lado, cada um servindo de source E target -->
    <template v-for="pos in handlePositions" :key="pos.id">
      <Handle
        :id="`${pos.id}-t`"
        type="target"
        :position="pos.pos"
        class="bpmn-handle"
        :style="pos.style"
      />
      <Handle
        :id="`${pos.id}-s`"
        type="source"
        :position="pos.pos"
        class="bpmn-handle"
        :style="pos.style"
      />
    </template>

    <!-- ===== Texto livre ===== -->
    <div
      v-if="kind === 'text'"
      class="bpmn-text-node"
      :style="{ width: textWidth + 'px', minHeight: textHeight + 'px', fontSize: textFontSize + 'px' }"
    >
      <textarea
        v-if="editing"
        ref="textareaRef"
        v-model="draft"
        class="bpmn-text-input nodrag nopan"
        :style="{ fontSize: textFontSize + 'px' }"
        @blur="commit"
        @keydown="onTextareaKey"
        @pointerdown.stop
        @mousedown.stop
      />
      <div v-else class="bpmn-text-content" @dblclick.stop="startEdit">
        <span v-if="label" style="white-space: pre-wrap;">{{ label }}</span>
        <span v-else class="bpmn-text-placeholder">Duplo clique pra editar</span>
      </div>

      <!-- Toolbar de fonte (visível só quando selecionado) -->
      <div v-if="selected" class="bpmn-text-toolbar nodrag nopan" @pointerdown.stop @mousedown.stop>
        <button type="button" class="bpmn-text-btn" @click.stop="changeFont(-2)" title="Diminuir fonte">A−</button>
        <span class="bpmn-text-size">{{ textFontSize }}</span>
        <button type="button" class="bpmn-text-btn" @click.stop="changeFont(+2)" title="Aumentar fonte">A+</button>
      </div>

      <!-- Resize handle (canto inferior direito) -->
      <div
        class="bpmn-resize-handle nodrag nopan"
        @pointerdown.stop.prevent="startResize"
        title="Arraste para redimensionar"
      ></div>
    </div>

    <!-- Shape (com label dentro quando há espaço) -->
    <div v-if="kind !== 'text'" class="bpmn-shape-wrap">
      <!-- Start / End / Intermediate events: círculos -->
      <div
        v-if="kind === 'start' || kind === 'end' || kind === 'event'"
        class="bpmn-shape bpmn-event"
        :class="{ 'bpmn-event-end': kind === 'end', 'bpmn-event-intermediate': kind === 'event' }"
      >
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

      <div v-else-if="kind === 'decision'" class="bpmn-shape bpmn-gateway bpmn-gateway-xor">
        <svg class="gateway-svg" viewBox="0 0 80 80">
          <polygon points="40,2 78,40 40,78 2,40" />
        </svg>
        <span class="gateway-symbol">X</span>
      </div>

      <div v-else-if="kind === 'parallel'" class="bpmn-shape bpmn-gateway bpmn-gateway-parallel">
        <svg class="gateway-svg" viewBox="0 0 80 80">
          <polygon points="40,2 78,40 40,78 2,40" />
        </svg>
        <span class="gateway-symbol">+</span>
      </div>

      <div v-else-if="kind === 'timer'" class="bpmn-shape bpmn-event bpmn-event-timer">
        <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="13" r="9" />
          <polyline points="12,7 12,13 16,15" />
        </svg>
      </div>

      <div v-else-if="kind === 'message'" class="bpmn-shape bpmn-event bpmn-event-message">
        <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      <div v-else-if="kind === 'error'" class="bpmn-shape bpmn-event bpmn-event-error">
        <svg class="event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </div>

      <div v-else-if="kind === 'datastore'" class="bpmn-shape bpmn-datastore">
        <svg class="datastore-svg" viewBox="0 0 80 80">
          <ellipse cx="40" cy="18" rx="34" ry="12" />
          <line x1="6" y1="18" x2="6" y2="62" />
          <line x1="74" y1="18" x2="74" y2="62" />
          <ellipse cx="40" cy="62" rx="34" ry="12" />
        </svg>
      </div>

      <div v-else-if="kind === 'document'" class="bpmn-shape bpmn-document">
        <svg viewBox="0 0 60 80" class="doc-svg">
          <path d="M5,3 L45,3 L55,15 L55,77 L5,77 Z M45,3 L45,15 L55,15" />
        </svg>
      </div>

      <!-- Task / subprocess: label INSIDE; cresce com o texto -->
      <div v-else-if="kind === 'subprocess'" class="bpmn-shape bpmn-subprocess">
        <textarea
          v-if="editing"
          ref="inputRef"
          v-model="draft"
          rows="1"
          class="bpmn-label-input bpmn-label-input-inside"
          @blur="commit"
          @keydown="onLabelKey"
        />
        <span v-else class="bpmn-label-inside" @dblclick.stop="startEdit">{{ label }}</span>
        <span class="subprocess-plus">+</span>
      </div>

      <div v-else class="bpmn-shape bpmn-task">
        <textarea
          v-if="editing"
          ref="inputRef"
          v-model="draft"
          rows="1"
          class="bpmn-label-input bpmn-label-input-inside"
          @blur="commit"
          @keydown="onLabelKey"
        />
        <span v-else class="bpmn-label-inside" @dblclick.stop="startEdit">{{ label }}</span>
      </div>
    </div>

    <!-- Label embaixo (figuras compactas: eventos, gateways, doc, datastore) -->
    <div
      v-if="labelOutside"
      class="bpmn-label-outside"
      @dblclick.stop="startEdit"
    >
      <textarea
        v-if="editing"
        ref="inputRef"
        v-model="draft"
        rows="1"
        class="bpmn-label-input"
        @blur="commit"
        @keydown="onLabelKey"
      />
      <span v-else>{{ label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, inject, watch } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'

const props = defineProps({
  id: String,
  data: Object,
  selected: Boolean,
})

const { updateNodeData } = useVueFlow()
const onDirty = inject('onFlowDirty', null)

const inputRef = ref(null)
const textareaRef = ref(null)
const editing = ref(false)
const draft = ref('')

const kind = computed(() => props.data?.kind || 'task')
const label = computed(() => props.data?.label || '')

// Texto livre — dimensões / fonte (com defaults)
const textWidth = computed(() => props.data?.width || 220)
const textHeight = computed(() => props.data?.height || 80)
const textFontSize = computed(() => props.data?.fontSize || 16)

const labelOutside = computed(() =>
  ['start', 'end', 'event', 'timer', 'message', 'error', 'decision', 'parallel', 'document', 'datastore'].includes(kind.value)
)

const handlePositions = [
  { id: 'top', pos: Position.Top, style: {} },
  { id: 'right', pos: Position.Right, style: {} },
  { id: 'bottom', pos: Position.Bottom, style: {} },
  { id: 'left', pos: Position.Left, style: {} },
]

function autoSizeLabel() {
  const el = inputRef.value
  if (!el || el.tagName?.toLowerCase() !== 'textarea') return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

async function startEdit() {
  draft.value = label.value
  editing.value = true
  await nextTick()
  if (kind.value === 'text') {
    textareaRef.value?.focus()
  } else {
    inputRef.value?.focus()
    inputRef.value?.select?.()
    autoSizeLabel()
  }
}

// Re-mede sempre que o draft mudar (digitação, paste, undo, etc.)
watch(draft, () => {
  if (!editing.value) return
  nextTick(autoSizeLabel)
})

function commit() {
  if (!editing.value) return
  const next = (draft.value ?? '').trim()
  // text node permite vazio; demais mantêm o anterior se vazio
  if (kind.value === 'text') {
    updateNodeData(props.id, { label: draft.value ?? '' })
  } else {
    updateNodeData(props.id, { label: next || label.value })
  }
  editing.value = false
  onDirty?.()
}

function cancel() {
  editing.value = false
}

// Atalhos nos editores de label (textarea dos nós: tarefa, subprocesso,
// eventos, gateways, document, datastore — e também o nó de texto livre).
// Convenção tipo Slack/Linear:
// - Esc cancela
// - Enter (sem modificador) commita
// - Shift + Enter quebra linha
function onLabelKey(e) {
  // Blinda contra Vue Flow + listeners globais (undo, delete-node, etc.)
  e.stopPropagation()
  if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
    return
  }
  if (e.key === 'Enter') {
    if (e.shiftKey) return // permite quebra de linha
    e.preventDefault()
    commit()
  }
}
// Alias mantido pra retrocompat (textarea do nó "text" usa onTextareaKey)
const onTextareaKey = onLabelKey

function changeFont(delta) {
  const next = Math.max(10, Math.min(64, textFontSize.value + delta))
  updateNodeData(props.id, { fontSize: next })
  onDirty?.()
}

// Resize manual via pointer events
function startResize(e) {
  const startX = e.clientX
  const startY = e.clientY
  const startW = textWidth.value
  const startH = textHeight.value

  const onMove = (ev) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    const w = Math.max(100, Math.round(startW + dx))
    const h = Math.max(40, Math.round(startH + dy))
    updateNodeData(props.id, { width: w, height: h })
  }
  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    onDirty?.()
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
</script>

<style scoped>
.bpmn-node {
  position: relative;
  display: inline-block;          /* contorna apenas o shape — handles ficam no perímetro real */
  font-family: inherit;
  color: #fff;
}

.bpmn-shape-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bpmn-shape {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.2s, transform 0.15s;
}

/* === Task — cresce com o conteúdo === */
.bpmn-task {
  min-width: 140px;
  max-width: 260px;
  min-height: 60px;
  padding: 14px 20px;
  background: rgba(59, 130, 246, 0.18);
  border: 2px solid #3b82f6;
  border-radius: 12px;
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
.bpmn-event-timer {
  background: rgba(6, 182, 212, 0.2);
  border: 2px solid #06b6d4;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.3);
  color: #67e8f9;
}
.bpmn-event-message {
  background: rgba(59, 130, 246, 0.2);
  border: 2px solid #3b82f6;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}
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

/* === Gateways === */
.bpmn-gateway {
  width: 88px;
  height: 88px;
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
  font-size: 26px;
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

/* === Subprocess — cresce com o texto === */
.bpmn-subprocess {
  min-width: 140px;
  max-width: 260px;
  min-height: 60px;
  padding: 14px 20px 22px;
  background: rgba(99, 102, 241, 0.18);
  border: 2px solid #6366f1;
  border-radius: 12px;
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

/* === Datastore === */
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

.bpmn-node:hover .bpmn-shape {
  transform: scale(1.02);
}

/* === Label dentro (task/subprocess) === */
.bpmn-label-inside {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  word-break: break-word;
  white-space: pre-wrap;
  line-height: 1.3;
  color: #fff;
  user-select: none;
  cursor: text;
}

/* === Label fora (eventos / gateways / etc.) ===
 * position absolute: o label fica visualmente embaixo do shape mas NÃO conta
 * pra altura do container — assim os handles do Vue Flow ficam no perímetro
 * real do círculo / documento / datastore, e não esticados pra envolver o label.
 *
 * width: max-content é essencial: como o containing block (o nó do vue-flow)
 * tem só o tamanho do shape, sem isso o navegador usa shrink-to-fit limitado
 * a esse tamanho e o texto quebra caractere-por-caractere. Com max-content
 * o label cresce até max-width naturalmente. */
.bpmn-label-outside {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  width: max-content;
  max-width: 220px;
  padding: 3px 10px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #e2e8f0;
  text-align: center;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  line-height: 1.3;
  cursor: text;
  pointer-events: auto;
}

/* === Editor de label (textarea — suporta Shift+Enter pra quebrar linha) === */
.bpmn-label-input {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(96, 165, 250, 0.7);
  border-radius: 6px;
  padding: 3px 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  text-align: center;
  min-width: 120px;
  max-width: 220px;
  outline: none;
  resize: none;
  overflow: hidden;
  line-height: 1.3;
  white-space: pre-wrap;
}
.bpmn-label-input-inside {
  background: rgba(0, 0, 0, 0.55);
  border-color: rgba(96, 165, 250, 0.6);
}

/* === Texto livre === */
.bpmn-text-node {
  position: relative;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  background: rgba(15, 23, 42, 0.35);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 8px 10px;
  color: #e2e8f0;
  line-height: 1.35;
  transition: border-color 0.15s, background 0.15s;
}
.bpmn-node.is-selected .bpmn-text-node {
  border-color: rgba(168, 85, 247, 0.7);
  background: rgba(15, 23, 42, 0.5);
}
.bpmn-text-content {
  flex: 1;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-word;
  cursor: text;
  user-select: none;
}
.bpmn-text-placeholder {
  color: rgba(255, 255, 255, 0.25);
  font-style: italic;
}
.bpmn-text-input {
  width: 100%;
  height: 100%;
  min-height: 60px;
  resize: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: 1px solid rgba(96, 165, 250, 0.6);
  border-radius: 6px;
  padding: 6px 8px;
  outline: none;
  font-family: inherit;
  line-height: 1.35;
}
.bpmn-text-toolbar {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 5px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  z-index: 5;
}
.bpmn-text-btn {
  width: 26px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: none;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.bpmn-text-btn:hover {
  background: rgba(96, 165, 250, 0.25);
  color: #fff;
}
.bpmn-text-size {
  min-width: 22px;
  text-align: center;
  font-size: 10px;
  color: #94a3b8;
  font-variant-numeric: tabular-nums;
}
.bpmn-resize-handle {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(96, 165, 250, 0.9) 50%);
  border-bottom-right-radius: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}
.bpmn-node:hover .bpmn-resize-handle,
.bpmn-node.is-selected .bpmn-resize-handle {
  opacity: 1;
}

/* === Handles (4 lados) === */
:global(.bpmn-handle) {
  width: 10px !important;
  height: 10px !important;
  background: rgba(96, 165, 250, 0.95) !important;
  border: 2px solid rgba(255, 255, 255, 0.4) !important;
  opacity: 0;
  transition: opacity 0.15s, box-shadow 0.15s, transform 0.15s;
}
.bpmn-node:hover :global(.bpmn-handle) {
  opacity: 0.9;
}
.bpmn-node :global(.bpmn-handle:hover) {
  opacity: 1 !important;
  transform: scale(1.4);
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.9);
}
/* Source e target ficam sobrepostos em cada lado (target invisível por baixo) */
.bpmn-node :global(.vue-flow__handle.target) {
  z-index: 1;
}
.bpmn-node :global(.vue-flow__handle.source) {
  z-index: 2;
}
</style>
