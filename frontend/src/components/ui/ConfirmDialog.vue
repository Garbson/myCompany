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
        <div class="absolute inset-0 bg-ink-400/40 backdrop-blur-sm"></div>
        <div
          class="relative paper-strong rounded-2xl w-full max-w-sm overflow-hidden"
          style="padding-bottom: var(--safe-bottom)"
        >
          <div class="p-5">
            <h3 class="font-serif text-lg font-semibold text-ink-400 mb-1 tracking-tight">{{ title }}</h3>
            <p v-if="message" class="text-sm text-ink-100">{{ message }}</p>
          </div>
          <div class="flex border-t border-[var(--paper-border)]">
            <button
              @click="$emit('cancel')"
              class="flex-1 py-3.5 text-sm font-medium text-ink-200 hover:bg-[var(--paper-surface-3)] transition-colors"
            >
              {{ cancelLabel }}
            </button>
            <button
              @click="$emit('confirm')"
              class="flex-1 py-3.5 text-sm font-semibold transition-colors border-l border-[var(--paper-border)]"
              :class="
                danger
                  ? 'text-terra-600 hover:bg-terra-500/10'
                  : 'text-indigo_ink-500 hover:bg-indigo_ink-500/10'
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
