<template>
  <aside
    class="notebook-sidebar hidden md:flex shrink-0 h-full flex-col overflow-hidden transition-[width] duration-200"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Brand + toggle -->
    <div
      class="pt-5 pb-4 flex items-center border-b border-[var(--paper-border)] relative"
      :class="collapsed ? 'px-3 justify-center' : 'px-5 gap-3'"
    >
      <PageLogo />
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <h1 class="font-serif text-lg font-semibold text-ink-400 tracking-tight leading-none">myPaper</h1>
        <p class="text-[10px] text-ink-50 mt-1 uppercase tracking-widest">meu caderno</p>
      </div>
      <button
        v-if="!collapsed"
        @click="toggleCollapsed"
        class="shrink-0 p-1 rounded-md text-ink-50 hover:text-ink-300 hover:bg-[var(--paper-surface-3)] transition-colors"
        title="Encolher sidebar"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Toggle discreto no modo colapsado (aparece no hover) -->
    <button
      v-if="collapsed"
      @click="toggleCollapsed"
      class="mx-2 mt-2 mb-1 flex items-center justify-center h-8 rounded-md text-ink-50 hover:text-ink-300 hover:bg-[var(--paper-surface-3)] transition-colors"
      title="Expandir sidebar"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>

    <!-- Busca (atalho pro Command Palette) -->
    <button
      @click="openPalette"
      class="mt-3 mb-1 flex items-center rounded-lg bg-[var(--paper-surface-2)] border border-[var(--paper-border)] text-ink-100 hover:text-ink-300 hover:border-[var(--paper-border-strong)] transition-colors group"
      :class="collapsed ? 'mx-2 h-9 justify-center' : 'mx-3 gap-2 px-3 py-1.5'"
      title="Buscar (⌘K)"
    >
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
      </svg>
      <template v-if="!collapsed">
        <span class="text-[12px] flex-1 text-left">Buscar…</span>
        <kbd class="text-[10px] font-mono bg-[var(--paper-surface-3)] border border-[var(--paper-border)] rounded px-1.5 py-0 text-ink-50 group-hover:text-ink-200 transition-colors">⌘K</kbd>
      </template>
    </button>

    <!-- Menu -->
    <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-slim">
      <template v-for="item in menu" :key="item.path">
        <router-link
          :to="item.path"
          class="group flex items-center rounded-lg text-[13px] text-ink-100 hover:bg-[var(--paper-surface-3)] hover:text-ink-400 transition-colors whitespace-nowrap relative"
          :class="[
            collapsed ? 'h-9 justify-center' : 'gap-3 px-3 py-2',
            { 'bg-[var(--paper-surface-3)] text-ink-400 font-semibold': isActive(item.path) }
          ]"
          :title="collapsed ? item.label : null"
        >
          <span
            class="shrink-0 flex items-center justify-center w-4 h-4"
            :class="isActive(item.path) ? 'text-terra-500' : 'text-ink-50 group-hover:text-ink-200'"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          <span v-if="!collapsed" class="font-medium">{{ item.label }}</span>
          <span
            v-if="!collapsed && isActive(item.path)"
            class="ml-auto w-1 h-4 rounded-sm bg-terra-500"
          ></span>
          <!-- Barra ativa lateral quando colapsado -->
          <span
            v-if="collapsed && isActive(item.path)"
            class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-terra-500"
          ></span>
        </router-link>
      </template>
    </nav>

    <!-- User -->
    <div class="p-2 border-t border-[var(--paper-border)] relative">
      <button
        @click="showMenu = !showMenu"
        class="w-full flex items-center rounded-lg hover:bg-[var(--paper-surface-3)] transition-colors"
        :class="collapsed ? 'h-11 justify-center' : 'gap-2.5 p-2'"
        :title="collapsed ? `${user?.name} — clique pra opções` : null"
      >
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden ring-1 ring-[var(--paper-border-strong)]"
          style="background: linear-gradient(135deg, #6B7A3F, #2C4A5C); color: #FDFBF5;"
        >
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="w-full h-full object-cover" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <template v-if="!collapsed">
          <div class="flex-1 min-w-0 text-left">
            <p class="text-xs font-semibold text-ink-400 truncate">{{ user?.name }}</p>
            <p class="text-[10px] text-ink-50 truncate">{{ user?.email }}</p>
          </div>
          <svg
            class="w-3.5 h-3.5 text-ink-50 shrink-0 transition-transform"
            :class="{ 'rotate-180': showMenu }"
            fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </template>
      </button>

      <!-- Popover menu (funciona nos dois modos, ancorado no botão) -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showMenu"
          class="absolute bottom-full mb-2 paper-strong rounded-xl overflow-hidden shadow-paper-lg"
          :class="collapsed ? 'left-full ml-2 w-44 bottom-2' : 'left-3 right-3'"
        >
          <button
            @click="confirmLogout"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-terra-600 hover:bg-terra-500/10 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </div>
      </Transition>

      <p v-if="!collapsed" class="text-[9px] text-ink-50 text-center mt-2 font-mono">{{ versionText }}</p>
    </div>

    <!-- Click outside catcher -->
    <div
      v-if="showMenu"
      class="fixed inset-0 z-[-1]"
      @click="showMenu = false"
    ></div>
  </aside>

  <ConfirmDialog
    :show="showConfirm"
    title="Sair da conta?"
    message="Você precisará fazer login novamente."
    confirm-label="Sair"
    danger
    @confirm="doLogout"
    @cancel="showConfirm = false"
  />

</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import ConfirmDialog from "../ui/ConfirmDialog.vue";
import PageLogo from "../brand/PageLogo.vue";
import { hapticLight } from "../../services/haptics";
import { useCommandPalette } from "../../composables/useCommandPalette";

const appVersion = ref("");
const showMenu = ref(false);
const showConfirm = ref(false);
const { show: openPalette } = useCommandPalette();

// Sidebar colapsada (persistida)
const collapsed = ref(localStorage.getItem('sidebar:collapsed') === '1');
watch(collapsed, (v) => {
  localStorage.setItem('sidebar:collapsed', v ? '1' : '0');
});
function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  hapticLight();
}

onMounted(async () => {
  try {
    const r = await fetch("/version.json", { cache: "no-cache" });
    const d = await r.json();
    const isNative = !!window.Capacitor?.isNativePlatform?.();
    appVersion.value = isNative ? `app v${d.version}` : `web v${d.version}`;
  } catch {
    appVersion.value = "";
  }
});

const versionText = computed(() => appVersion.value);

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const user = computed(() => auth.user);

const workMode = computed(() => !!auth.workMode);

const allMenu = [
  { path: "/", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" },
  { path: "/tarefas", label: "Tarefas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { path: "/projetos", label: "Projetos", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { path: "/anotacoes", label: "Anotações", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { path: "/fluxogramas", label: "Fluxogramas", icon: "M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" },
  { path: "/leads", label: "Leads", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { path: "/freelas", label: "Freelas", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { path: "/configuracoes", label: "Configurações", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

const menu = computed(() => {
  return workMode.value
    ? allMenu.filter((m) => !["/leads", "/freelas"].includes(m.path))
    : allMenu.filter((m) => !m.workOnly);
});

function isActive(path) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

const userInitial = computed(
  () => user.value?.name?.charAt(0)?.toUpperCase() || "?",
);

function confirmLogout() {
  showMenu.value = false;
  showConfirm.value = true;
  hapticLight();
}

function doLogout() {
  showConfirm.value = false;
  auth.logout();
  router.push("/login");
}
</script>
