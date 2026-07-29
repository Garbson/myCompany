<template>
  <div v-if="items.length > 0">
    <p class="text-[10px] uppercase tracking-widest text-ink-50 font-semibold mb-1.5">
      Referenciado por
    </p>
    <div class="space-y-0.5">
      <button
        v-for="item in items"
        :key="item.id"
        @click="go(item)"
        class="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-left hover:bg-[var(--paper-surface-3)] transition-colors group"
      >
        <svg class="w-3 h-3 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="text-[11px] text-ink-200 group-hover:text-ink-400 truncate">{{ item.title || 'Sem título' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const props = defineProps({
  targetType: { type: String, required: true },
  targetId: { type: [Number, String], default: null },
})
const emit = defineEmits(['count'])

const router = useRouter()
const items = ref([])

async function load() {
  items.value = []
  if (!props.targetId) return
  try {
    const url = props.targetType === 'flowchart'
      ? `/backlinks/flowchart/${props.targetId}`
      : `/backlinks/note/${props.targetId}`
    const { data } = await api.get(url)
    items.value = data.notes || data.flowcharts || []
    emit('count', items.value.length)
  } catch {
    items.value = []
    emit('count', 0)
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
