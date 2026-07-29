<template>
  <NodeViewWrapper
    class="flow-embed my-3"
    :contenteditable="false"
    :data-drag-handle="editor?.isEditable ? '' : null"
  >
    <div
      class="paper-strong rounded-xl p-3 flex items-center gap-3 hover:border-terra-500/60 transition-colors cursor-pointer group"
      @click="openFlow"
      role="link"
      :title="title || 'Fluxograma'"
    >
      <div class="w-10 h-10 rounded-lg bg-terra-500/12 text-terra-600 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] uppercase tracking-widest text-ink-50 font-semibold">Fluxograma</p>
        <p class="font-serif text-base text-ink-400 truncate">{{ title || 'Sem título' }}</p>
      </div>
      <div class="shrink-0 text-ink-50 group-hover:text-terra-500 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7-7 7M3 12h18" />
        </svg>
      </div>
      <button
        v-if="editor?.isEditable"
        @click.stop="removeSelf"
        class="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-ink-50 hover:text-terra-500 hover:bg-terra-500/10 transition-all"
        title="Remover embed"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </NodeViewWrapper>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { useRouter } from 'vue-router'
import api from '../../api'

const props = defineProps(nodeViewProps)
const router = useRouter()

const cachedTitle = ref(null)

const flowchartId = computed(() => props.node.attrs.flowchartId)
const title = computed(() => cachedTitle.value ?? props.node.attrs.title ?? '')

async function refetchTitle() {
  if (!flowchartId.value) return
  try {
    const { data } = await api.get(`/flowcharts/${flowchartId.value}`)
    cachedTitle.value = data.title || 'Sem título'
    // Sincroniza título salvo se mudou
    if (data.title && data.title !== props.node.attrs.title) {
      props.updateAttributes?.({ title: data.title })
    }
  } catch {
    cachedTitle.value = props.node.attrs.title || '(indisponível)'
  }
}

function openFlow() {
  if (!flowchartId.value) return
  router.push({ path: '/fluxogramas', query: { open: flowchartId.value } })
}

function removeSelf() {
  const pos = props.getPos?.()
  if (typeof pos !== 'number') return
  props.editor?.chain().focus().deleteRange({ from: pos, to: pos + props.node.nodeSize }).run()
}

onMounted(refetchTitle)
</script>

<style scoped>
.flow-embed {
  user-select: none;
}
</style>
