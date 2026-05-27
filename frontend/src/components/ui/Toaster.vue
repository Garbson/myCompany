<template>
  <Teleport to="body">
    <div
      class="fixed left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none"
      :class="position"
      :style="positionStyle"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-200 ease-in absolute"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
        move-class="transition duration-200 ease-in-out"
      >
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto glass-strong rounded-xl flex items-center gap-3 px-4 py-3 min-w-[260px] max-w-full shadow-2xl"
          :class="ringClass(t.type)"
          @click="dismiss(t.id)"
        >
          <div
            class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            :class="iconBg(t.type)"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path v-if="t.type === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              <path v-else-if="t.type === 'error'" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              <path v-else-if="t.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002.07 2z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-sm text-white font-medium flex-1">{{ t.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToast } from '../../composables/useToast'

const props = defineProps({
  placement: {
    type: String,
    default: 'auto', // 'auto' = bottom no mobile, top no desktop
  },
})

const { toasts, dismiss } = useToast()

const isMobile = computed(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches)

const position = computed(() => {
  if (props.placement === 'top') return 'top-0 pt-3'
  if (props.placement === 'bottom') return 'bottom-0'
  return 'md:top-0 md:pt-3 bottom-0'
})

const positionStyle = computed(() => {
  return {
    paddingTop: props.placement === 'top' ? 'calc(var(--safe-top) + 0.75rem)' : undefined,
    paddingBottom: props.placement === 'bottom' || props.placement === 'auto'
      ? 'calc(var(--safe-bottom) + 5.25rem)'
      : undefined,
  }
})

function ringClass(type) {
  return {
    success: 'ring-1 ring-green-400/30 shadow-green-500/20',
    error: 'ring-1 ring-red-400/30 shadow-red-500/20',
    warning: 'ring-1 ring-yellow-400/30 shadow-yellow-500/20',
    info: 'ring-1 ring-blue-400/30 shadow-blue-500/20',
  }[type] || ''
}

function iconBg(type) {
  return {
    success: 'bg-gradient-to-br from-green-400 to-green-600',
    error: 'bg-gradient-to-br from-red-400 to-red-600',
    warning: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    info: 'bg-gradient-to-br from-blue-400 to-indigo-600',
  }[type] || 'bg-gray-700'
}
</script>
