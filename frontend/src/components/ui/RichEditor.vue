<template>
  <div class="rich-editor relative">
    <!-- Toolbar flutuante ao selecionar texto -->
    <div
      v-if="editor && showBubble"
      ref="bubbleRef"
      class="fixed z-[300] flex items-center gap-0.5 p-1 glass-strong rounded-lg shadow-xl border border-white/10"
      :style="bubbleStyle"
    >
      <ToolBtn :active="editor.isActive('bold')" @click="editor.chain().focus().toggleBold().run()" title="Negrito">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('italic')" @click="editor.chain().focus().toggleItalic().run()" title="Itálico">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><line x1="19" y1="4" x2="10" y2="4" stroke="currentColor" stroke-width="2"/><line x1="14" y1="20" x2="5" y2="20" stroke="currentColor" stroke-width="2"/><line x1="15" y1="4" x2="9" y2="20" stroke="currentColor" stroke-width="2"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('underline')" @click="editor.chain().focus().toggleUnderline().run()" title="Sublinhado">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('strike')" @click="editor.chain().focus().toggleStrike().run()" title="Tachado">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 6.5C17.5 4.01 15.04 2 12 2s-5.5 2.01-5.5 4.5c0 2.33 1.5 3.71 3.5 4.5"/><path d="M6.5 17.5C6.5 19.99 8.96 22 12 22s5.5-2.01 5.5-4.5c0-1.58-.73-2.87-2-3.7"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('highlight')" @click="editor.chain().focus().toggleHighlight().run()" title="Destaque">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.62 12L12 5.67 14.38 12H9.62zM11 3L5.5 18H8l1.12-3h5.76L16 18h2.5L13 3h-2z" opacity=".9"/><path d="M4 20h16v2H4z"/></svg>
      </ToolBtn>
      <div class="w-px h-5 bg-white/10 mx-0.5"></div>
      <ToolBtn :active="editor.isActive('heading', { level: 1 })" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="Título 1">
        <span class="text-[11px] font-bold">H1</span>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('heading', { level: 2 })" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="Título 2">
        <span class="text-[11px] font-bold">H2</span>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('heading', { level: 3 })" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="Título 3">
        <span class="text-[11px] font-bold">H3</span>
      </ToolBtn>
      <div class="w-px h-5 bg-white/10 mx-0.5"></div>
      <ToolBtn :active="editor.isActive('bulletList')" @click="editor.chain().focus().toggleBulletList().run()" title="Lista">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('orderedList')" @click="editor.chain().focus().toggleOrderedList().run()" title="Lista numerada">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('taskList')" @click="editor.chain().focus().toggleTaskList().run()" title="Checklist">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('blockquote')" @click="editor.chain().focus().toggleBlockquote().run()" title="Citação">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/></svg>
      </ToolBtn>
      <ToolBtn :active="editor.isActive('code')" @click="editor.chain().focus().toggleCode().run()" title="Código inline">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      </ToolBtn>
    </div>

    <!-- Editor -->
    <editor-content :editor="editor" class="prose-editor" />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted, nextTick, defineComponent, h } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'

const ToolBtn = defineComponent({
  props: { active: Boolean },
  emits: ['click'],
  setup(props, { slots, emit }) {
    return () => h('button', {
      type: 'button',
      onClick: (e) => { e.preventDefault(); emit('click') },
      class: [
        'flex items-center justify-center w-7 h-7 rounded-md text-xs transition-colors',
        props.active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      ].join(' ')
    }, slots.default?.())
  }
})

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Escreva algo… (selecione texto para formatar)' },
  editable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const bubbleRef = ref(null)
const showBubble = ref(false)
const bubbleStyle = ref({})

const editor = useEditor({
  extensions: [
    StarterKit.configure({ codeBlock: { languageClassPrefix: 'language-' } }),
    Placeholder.configure({ placeholder: props.placeholder }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Underline,
    Highlight,
    Typography,
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
    setTimeout(() => { showBubble.value = false }, 150)
  },
})

function parseContent(val) {
  if (!val) return ''
  try {
    const parsed = JSON.parse(val)
    if (parsed?.type === 'doc') return parsed
  } catch {}
  // texto puro legado → parágrafo
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

/* Task list */
.prose-editor .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0.25rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li > label { flex-shrink: 0; margin-top: 0.2rem; }
.prose-editor .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
  width: 1rem; height: 1rem; accent-color: #3b82f6; cursor: pointer;
}
.prose-editor .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { opacity: 0.5; text-decoration: line-through; }

/* Nested task lists */
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

/* Seleção */
.prose-editor .ProseMirror ::selection { background: rgba(59,130,246,0.3); }
</style>
