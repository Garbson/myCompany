<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('close')"></div>
      <div
        class="relative bg-gray-900 border border-gray-800 shadow-2xl w-full md:max-w-lg rounded-t-2xl md:rounded-xl overflow-y-auto max-h-[92dvh] md:max-h-[90vh]"
        style="padding-bottom: var(--safe-bottom)"
      >
        <div class="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <h3 class="text-base font-semibold text-white">{{ title }}</h3>
          <button @click="$emit('close')" class="text-gray-500 hover:text-white p-1 -m-1" aria-label="Fechar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ show: Boolean, title: String })
defineEmits(['close'])
</script>
