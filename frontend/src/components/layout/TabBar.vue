<template>
  <div v-if="tabs.length > 0" class="hidden md:flex items-center gap-1 px-1 pt-1 shrink-0 min-w-0 overflow-x-auto scrollbar-none">
    <!-- Abas abertas -->
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[160px]"
      :class="isActive(tab.path)
        ? 'bg-white/10 text-white'
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'"
      @click="navigate(tab.path)"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
      </svg>
      <span class="truncate">{{ tab.label }}</span>
      <button
        class="shrink-0 rounded p-0.5 transition-colors opacity-0 group-hover:opacity-100"
        :class="isActive(tab.path) ? 'opacity-100 hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/10 text-gray-600 hover:text-gray-300'"
        @click.stop="closeTab(tab.path)"
        aria-label="Fechar aba"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Botão + -->
    <div class="relative shrink-0">
      <button
        @click="showPicker = !showPicker"
        class="flex items-center justify-center w-7 h-7 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors"
        aria-label="Nova aba"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <!-- Picker -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showPicker"
          class="absolute top-full left-0 mt-1.5 w-48 glass-strong rounded-xl overflow-hidden z-50 py-1"
        >
          <button
            v-for="section in availableSections"
            :key="section.path"
            @click="openTab(section)"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
            :class="tabsStore.isOpen(section.path)
              ? 'text-gray-600 cursor-default'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'"
            :disabled="tabsStore.isOpen(section.path)"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="section.icon" />
            </svg>
            <span class="flex-1 text-left">{{ section.label }}</span>
            <svg
              v-if="tabsStore.isOpen(section.path)"
              class="w-3 h-3 shrink-0 text-gray-600"
              fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Botão + flutuante quando não há abas -->
  <div v-else class="hidden md:flex items-center px-1 pt-1 shrink-0">
    <div class="relative">
      <button
        @click="showPicker = !showPicker"
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
        aria-label="Abrir aba"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <span>Nova aba</span>
      </button>

      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showPicker"
          class="absolute top-full left-0 mt-1.5 w-48 glass-strong rounded-xl overflow-hidden z-50 py-1"
        >
          <button
            v-for="section in availableSections"
            :key="section.path"
            @click="openTab(section)"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="section.icon" />
            </svg>
            <span>{{ section.label }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </div>

  <!-- Click outside -->
  <div v-if="showPicker" class="fixed inset-0 z-40" @click="showPicker = false" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore, SECTIONS } from '../../stores/tabs'
import { useAuthStore } from '../../stores/auth'

const tabsStore = useTabsStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const showPicker = ref(false)

const tabs = computed(() => tabsStore.tabs)

const availableSections = computed(() => {
  const workMode = !!auth.workMode
  return SECTIONS.filter((s) => {
    if (workMode && s.noWork) return false
    if (!workMode && s.workOnly) return false
    return true
  })
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function navigate(path) {
  router.push(path)
}

function openTab(section) {
  tabsStore.openTab(section)
  router.push(section.path)
  showPicker.value = false
}

function closeTab(path) {
  const wasActive = isActive(path)
  tabsStore.closeTab(path)

  if (wasActive) {
    const remaining = tabsStore.tabs
    if (remaining.length > 0) {
      router.push(remaining[remaining.length - 1].path)
    }
  }
}
</script>
