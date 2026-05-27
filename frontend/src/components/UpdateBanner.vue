<template>
  <Teleport to="body">
    <!-- Atualização opcional: banner no topo -->
    <div
      v-if="showBanner"
      class="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg"
      style="padding-top: calc(env(safe-area-inset-top, 0px) + 0.625rem)"
    >
      <p class="text-sm">Nova versão {{ updateInfo?.version }} disponível</p>
      <button
        @click="download"
        class="shrink-0 bg-white text-blue-600 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition"
      >
        Atualizar
      </button>
    </div>

    <!-- Atualização obrigatória: tela cheia bloqueante -->
    <div
      v-if="showBlock"
      class="fixed inset-0 z-[200] bg-gray-950 flex items-center justify-center p-6"
    >
      <div class="text-center max-w-sm">
        <img src="/logo.svg" alt="myCompany" class="w-16 h-16 mx-auto mb-6 rounded-xl" />
        <h2 class="text-white text-xl font-bold mb-2">Atualização necessária</h2>
        <p class="text-gray-400 text-sm mb-6">
          A versão {{ updateInfo?.minVersion }} é obrigatória.
          Atualize para continuar usando o app.
        </p>
        <button
          @click="download"
          class="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-500 transition"
        >
          Baixar atualização
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useVersionCheck } from '../services/versionCheck'

const { updateAvailable, updateMandatory, updateInfo } = useVersionCheck()

const showBanner = computed(() => updateAvailable.value && !updateMandatory.value)
const showBlock = computed(() => updateMandatory.value)

function download() {
  const url = updateInfo.value?.apkUrl || 'https://mycompany.zlabs.com.br/releases/myCompany.apk'
  // Tenta abrir no navegador do sistema (Capacitor)
  const w = window.open(url, '_system')
  // Fallback: se bloqueado, cria link e clica
  if (!w || w.closed) {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    a.click()
  }
}
</script>
