<template>
  <div
    class="group glass rounded-xl glow-hover p-4 transition-all flex items-start gap-4"
    :class="{ 'opacity-60': rest, 'bg-green-500/[0.04]': habit.completed_today }"
  >
    <!-- Botão circular: completar / desfazer -->
    <button
      v-if="!rest"
      @click="habit.completed_today ? $emit('uncomplete', habit) : $emit('complete', habit)"
      class="w-12 h-12 rounded-full shrink-0 transition-all flex items-center justify-center border-2 group/btn"
      :class="habit.completed_today
        ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30'
        : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/10 hover:scale-105 active:scale-95'"
      :aria-label="habit.completed_today ? 'Desmarcar' : 'Concluir'"
    >
      <svg v-if="habit.completed_today" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <div v-else class="w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-white/5">
      <span class="text-xs text-gray-500">—</span>
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-white" :class="{ 'line-through': habit.completed_today }">
            {{ habit.name }}
          </p>
          <p v-if="habit.identity" class="text-[11px] text-purple-300/80 mt-0.5 truncate">
            Eu sou alguém que {{ habit.identity }}
          </p>
        </div>

        <!-- Streak -->
        <div v-if="habit.streak > 0" class="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30">
          <span class="text-base leading-none">🔥</span>
          <span class="text-xs font-bold tabular-nums">{{ habit.streak }}</span>
        </div>
      </div>

      <!-- Cue + 2-min version (collapsed by default) -->
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span v-if="cueText" class="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-300">
          📌 {{ cueText }}
        </span>
        <span v-if="habit.two_minute_version" class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
          ⚡ {{ habit.two_minute_version }}
        </span>
        <span v-if="habit.required_30d > 0" class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400">
          {{ habit.pct_30d }}% últimos 30d
        </span>
      </div>
    </div>

    <!-- Editar -->
    <button
      @click="$emit('edit', habit)"
      class="shrink-0 self-start opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white p-1 -m-1"
      title="Editar"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  habit: { type: Object, required: true },
  rest: { type: Boolean, default: false },
})
defineEmits(['complete', 'uncomplete', 'edit'])

const cueText = computed(() => {
  const h = props.habit
  const parts = []
  if (h.stack_after) parts.push(`após ${h.stack_after}`)
  if (h.cue_time) parts.push(h.cue_time.slice(0, 5))
  if (h.cue_location) parts.push(h.cue_location)
  return parts.join(' · ')
})
</script>
