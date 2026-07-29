<template>
  <div class="hidden md:flex items-center gap-1 px-1 pt-1 shrink-0 min-w-0 overflow-x-auto scrollbar-none">
    <!-- Abas abertas -->
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 max-w-[160px]"
      :class="isActive(tab.path)
        ? 'bg-[var(--paper-surface)] text-ink-400 border border-[var(--paper-border)] shadow-paper'
        : 'text-ink-100 hover:text-ink-300 hover:bg-[var(--paper-surface-2)]'"
      @click="navigate(tab.path)"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
      </svg>
      <span class="truncate">{{ tab.label }}</span>
      <button
        class="shrink-0 rounded p-0.5 transition-colors opacity-0 group-hover:opacity-100"
        :class="isActive(tab.path) ? 'opacity-100 hover:bg-[var(--paper-surface-3)] text-ink-100 hover:text-ink-400' : 'hover:bg-[var(--paper-surface-3)] text-ink-50 hover:text-ink-300'"
        @click.stop="closeTab(tab.path)"
        aria-label="Fechar aba"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Botão + -->
    <button
      ref="addBtnRef"
      @click="togglePicker"
      class="flex items-center justify-center w-7 h-7 rounded-lg text-ink-50 hover:text-ink-300 hover:bg-[var(--paper-surface-2)] transition-colors shrink-0"
      :class="tabs.length === 0 ? 'gap-1.5 w-auto px-2.5 text-xs' : ''"
      aria-label="Nova aba"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      <span v-if="tabs.length === 0">Nova aba</span>
    </button>
  </div>

  <!-- Picker teleportado para body para evitar clipping -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showPicker"
        class="fixed w-52 paper-strong rounded-xl overflow-hidden z-[200] py-1"
        :style="pickerStyle"
      >
        <p class="px-3 pt-1.5 pb-1 text-[10px] font-semibold text-ink-50 uppercase tracking-widest">Abrir seção</p>
        <button
          v-for="section in availableSections"
          :key="section.path"
          @click="openTab(section)"
          class="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
          :class="tabsStore.isOpen(section.path)
            ? 'text-ink-50 cursor-default'
            : 'text-ink-200 hover:bg-[var(--paper-surface-3)] hover:text-ink-400'"
          :disabled="tabsStore.isOpen(section.path)"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" :d="section.icon" />
          </svg>
          <span class="flex-1 text-left">{{ section.label }}</span>
          <svg
            v-if="tabsStore.isOpen(section.path)"
            class="w-3 h-3 shrink-0 text-olive-500"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Overlay click-outside -->
    <div v-if="showPicker" class="fixed inset-0 z-[199]" @click="showPicker = false" />
  </Teleport>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTabsStore, SECTIONS } from '../../stores/tabs'
import { useAuthStore } from '../../stores/auth'

const tabsStore = useTabsStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const showPicker = ref(false)
const addBtnRef = ref(null)
const pickerStyle = ref({})

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

async function togglePicker() {
  showPicker.value = !showPicker.value
  if (showPicker.value) {
    await nextTick()
    positionPicker()
  }
}

function positionPicker() {
  if (!addBtnRef.value) return
  const rect = addBtnRef.value.getBoundingClientRect()
  pickerStyle.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    transformOrigin: 'top left',
  }
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
