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
      <div v-if="show" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

        <div
          class="absolute inset-x-0 top-0 flex items-center justify-center p-4 pointer-events-none"
          :style="containerStyle"
        >
          <Transition
            enter-active-class="transition duration-250 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="show"
              class="modal-sheet pointer-events-auto glass-strong gradient-border w-full rounded-2xl flex flex-col overflow-hidden"
              :class="sizeClass"
            >
              <!-- Header sticky -->
              <div class="flex items-center justify-between px-4 py-3 md:py-4 border-b border-white/5 shrink-0">
                <h3 class="text-base font-semibold text-white">{{ title }}</h3>
                <button @click="$emit('close')" class="text-gray-500 hover:text-white p-1 -m-1 transition-colors" aria-label="Fechar">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Body com scroll interno -->
              <div class="p-4 overflow-y-auto scrollbar-slim flex-1">
                <slot />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  title: String,
  size: { type: String, default: 'md' }, // md | lg | xl
})
defineEmits(['close'])

const sizeClass = computed(() => ({
  md: 'md:max-w-lg',
  lg: 'md:max-w-3xl',
  xl: 'md:max-w-5xl',
})[props.size] || 'md:max-w-lg')

// Container ocupa o visualViewport — encolhe quando teclado abre, mantendo o modal centrado
const containerStyle = computed(() => ({
  height: 'var(--vvh, 100dvh)',
  transition: 'height 0.18s ease',
}))
</script>

<style scoped>
.modal-sheet {
  max-height: 100%;
}
</style>
