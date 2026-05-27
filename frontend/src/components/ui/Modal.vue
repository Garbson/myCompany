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
        class="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>

        <Transition
          enter-active-class="transition duration-250 ease-out"
          enter-from-class="md:opacity-0 md:scale-95 translate-y-full md:translate-y-0"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="md:opacity-0 md:scale-95 translate-y-full md:translate-y-0"
        >
          <div
            v-if="show"
            class="modal-sheet fixed bottom-0 left-0 right-0 md:static glass-strong gradient-border md:w-full md:max-w-lg rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden"
          >
            <!-- Drag handle mobile -->
            <div class="md:hidden flex justify-center pt-2 pb-1 shrink-0">
              <div class="w-10 h-1 rounded-full bg-white/15"></div>
            </div>

            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 md:py-4 border-b border-white/5 shrink-0">
              <h3 class="text-base font-semibold text-white">{{ title }}</h3>
              <button @click="$emit('close')" class="text-gray-500 hover:text-white p-1 -m-1 transition-colors" aria-label="Fechar">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body com scroll interno -->
            <div class="p-4 overflow-y-auto scrollbar-slim modal-body">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean, title: String })
defineEmits(['close'])
</script>

<style scoped>
/* Mobile: ancorado ao bottom subindo conforme teclado abre, altura limitada à viewport visível */
@media (max-width: 767px) {
  .modal-sheet {
    bottom: var(--kb, 0px);
    max-height: calc(100dvh - var(--kb, 0px) - 1rem);
    transition: bottom 0.18s ease;
  }
  .modal-body {
    /* Espaço extra no fim respeitando safe area, mas só quando teclado fechado */
    padding-bottom: max(var(--safe-bottom), 0px);
  }
}

@media (min-width: 768px) {
  .modal-sheet {
    max-height: 90vh;
  }
}
</style>
