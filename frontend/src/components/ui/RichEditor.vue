<template>
  <div class="rich-editor relative">
    <!-- Toolbar flutuante ao selecionar texto -->
    <div
      v-if="editor && showBubble"
      ref="bubbleRef"
      class="fixed z-[300] flex items-center gap-0.5 p-1 glass-strong rounded-lg shadow-xl border border-[var(--paper-border)]"
      :style="bubbleStyle"
      @mousedown.prevent
    >
      <ToolBtn :active="editor.isActive('bold')" @click="runCmd(() => editor.chain().focus().toggleBold().run())" title="Negrito">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('italic')" @click="runCmd(() => editor.chain().focus().toggleItalic().run())" title="Itálico">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" stroke-width="2"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" stroke-width="2"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="2"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('underline')" @click="runCmd(() => editor.chain().focus().toggleUnderline().run())" title="Sublinhado">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('strike')" @click="runCmd(() => editor.chain().focus().toggleStrike().run())" title="Tachado">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 6.5C17.5 4.01 15.04 2 12 2s-5.5 2.01-5.5 4.5c0 2.33 1.5 3.71 3.5 4.5"/><path d="M6.5 17.5C6.5 19.99 8.96 22 12 22s5.5-2.01 5.5-4.5c0-1.58-.73-2.87-2-3.7"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('highlight')" @click="runCmd(() => editor.chain().focus().toggleHighlight().run())" title="Destaque">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.62 12L12 5.67 14.38 12H9.62zM11 3L5.5 18H8l1.12-3h5.76L16 18h2.5L13 3h-2z" opacity=".9"/><path d="M4 20h16v2H4z"/></svg>
      </ToolBtn>
      <div class="w-px h-5 bg-[var(--paper-surface-3)] mx-0.5"></div>
      <ToolBtn :active="editor.isActive('heading', { level: 1 })" @click="runCmd(() => editor.chain().focus().toggleHeading({ level: 1 }).run())" title="Título 1">
        <span class="text-[11px] font-bold">H1</span>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('heading', { level: 2 })" @click="runCmd(() => editor.chain().focus().toggleHeading({ level: 2 }).run())" title="Título 2">
        <span class="text-[11px] font-bold">H2</span>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('heading', { level: 3 })" @click="runCmd(() => editor.chain().focus().toggleHeading({ level: 3 }).run())" title="Título 3">
        <span class="text-[11px] font-bold">H3</span>
      </ToolBtn>
      <div class="w-px h-5 bg-[var(--paper-surface-3)] mx-0.5"></div>
      <ToolBtn :active="editor.isActive('bulletList')" @click="runCmd(() => editor.chain().focus().toggleBulletList().run())" title="Lista">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('orderedList')" @click="runCmd(() => editor.chain().focus().toggleOrderedList().run())" title="Lista numerada">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('taskList')" @click="runCmd(() => editor.chain().focus().toggleTaskList().run())" title="Checklist">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('blockquote')" @click="runCmd(() => editor.chain().focus().toggleBlockquote().run())" title="Citação">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('code')" @click="runCmd(() => editor.chain().focus().toggleCode().run())" title="Código inline">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('codeBlock')" @click="runCmd(() => editor.chain().focus().toggleCodeBlock().run())" title="Bloco de código">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="10 8 6 12 10 16"/><polyline points="14 8 18 12 14 16"/></svg>
      </ToolBtn>
    </div>

    <!-- Menu de barra "/" -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="slashMenu.show"
          class="fixed z-[400] w-56 glass-strong rounded-xl shadow-2xl border border-[var(--paper-border)] py-1.5 overflow-y-auto max-h-72 scrollbar-slim"
          :style="slashMenu.style"
          @mousedown.prevent
        >
          <p class="px-3 pt-0.5 pb-1.5 text-[10px] text-ink-50 uppercase tracking-wider font-semibold">Blocos</p>
          <button
            v-for="(item, i) in filteredSlashItems"
            :key="item.id"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
            :class="i === slashMenu.selected ? 'bg-[var(--paper-surface-3)] text-ink-400' : 'text-ink-200 hover:bg-[var(--paper-surface-2)] hover:text-ink-400'"
            @click="executeSlashItem(item)"
            @mouseenter="slashMenu.selected = i"
          >
            <div class="w-8 h-8 rounded-lg bg-[var(--paper-surface-2)] flex items-center justify-center shrink-0" v-html="item.icon"></div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium">{{ item.label }}</p>
              <p class="text-[10px] text-ink-50">{{ item.description }}</p>
            </div>
          </button>
          <p v-if="filteredSlashItems.length === 0" class="px-3 py-3 text-xs text-ink-50 text-center">Nenhum resultado</p>
        </div>
      </Transition>
    </Teleport>

    <!-- Editor -->
    <editor-content :editor="editor" class="prose-editor" />

    <!-- Picker de fluxograma -->
    <Teleport to="body">
      <div
        v-if="flowPicker.show"
        class="fixed inset-0 z-[500] flex items-start justify-center pt-24 px-4"
        @click.self="closeFlowPicker"
      >
        <div class="absolute inset-0 bg-ink-400/40 backdrop-blur-sm"></div>
        <div class="relative paper-strong rounded-2xl w-full max-w-md overflow-hidden shadow-paper-lg">
          <div class="p-3 border-b border-[var(--paper-border)]">
            <div class="relative">
              <svg class="w-4 h-4 text-ink-50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" stroke-linecap="round" />
              </svg>
              <input
                v-model="flowPicker.query"
                type="text"
                placeholder="Buscar fluxograma…"
                class="w-full pl-9 pr-3 py-2 bg-[var(--paper-surface-2)] border border-[var(--paper-border)] rounded-lg text-sm text-ink-300 placeholder-ink-50 outline-none focus:border-terra-500"
                autofocus
              />
            </div>
          </div>
          <div class="max-h-80 overflow-y-auto scrollbar-slim py-1">
            <p v-if="flowPicker.loading" class="px-4 py-6 text-center text-xs text-ink-50">Carregando…</p>
            <p v-else-if="filteredFlowPickerItems.length === 0" class="px-4 py-6 text-center text-xs text-ink-50">
              {{ flowPicker.items.length === 0 ? 'Nenhum fluxograma criado ainda' : 'Nenhum resultado' }}
            </p>
            <button
              v-for="fc in filteredFlowPickerItems"
              :key="fc.id"
              @click="insertFlowEmbed(fc)"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--paper-surface-3)]"
            >
              <div class="w-7 h-7 rounded-lg bg-terra-500/12 text-terra-600 flex items-center justify-center shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
                </svg>
              </div>
              <p class="text-sm text-ink-300 truncate flex-1">{{ fc.title || 'Sem título' }}</p>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick, defineComponent, h } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { FlowEmbed } from '../editor/FlowEmbedExtension.js'
