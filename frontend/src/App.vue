<template>
  <VideoBackground />
  <div v-if="auth.isLoggedIn" class="flex min-h-screen bg-transparent">
    <UpdateBanner />
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col h-[100dvh] md:h-[calc(100vh-1.5rem)]">
      <MobileHeader />
      <main
        class="flex-1 min-w-0 overflow-auto px-4 pt-3 md:px-6 md:pt-5 pb-[calc(var(--safe-bottom)+4.75rem)] md:pb-6"
      >
        <router-view />
      </main>
    </div>
    <BottomNav />
  </div>
  <div
    v-else
    class="bg-transparent min-h-screen"
    style="padding-top: var(--safe-top); padding-bottom: var(--safe-bottom)"
  >
    <router-view />
  </div>
  <Toaster />
</template>

<script setup>
import { onMounted, onUnmounted, watch } from "vue";
import Sidebar from "./components/layout/Sidebar.vue";
import MobileHeader from "./components/layout/MobileHeader.vue";
import BottomNav from "./components/layout/BottomNav.vue";
import UpdateBanner from "./components/UpdateBanner.vue";
import Toaster from "./components/ui/Toaster.vue";
import VideoBackground from "./components/VideoBackground.vue";
import { useVersionCheck } from "./services/versionCheck";
import { useAuthStore } from "./stores/auth";
import { useBackground } from "./composables/useBackground";

const auth = useAuthStore();
const { start, stop } = useVersionCheck();
const { prefetchAll, isWeb } = useBackground();

function maybePrefetch() {
  if (!isWeb()) return;
  // dispara após o app carregar; idle preferencial pra não brigar com a UI
  const run = () => prefetchAll();
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 2500);
  }
}

onMounted(() => {
  start();
  if (auth.isLoggedIn) maybePrefetch();
});
watch(
  () => auth.isLoggedIn,
  (v) => {
    if (v) maybePrefetch();
  }
);
onUnmounted(() => stop());
</script>
