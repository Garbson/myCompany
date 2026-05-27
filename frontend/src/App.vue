<template>
  <div v-if="auth.isLoggedIn" class="flex min-h-screen bg-gray-950">
    <UpdateBanner />
    <Sidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />
    <main class="flex-1 min-w-0 p-4 md:p-6 overflow-auto" style="padding-top: calc(env(safe-area-inset-top, 0px) + 3.5rem)">
      <router-view />
    </main>
  </div>
  <div v-else class="bg-gray-950 min-h-screen" style="padding-top: env(safe-area-inset-top, 0px)">
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useVersionCheck } from './services/versionCheck'
import Sidebar from './components/layout/Sidebar.vue'
import UpdateBanner from './components/UpdateBanner.vue'

const auth = useAuthStore()
const sidebarCollapsed = ref(false)
const { start, stop } = useVersionCheck()

onMounted(() => { start() })
onUnmounted(() => { stop() })
</script>