import api from '../../api'

const ToolBtn = defineComponent({
  props: { active: Boolean },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => h('button', {
      type: 'button',
      onMousedown: (e) => e.preventDefault(),
      onClick: () => emit('click'),
      class: [
        'flex items-center justify-center w-7 h-7 rounded-md text-xs transition-colors',
        props.active
          ? 'bg-blue-500/20 text-terra-600'
          : 'text-ink-100 hover:bg-[var(--paper-surface-2)] hover:text-ink-400'
      ].join(' ')
    }, slots.default?.())
  }
})

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Digite / para comandos ou comece a escrever…' },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const bubbleRef = ref(null)
const showBubble = ref(false)
const bubbleStyle = ref({})

// ── Slash menu ──
const slashItems = [
  { id: 'h1', label: 'Título 1', description: 'Título grande', icon: '<span class="text-xs font-bold text-ink-200">H1</span>', command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Título 2', description: 'Título médio', icon: '<span class="text-xs font-bold text-ink-200">H2</span>', command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Título 3', description: 'Título pequeno', icon: '<span class="text-xs font-bold text-ink-200">H3</span>', command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Lista com marcadores', description: 'Lista simples', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>', command: (e) => e.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: 'Lista numerada', description: '1, 2, 3…', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/></svg>', command: (e) => e.chain().focus().toggleOrderedList().run() },
  { id: 'task', label: 'Checklist', description: 'Lista de tarefas', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', command: (e) => e.chain().focus().toggleTaskList().run() },
  { id: 'quote', label: 'Citação', description: 'Bloco de citação', icon: '<svg class="w-4 h-4 text-ink-200" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/></svg>', command: (e) => e.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Bloco de código', description: 'Código formatado', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>', command: (e) => e.chain().focus().toggleCodeBlock().run() },
  { id: 'divider', label: 'Divisor', description: 'Linha horizontal', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>', command: (e) => e.chain().focus().setHorizontalRule().run() },
  { id: 'flow', label: 'Fluxograma', description: 'Embeda um fluxograma existente', icon: '<svg class="w-4 h-4 text-terra-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z"/></svg>', custom: 'flowPicker' },
  { id: 'bold', label: 'Negrito', description: 'Texto em negrito', icon: '<svg class="w-4 h-4 text-ink-200" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>', command: (e) => e.chain().focus().toggleBold().run() },
  { id: 'italic', label: 'Itálico', description: 'Texto em itálico', icon: '<svg class="w-4 h-4 text-ink-200" viewBox="0 0 24 24" fill="currentColor"><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" stroke-width="2"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" stroke-width="2"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="2"/></svg>', command: (e) => e.chain().focus().toggleItalic().run() },
  { id: 'underline', label: 'Sublinhado', description: 'Texto sublinhado', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>', command: (e) => e.chain().focus().toggleUnderline().run() },
  { id: 'highlight', label: 'Destaque', description: 'Texto destacado', icon: '<svg class="w-4 h-4 text-ink-200" viewBox="0 0 24 24" fill="currentColor"><path d="M9.62 12L12 5.67 14.38 12H9.62zM11 3L5.5 18H8l1.12-3h5.76L16 18h2.5L13 3h-2z" opacity=".9"/><path d="M4 20h16v2H4z"/></svg>', command: (e) => e.chain().focus().toggleHighlight().run() },
  { id: 'strikethrough', label: 'Tachado', description: 'Texto riscado', icon: '<svg class="w-4 h-4 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 6.5C17.5 4.01 15.04 2 12 2s-5.5 2.01-5.5 4.5c0 2.33 1.5 3.71 3.5 4.5"/></svg>', command: (e) => e.chain().focus().toggleStrike().run() },
]

const slashMenu = reactive({
  show: false,
  query: '',
  style: {},
  selected: 0,
})

const filteredSlashItems = computed(() => {
  if (!slashMenu.query) return slashItems
  const q = slashMenu.query.toLowerCase()
  return slashItems.filter(item =>
    item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.id.includes(q)
  )
})

function openSlashMenu(pos) {
  const coords = editor.value.view.coordsAtPos(pos)
  slashMenu.show = true
  slashMenu.query = ''
  slashMenu.selected = 0
  slashMenu.style = {
    top: `${coords.bottom + 8}px`,
    left: `${coords.left}px`,
    transformOrigin: 'top left',
  }
}

function closeSlashMenu() {
  slashMenu.show = false
  slashMenu.query = ''
}

function executeSlashItem(item) {
  const e = editor.value
  if (!e) return

  // Apaga a "/" e o filtro digitado
  const { from } = e.state.selection
  const textBefore = e.state.doc.textBetween(Math.max(0, from - 30), from, '\n')
  const slashMatch = textBefore.match(/\/([^\s]*)$/)
  if (slashMatch) {
    const deleteFrom = from - slashMatch[0].length
    e.chain().focus().deleteRange({ from: deleteFrom, to: from }).run()
  }

  closeSlashMenu()

  // Ações customizadas (que abrem outra UI)
  if (item.custom === 'flowPicker') {
    openFlowPicker()
    return
  }

  // Para comandos de bloco, restringe a seleção ao bloco atual
  const { $from } = e.state.selection
  const blockStart = $from.start()
  const blockEnd = $from.end()
  e.chain().focus().setTextSelection({ from: blockStart, to: blockEnd }).run()

  item.command(e)
}

// ── Flow picker ──
const flowPicker = reactive({
  show: false,
  query: '',
  loading: false,
  items: [],
})

async function openFlowPicker() {
  flowPicker.show = true
  flowPicker.query = ''
  flowPicker.loading = true
  try {
    const { data } = await api.get('/flowcharts')
    flowPicker.items = data || []
  } catch {
    flowPicker.items = []
  } finally {
    flowPicker.loading = false
  }
}

function closeFlowPicker() {
  flowPicker.show = false
}

const filteredFlowPickerItems = computed(() => {
  if (!flowPicker.query) return flowPicker.items
  const q = flowPicker.query.toLowerCase()
  return flowPicker.items.filter((f) => (f.title || '').toLowerCase().includes(q))
})

function insertFlowEmbed(flow) {
  const e = editor.value
  if (!e) return
  e.chain().focus().insertContent({
    type: 'flowEmbed',
    attrs: { flowchartId: flow.id, title: flow.title || 'Sem título' },
  }).run()
  closeFlowPicker()
}

// Extensão que intercepta "/" para abrir o menu
const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    const ext = this
    return [
      new Plugin({
        key: new PluginKey('slashCommands'),
        props: {
          handleKeyDown(view, event) {
            if (slashMenu.show) {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                slashMenu.selected = Math.min(slashMenu.selected + 1, filteredSlashItems.value.length - 1)
                return true
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                slashMenu.selected = Math.max(slashMenu.selected - 1, 0)
                return true
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                const item = filteredSlashItems.value[slashMenu.selected]
                if (item) executeSlashItem(item)
                return true
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                closeSlashMenu()
                return true
              }
              // Atualiza query no próximo tick
              if (event.key === 'Backspace') {
                nextTick(() => {
                  updateSlashQuery(view)
                })
                return false
              }
              if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                nextTick(() => {
                  updateSlashQuery(view)
                })
                return false
              }
            }
            return false
          },
          handleTextInput(view, from, to, text) {
            if (text === '/') {
              const $pos = view.state.doc.resolve(from)
              const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset)
              // Abre menu se "/" for digitado no início da linha ou depois de espaço
              if (textBefore === '' || textBefore.endsWith(' ')) {
                nextTick(() => openSlashMenu(from + 1))
              }
            }
            return false
          },
        },
      })
    ]
  },
})

