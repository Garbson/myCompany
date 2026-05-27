<template>
  <div v-if="auth.isLoggedIn" class="flex min-h-screen bg-gray-950">
    <UpdateBanner />
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="sidebarCollapsed = !sidebarCollapsed"
    />
    <main
      class="flex-1 min-w-0 p-4 md:p-3 overflow-auto safe-pt-mobile h-screen md:h-[calc(100vh-1.5rem)]"
      style="padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px), var(--safe-bottom, 0px), 1rem)"
    >
      <router-view />
    </main>
  </div>
  <div
    v-else
    class="bg-gray-950 min-h-screen"
    style="padding-top: env(safe-area-inset-top, 0px); padding-bottom: max(env(safe-area-inset-bottom, 0px), var(--safe-area-inset-bottom, 0px), var(--safe-bottom, 0px), 1rem)"
  >
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import Sidebar from "./components/layout/Sidebar.vue";
import UpdateBanner from "./components/UpdateBanner.vue";
import { useVersionCheck } from "./services/versionCheck";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const sidebarCollapsed = ref(false);
const { start, stop } = useVersionCheck();

onMounted(() => {
  start();
});
onUnmounted(() => {
  stop();
});
</script>
