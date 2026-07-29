<template>
  <div v-if="items.length > 0" class="mt-6 pt-4 border-t border-[var(--paper-border)]">
    <p class="text-[10px] uppercase tracking-widest text-ink-50 font-semibold mb-2">
      Referenciado por
    </p>
    <div class="space-y-1">
      <button
        v-for="item in items"
        :key="item.id"
        @click="go(item)"
        class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[var(--paper-surface-3)] transition-colors group"
      >
        <svg v-if="kind === 'note-in-flow'" class="w-3.5 h-3.5 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
        </svg>
        <svg v-else class="w-3.5 h-3.5 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-xs text-ink-200 group-hover:text-ink-400 truncate">{{ item.title || 'Sem título' }}</span>
        <svg class="w-3 h-3 text-ink-50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7-7 7M3 12h18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const props = defineProps({
  // Tipo do alvo: 'flowchart' (busca notas que embedam) ou 'note' (busca flows que linkam)
  targetType: { type: String, required: true },
  targetId: { type: [Number, String], default: null },
})

const router = useRouter()
const items = ref([])

const kind = computed(() =>
  props.targetType === 'flowchart' ? 'note-in-flow' : 'flow-linking-note'
)

async function load() {
  items.value = []
  if (!props.targetId) return
  try {
    const url = props.targetType === 'flowchart'
      ? `/backlinks/flowchart/${props.targetId}`
      : `/backlinks/note/${props.targetId}`
    const { data } = await api.get(url)
    items.value = data.notes || data.flowcharts || []
  } catch {
    items.value = []
  }
}

function go(item) {
  if (props.targetType === 'flowchart') {
    router.push({ path: '/anotacoes', query: { open: item.id } })
  } else {
    router.push({ path: '/fluxogramas', query: { open: item.id } })
  }
}

watch(() => [props.targetType, props.targetId], load, { immediate: true })
</script>
