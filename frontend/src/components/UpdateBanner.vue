<template>
  <Teleport to="body">
    <!-- Atualização opcional: banner no topo -->
    <div
      v-if="showBanner"
      class="fixed top-0 left-0 right-0 z-[100] bg-terra-500 text-ink-400 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xl shadow-paper ring-1 ring-[var(--paper-border)] backdrop-blur-xl"
      style="padding-top: calc(var(--safe-top) + 0.625rem)"
    >
      <p class="text-sm">Nova versão {{ updateInfo?.version }} disponível</p>
      <button
        @click="download"
        :disabled="downloading"
        class="shrink-0 bg-white text-blue-600 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-blue-50 transition disabled:opacity-60"
      >
        {{ downloading ? 'Abrindo…' : 'Atualizar' }}
      </button>
    </div>

    <!-- Atualização obrigatória: tela cheia bloqueante -->
    <div
      v-if="showBlock"
      class="fixed inset-0 z-[200] bg-[var(--paper-bg)]/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <div class="text-center max-w-sm glass-strong gradient-border rounded-2xl p-8">
        <img src="/logo.svg" alt="myCompany" class="w-16 h-16 mx-auto mb-6 rounded-xl" />
        <h2 class="text-ink-400 text-xl font-bold mb-2">Atualização necessária</h2>
        <p class="text-ink-100 text-sm mb-6">
          A versão {{ updateInfo?.minVersion }} é obrigatória.
          Atualize para continuar usando o app.
        </p>
        <button
          @click="download"
          :disabled="downloading"
          class="w-full bg-terra-500 text-ink-400 font-semibold py-3 rounded-xl hover:bg-blue-500 transition disabled:opacity-60"
        >
          {{ downloading ? 'Abrindo…' : 'Baixar atualização' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useVersionCheck } from '../services/versionCheck'

const { updateAvailable, updateMandatory, updateInfo } = useVersionCheck()

const showBanner = computed(() => updateAvailable.value && !updateMandatory.value)
const showBlock = computed(() => updateMandatory.value)
const downloading = ref(false)

async function download() {
  if (downloading.value) return
  downloading.value = true
  const url = updateInfo.value?.apkUrl || 'https://mycompany.zlabs.com.br/releases/myCompany.apk'
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url, windowName: '_system' })
    } else {
      window.open(url, '_blank', 'noopener')
    }
  } catch {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    downloading.value = false
  }
}
</script>
