<template>
  <div
    v-if="auth.isLoggedIn"
    class="flex h-screen overflow-hidden md:p-3 md:gap-3"
    :class="{ 'notebook-shell': !isFlowPage }"
  >
    <UpdateBanner />
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col h-[100dvh] md:h-full">
      <MobileHeader />
      <TabBar />
      <main
        class="flex-1 min-w-0 overflow-auto px-4 pt-3 md:px-6 md:pt-0 pb-[calc(var(--safe-bottom)+4.75rem)] md:pb-6"
        :class="{ 'organic-page': !isFlowPage }"
      >
        <router-view v-slot="{ Component }">
          <KeepAlive :include="tabsStore.keepAliveNames">
            <component :is="Component" />
          </KeepAlive>
        </router-view>
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
  <CommandPalette v-if="auth.isLoggedIn" />
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import Sidebar from "./components/layout/Sidebar.vue";
import MobileHeader from "./components/layout/MobileHeader.vue";
import BottomNav from "./components/layout/BottomNav.vue";
import TabBar from "./components/layout/TabBar.vue";
import { useTabsStore } from "./stores/tabs";
import UpdateBanner from "./components/UpdateBanner.vue";
import Toaster from "./components/ui/Toaster.vue";
import CommandPalette from "./components/CommandPalette.vue";
import { useVersionCheck } from "./services/versionCheck";
import { useAuthStore } from "./stores/auth";

const auth = useAuthStore();
const tabsStore = useTabsStore();
const { start, stop } = useVersionCheck();
const route = useRoute();
const isFlowPage = computed(() => route.path.startsWith("/fluxogramas"));

onMounted(() => {
  start();
  if (auth.isLoggedIn) {
    auth.refreshMe();
  }
});
onUnmounted(() => stop());
</script>
