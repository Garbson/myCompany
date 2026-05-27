<template>
  <div v-if="auth.isLoggedIn" class="flex min-h-screen bg-gray-950">
    <UpdateBanner />
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
    />
    <div class="flex-1 min-w-0 flex flex-col h-[100dvh] md:h-[calc(100vh-1.5rem)]">
      <MobileHeader />
      <main
        class="flex-1 min-w-0 overflow-auto px-4 pt-3 md:p-3 pb-[calc(var(--safe-bottom)+4.75rem)] md:pb-[calc(var(--safe-bottom)+1rem)]"
      >
        <router-view />
      </main>
    </div>
    <BottomNav />
  </div>
  <div
    v-else
    class="bg-gray-950 min-h-screen"
    style="padding-top: var(--safe-top); padding-bottom: var(--safe-bottom)"
  >
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import Sidebar from "./components/layout/Sidebar.vue";
import MobileHeader from "./components/layout/MobileHeader.vue";
import BottomNav from "./components/layout/BottomNav.vue";
import UpdateBanner from "./components/UpdateBanner.vue";
import { useVersionCheck } from "./services/versionCheck";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const sidebarCollapsed = ref(true);
const { start, stop } = useVersionCheck();

onMounted(() => {
  start();
});
onUnmounted(() => {
  stop();
});
</script>
