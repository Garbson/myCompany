<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--paper-bg)]/70 backdrop-blur-md"
        @click.self="$emit('close')"
      >
        <div class="glass-strong rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <header class="flex items-center justify-between px-5 py-3 border-b border-[var(--paper-border)]">
            <div>
              <h2 class="text-sm font-semibold text-ink-400">Fundo do site</h2>
              <p class="text-[11px] text-ink-50">Escolha um vídeo para rodar atrás das páginas</p>
            </div>
            <button
              @click="$emit('close')"
              class="text-ink-100 hover:text-ink-400 p-1 -m-1 transition-colors"
              aria-label="Fechar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="px-5 py-3 border-b border-[var(--paper-border)] flex items-center gap-2 text-[11px] text-ink-100">
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="prefetchDone ? 'bg-green-400' : prefetching ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'"
            ></span>
            <span v-if="prefetching">Baixando vídeos ({{ progress.done }}/{{ progress.total }})…</span>
            <span v-else-if="prefetchDone">Vídeos em cache — funcionam offline</span>
            <span v-else>Vídeos serão baixados em segundo plano</span>
          </div>

          <div class="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3 scrollbar-slim">
            <button
              v-for="bg in backgrounds"
              :key="bg.id"
              @click="pick(bg.id)"
              class="group relative aspect-video rounded-xl overflow-hidden border-2 transition-all"
              :class="
                currentId === bg.id
                  ? 'border-blue-400 shadow-lg shadow-paper'
                  : 'border-[var(--paper-border)] hover:border-white/30'
              "
            >
              <div v-if="!bg.src" class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                <svg class="w-8 h-8 text-ink-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-12.728 12.728M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <video
                v-else
                :src="bg.src"
                muted
                loop
                playsinline
                autoplay
                preload="metadata"
                class="absolute inset-0 w-full h-full object-cover"
              ></video>
              <div class="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                <p class="text-xs font-medium text-ink-400 text-left">{{ bg.label }}</p>
              </div>
              <div
                v-if="currentId === bg.id"
                class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"
              >
                <svg class="w-3 h-3 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useBackground } from '../composables/useBackground'

const props = defineProps({ show: Boolean })
defineEmits(['close'])

const { backgrounds, currentId, setBackground, prefetchAll } = useBackground()

const prefetching = ref(false)
const prefetchDone = ref(localStorage.getItem('mycompany:bg:prefetched') === '1')
const progress = ref({ done: 0, total: 0 })

function pick(id) {
  setBackground(id)
}

async function runPrefetch() {
  if (prefetchDone.value || prefetching.value) return
  prefetching.value = true
  progress.value = { done: 0, total: backgrounds.filter((b) => b.src).length }
  await prefetchAll((d, t) => (progress.value = { done: d, total: t }))
  prefetching.value = false
  prefetchDone.value = localStorage.getItem('mycompany:bg:prefetched') === '1'
}

watch(
  () => props.show,
  (v) => {
    if (v) runPrefetch()
  }
)
</script>
