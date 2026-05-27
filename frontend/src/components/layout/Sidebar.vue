<template>
  <!-- Mobile overlay -->
  <div
    v-if="!collapsed"
    class="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
    @click="$emit('toggle')"
  ></div>

  <!-- Sidebar flutuante -->
  <aside
    class="fixed md:sticky inset-y-0 left-0 z-50 md:m-3 bg-gray-900 border border-gray-800 flex flex-col transition-all duration-300 ease-in-out overflow-hidden shadow-lg shadow-black/20"
    :class="[
      collapsed ? '-translate-x-full md:translate-x-0 md:w-14' : 'w-52',
      collapsed ? 'md:rounded-2xl' : 'md:rounded-2xl',
    ]"
    style="
      top: env(safe-area-inset-top, 0px);
      height: 100dvh;
      height: 100vh;
      padding-bottom: max(
        env(safe-area-inset-bottom, 0px),
        var(--safe-bottom, 0px),
        0.5rem
      );
    "
  >
    @mouseenter="onHover(true)" @mouseleave="onHover(false)" >
    <!-- Logo -->
    <div
      class="px-2.5 py-3 border-b border-gray-800 flex items-center gap-2 min-h-[56px]"
    >
      <img src="/logo.svg" alt="myCompany" class="w-8 h-8 shrink-0" />
      <div
        class="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
        :class="sidebarCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'"
      >
        <h1 class="text-base font-bold text-white">myCompany</h1>
      </div>
    </div>

    <!-- Menu -->
    <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
      <router-link
        v-for="item in menu"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-200 whitespace-nowrap overflow-hidden"
        :class="{ 'bg-gray-800 text-white': isActive(item.path) }"
      >
        <span class="text-base shrink-0 flex items-center justify-center w-4">{{
          item.icon
        }}</span>
        <span
          class="text-[13px] transition-all duration-300 ease-in-out"
          :class="
            sidebarCompact
              ? 'opacity-0 -translate-x-2'
              : 'opacity-100 translate-x-0'
          "
          >{{ item.label }}</span
        >
      </router-link>
    </nav>

    <!-- Version tag -->
    <div
      class="px-3 pb-2 border-t border-gray-800 pt-2"
      :class="sidebarCompact ? 'hidden' : ''"
    >
      <p class="text-[9px] text-gray-600 text-center">{{ versionText }}</p>
    </div>

    <!-- User -->
    <div class="p-3 border-t border-gray-800">
      <div
        class="overflow-hidden whitespace-nowrap"
        :class="sidebarCompact ? 'flex justify-center' : 'px-1'"
      >
        <div
          class="flex items-center gap-2"
          :class="sidebarCompact ? '' : 'mb-2'"
        >
          <div
            class="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
          >
            {{ userInitial }}
          </div>
          <div
            class="flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden"
            :class="sidebarCompact ? 'w-0 opacity-0' : 'w-auto opacity-100'"
          >
            <p class="text-xs font-medium text-gray-300 truncate">
              {{ user?.name }}
            </p>
          </div>
        </div>
        <div
          class="flex items-center gap-2 transition-all duration-300 ease-in-out overflow-hidden"
          :class="sidebarCompact ? 'w-0 opacity-0 h-0' : 'w-auto opacity-100'"
        >
          <p class="text-[10px] text-gray-500 truncate flex-1 min-w-0">
            {{ user?.email }}
          </p>
          <button
            @click="logout"
            class="text-gray-500 hover:text-red-400 shrink-0 transition-colors duration-200"
            title="Sair"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile toggle -->
  <button
    @click="$emit('toggle')"
    class="fixed z-30 md:hidden bg-gray-900 border border-gray-700 text-gray-400 p-1.5 rounded-lg hover:text-white transition-colors"
    style="
      top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
      left: calc(env(safe-area-inset-left, 0px) + 0.75rem);
    "
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        v-if="collapsed"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 6h16M4 12h16M4 18h16"
      />
      <path
        v-else
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const appVersion = ref("");

onMounted(async () => {
  try {
    const r = await fetch("/version.json", { cache: "no-cache" });
    const d = await r.json();
    const isNative = !!window.Capacitor?.isNativePlatform?.();
    appVersion.value = isNative ? `app v${d.version}` : `web v${d.version}`;
  } catch {
    appVersion.value = "v1.0.3";
  }
});

const versionText = computed(() => appVersion.value);

const props = defineProps({ collapsed: Boolean });
const emit = defineEmits(["toggle"]);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);

const hovered = ref(false);
const sidebarCompact = computed(() => props.collapsed && !hovered.value);

const isGarbson = computed(
  () => user.value?.email === "garbsonsouza@gmail.com",
);

const allMenu = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/tarefas", label: "Tarefas", icon: "✅" },
  { path: "/projetos", label: "Projetos", icon: "📋" },
  { path: "/leads", label: "Leads", icon: "👥" },
  { path: "/freelas", label: "Freelas", icon: "💰" },
];

const menu = computed(() => {
  if (isGarbson.value)
    return allMenu.filter((m) => !["/leads", "/freelas"].includes(m.path));
  return allMenu;
});

function isActive(path) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function onHover(state) {
  if (props.collapsed) hovered.value = state;
}

const userInitial = computed(
  () => user.value?.name?.charAt(0)?.toUpperCase() || "?",
);

function logout() {
  auth.logout();
  router.push("/login");
}
</script>