function updateSlashQuery(view) {
  const { from } = view.state.selection
  const textBefore = view.state.doc.textBetween(Math.max(0, from - 30), from, '\n')
  const match = textBefore.match(/\/([^\s]*)$/)
  if (match) {
    slashMenu.query = match[1]
    slashMenu.selected = 0
  } else {
    closeSlashMenu()
  }
}

function runCmd(fn) {
  // Salva a seleção e restaura antes de executar, evitando que focus() a perca
  const e = editor.value
  if (!e) return
  const { from, to } = e.state.selection
  e.commands.focus()
  e.commands.setTextSelection({ from, to })
  fn()
}

const editor = useEditor({
  extensions: [
    StarterKit.configure({ codeBlock: { languageClassPrefix: 'language-' } }),
    Placeholder.configure({ placeholder: props.placeholder }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Underline,
    Highlight,
    Typography,
    FlowEmbed,
    SlashCommands,
  ],
  content: parseContent(props.modelValue),
  editable: props.editable,
  onUpdate({ editor }) {
    emit('update:modelValue', JSON.stringify(editor.getJSON()))
  },
  onSelectionUpdate({ editor }) {
    const { from, to } = editor.state.selection
    if (from === to) {
      showBubble.value = false
      return
    }
    showBubble.value = true
    nextTick(positionBubble)
  },
  onBlur() {
    setTimeout(() => {
      showBubble.value = false
      closeSlashMenu()
    }, 200)
  },
})

function parseContent(val) {
  if (!val) return ''
  try {
    const parsed = JSON.parse(val)
    if (parsed?.type === 'doc') return parsed
  } catch {}
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: val }] }] }
}

