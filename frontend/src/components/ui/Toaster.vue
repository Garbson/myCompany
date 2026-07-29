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
          class="pointer-events-auto paper-strong rounded-xl flex items-center gap-3 px-4 py-3 min-w-[260px] max-w-full"
          :class="ringClass(t.type)"
          @click="dismiss(t.id)"
        >
          <div
            class="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
            :class="iconBg(t.type)"
          >
            <svg class="w-4 h-4 text-[#FDFBF5]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path v-if="t.type === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              <path v-else-if="t.type === 'error'" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              <path v-else-if="t.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002.07 2z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="text-sm text-ink-300 font-medium flex-1">{{ t.message }}</p>
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
    default: 'auto',
  },
})

const { toasts, dismiss } = useToast()

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
    success: 'ring-1 ring-olive-500/40',
    error:   'ring-1 ring-terra-500/40',
    warning: 'ring-1 ring-[#C89A3F]/40',
    info:    'ring-1 ring-indigo_ink-500/40',
  }[type] || ''
}

function iconBg(type) {
  return {
    success: 'bg-olive-500',
    error:   'bg-terra-500',
    warning: 'bg-[#C89A3F]',
    info:    'bg-indigo_ink-500',
  }[type] || 'bg-paper-300'
}
</script>
