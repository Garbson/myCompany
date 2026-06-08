<template>
  <aside
    class="hidden md:flex shrink-0 w-56 h-full glass-strong gradient-border flex-col overflow-hidden rounded-2xl"
  >
    <!-- Logo -->
    <div class="px-4 py-4 flex items-center gap-2.5 border-b border-white/5">
      <img src="/logo.svg" alt="myCompany" class="w-8 h-8 shrink-0" />
      <h1 class="text-base font-bold text-white tracking-tight">myCompany</h1>
    </div>

    <!-- Menu -->
    <nav class="flex-1 p-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
      <template v-for="item in menu" :key="item.path || item.action">
        <!-- Item de ação (ex: Fundo) -->
        <button
          v-if="item.action"
          @click="handleAction(item.action)"
          class="group w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap"
        >
          <span class="shrink-0 flex items-center justify-center w-5 h-5 text-gray-500 group-hover:text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          <span class="font-medium">{{ item.label }}</span>
          <span v-if="item.action === 'bg' && currentBgId !== 'none'" class="ml-auto text-[10px] text-blue-400">●</span>
        </button>
        <!-- Item de rota -->
        <router-link
          v-else
          :to="item.path"
          class="group flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors whitespace-nowrap"
          :class="{
            'bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 hover:text-blue-300':
              isActive(item.path),
          }"
        >
          <span
            class="shrink-0 flex items-center justify-center w-5 h-5"
            :class="isActive(item.path) ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
            </svg>
          </span>
          <span class="font-medium">{{ item.label }}</span>
          <span
            v-if="isActive(item.path)"
            class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
          ></span>
        </router-link>
      </template>
    </nav>

    <!-- User -->
    <div class="p-3 border-t border-white/5 relative">
      <button
        @click="showMenu = !showMenu"
        class="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div
          class="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 overflow-hidden ring-1 ring-white/10"
        >
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="" class="w-full h-full object-cover" />
          <span v-else>{{ userInitial }}</span>
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-xs font-medium text-gray-200 truncate">{{ user?.name }}</p>
          <p class="text-[10px] text-gray-500 truncate">{{ user?.email }}</p>
        </div>
        <svg
          class="w-4 h-4 text-gray-500 shrink-0 transition-transform"
          :class="{ 'rotate-180': showMenu }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Popover menu -->
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
          class="absolute bottom-full left-3 right-3 mb-2 glass-strong rounded-xl overflow-hidden"
        >
          <button
            @click="confirmLogout"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair da conta
          </button>
        </div>
      </Transition>

      <p class="text-[9px] text-gray-600 text-center mt-2">{{ versionText }}</p>
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

  <BackgroundPicker :show="showBgPicker" @close="showBgPicker = false" />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import ConfirmDialog from "../ui/ConfirmDialog.vue";
import BackgroundPicker from "../BackgroundPicker.vue";
import { hapticLight } from "../../services/haptics";
import { useBackground } from "../../composables/useBackground";

const appVersion = ref("");
const showMenu = ref(false);
const showConfirm = ref(false);
const showBgPicker = ref(false);

const { currentId: currentBgId, isWeb } = useBackground();
const isWebPlatform = computed(() => isWeb());

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
  {
    path: "/",
    label: "Dashboard",
    icon: "M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10",
  },
  {
    path: "/tarefas",
    label: "Tarefas",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  {
    path: "/projetos",
    label: "Projetos",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    path: "/anotacoes",
    label: "Anotações",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    path: "/rotina",
    label: "Rotina",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    workOnly: true,
  },
  {
    path: "/leads",
    label: "Leads",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  {
    path: "/freelas",
    label: "Freelas",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/configuracoes",
    label: "Configurações",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

const bgMenuItem = {
  action: "bg",
  label: "Fundo",
  icon: "M3 5h18a0 0 0 010 0v14a0 0 0 010 0H3a0 0 0 010 0V5a0 0 0 010 0zM3 17l5-5 4 4 3-3 6 6M9 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
};

const menu = computed(() => {
  let items = workMode.value
    ? allMenu.filter((m) => !["/leads", "/freelas"].includes(m.path))
    : allMenu.filter((m) => !m.workOnly);
  // Insere "Fundo" antes de Configurações — só na web
  if (isWebPlatform.value) {
    const idx = items.findIndex((m) => m.path === "/configuracoes");
    if (idx >= 0) items.splice(idx, 0, bgMenuItem);
    else items.push(bgMenuItem);
  }
  return items;
});

function isActive(path) {
  if (path === "/") return route.path === "/";
  return route.path.startsWith(path);
}

function handleAction(action) {
  if (action === "bg") showBgPicker.value = true;
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
