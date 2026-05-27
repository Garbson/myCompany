<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @click.self="$emit('cancel')"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div
          class="relative bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          style="padding-bottom: var(--safe-bottom)"
        >
          <div class="p-5">
            <h3 class="text-base font-semibold text-white mb-1">{{ title }}</h3>
            <p v-if="message" class="text-sm text-gray-400">{{ message }}</p>
          </div>
          <div class="flex border-t border-gray-800">
            <button
              @click="$emit('cancel')"
              class="flex-1 py-3.5 text-sm font-medium text-gray-300 hover:bg-gray-800/60 transition-colors"
            >
              {{ cancelLabel }}
            </button>
            <button
              @click="$emit('confirm')"
              class="flex-1 py-3.5 text-sm font-semibold transition-colors border-l border-gray-800"
              :class="
                danger
                  ? 'text-red-400 hover:bg-red-500/10'
                  : 'text-blue-400 hover:bg-blue-500/10'
              "
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: Boolean,
  title: { type: String, default: 'Confirmar?' },
  message: String,
  confirmLabel: { type: String, default: 'Confirmar' },
  cancelLabel: { type: String, default: 'Cancelar' },
  danger: Boolean,
})
defineEmits(['confirm', 'cancel'])
</script>