function positionBubble() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  bubbleStyle.value = {
    top: `${rect.top - 44}px`,
    left: `${Math.max(8, rect.left + rect.width / 2 - 180)}px`,
  }
}

watch(() => props.modelValue, (val) => {
  if (!editor.value) return
  const current = JSON.stringify(editor.value.getJSON())
  if (current === val) return
  editor.value.commands.setContent(parseContent(val), false)
})

watch(() => props.editable, (val) => {
  editor.value?.setEditable(val)
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style>
.prose-editor .ProseMirror {
  outline: none;
  min-height: 200px;
  color: #e2e8f0;
  font-size: 0.9375rem;
  line-height: 1.75;
}

.prose-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #4b5563;
  pointer-events: none;
  float: left;
  height: 0;
}

.prose-editor .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; color: #fff; margin: 1rem 0 0.5rem; line-height: 1.3; }
.prose-editor .ProseMirror h2 { font-size: 1.35rem; font-weight: 600; color: #fff; margin: 0.875rem 0 0.4rem; line-height: 1.35; }
.prose-editor .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; color: #e2e8f0; margin: 0.75rem 0 0.35rem; line-height: 1.4; }

.prose-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0.25rem 0; }
.prose-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0.25rem 0; }
.prose-editor .ProseMirror li { margin: 0.1rem 0; color: #cbd5e1; }
.prose-editor .ProseMirror li p { margin: 0; }

.prose-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.25rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 0.2rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
  width: 1rem; height: 1rem; accent-color: #3b82f6; cursor: pointer;
}
.prose-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { opacity: 0.5; text-decoration: line-through; }
.prose-editor .ProseMirror ul[data-type="taskList"] ul[data-type="taskList"] { padding-left: 1.5rem; }

.prose-editor .ProseMirror blockquote {
  border-left: 3px solid #3b82f6;
  padding-left: 1rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0.5rem 0;
}

.prose-editor .ProseMirror code {
  background: rgba(255,255,255,0.08);
  color: #93c5fd;
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.prose-editor .ProseMirror pre {
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}
.prose-editor .ProseMirror pre code { background: none; padding: 0; color: #a5f3fc; }

.prose-editor .ProseMirror mark { background: rgba(234, 179, 8, 0.25); color: #fde68a; border-radius: 2px; padding: 0 2px; }

.prose-editor .ProseMirror strong { color: #fff; font-weight: 700; }
.prose-editor .ProseMirror em { color: #cbd5e1; }
.prose-editor .ProseMirror s { color: #6b7280; }

.prose-editor .ProseMirror > * + * { margin-top: 0.35rem; }
.prose-editor .ProseMirror p { margin: 0; color: #cbd5e1; }

.prose-editor .ProseMirror hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,0.1);
  margin: 1rem 0;
}

.prose-editor .ProseMirror ::selection { background: rgba(59,130,246,0.3); }
</style>
