<template>
  <div
    v-if="auth.isLoggedIn"
    class="notebook-shell flex h-screen overflow-hidden md:p-3 md:gap-3"
  >
    <UpdateBanner />
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col h-[100dvh] md:h-full">
      <MobileHeader />
      <TabBar />
      <main
        class="organic-page flex-1 min-w-0 overflow-auto px-4 pt-3 md:px-6 md:pt-0 pb-[calc(var(--safe-bottom)+4.75rem)] md:pb-6"
      >
        <router-view v-slot="{ Component }">
          <KeepAlive :include="tabsStore.keepAliveNames">
            <component :is="Component" />
          </KeepAlive>
        </router-view>
      </main>
    </div>
    <BottomNav />
    <QuickCapture />
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
import { onMounted, onUnmounted, watch } from "vue";
import Sidebar from "./components/layout/Sidebar.vue";
import MobileHeader from "./components/layout/MobileHeader.vue";
import BottomNav from "./components/layout/BottomNav.vue";
import TabBar from "./components/layout/TabBar.vue";
import { useTabsStore } from "./stores/tabs";
import UpdateBanner from "./components/UpdateBanner.vue";
import Toaster from "./components/ui/Toaster.vue";
import CommandPalette from "./components/CommandPalette.vue";
import QuickCapture from "./components/QuickCapture.vue";
import { useVersionCheck } from "./services/versionCheck";
import { useAuthStore } from "./stores/auth";
import { useTaskStore } from "./stores/tasks";
import { useProjectStore } from "./stores/projects";
import { useDashboardStore } from "./stores/dashboard";
import { useLeadStore } from "./stores/leads";
import { startRealtimeSync, stopRealtimeSync } from "./services/realtimeSync";

const auth = useAuthStore();
const tabsStore = useTabsStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const dashboardStore = useDashboardStore();
const leadStore = useLeadStore();
const { start, stop } = useVersionCheck();

let syncTimer = null;
const pendingSyncPaths = new Set();
function refreshSharedData(change) {
  pendingSyncPaths.add(change?.path || "");
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    const paths = [...pendingSyncPaths];
    pendingSyncPaths.clear();
    const refreshes = [];
    const matches = (prefix) => paths.some((path) => path.startsWith(prefix));
    const broadWorkspaceChange = matches("/api/workspace/inbox/") || matches("/api/workspace/templates/");

    if (matches("/api/tasks") || matches("/api/subtasks") || matches("/api/comments") || broadWorkspaceChange) {
      refreshes.push(taskStore.fetch());
    }
    if (matches("/api/projects") || broadWorkspaceChange) refreshes.push(projectStore.fetch());
    if (matches("/api/leads")) refreshes.push(leadStore.fetch());
    if (
      matches("/api/tasks") ||
      matches("/api/projects") ||
      matches("/api/leads") ||
      broadWorkspaceChange
    ) {
      refreshes.push(dashboardStore.fetch());
    }
    if (matches("/api/auth/profile")) refreshes.push(auth.refreshMe());
    Promise.allSettled(refreshes);
  }, 150);
}

function startAccountSync() {
  if (!auth.isLoggedIn) return;
  startRealtimeSync(refreshSharedData);
}

onMounted(() => {
  start();
  if (auth.isLoggedIn) {
    auth.refreshMe();
    startAccountSync();
  }
});
watch(() => auth.isLoggedIn, (loggedIn) => {
  if (loggedIn) startAccountSync();
  else stopRealtimeSync();
});
onUnmounted(() => {
  stop();
  stopRealtimeSync();
  if (syncTimer) window.clearTimeout(syncTimer);
});
</script>
