import { ref, computed, watch, watchEffect } from 'vue'

const STORAGE_KEY = 'mycompany:bg'
const STORAGE_PREFETCHED = 'mycompany:bg:prefetched'
const CACHE_NAME = 'mycompany-bg-v1'
const R2_BASE = 'https://pub-d87b59eac94a44af842b8f8c42993a68.r2.dev/mycompany/backgrounds'

export const BACKGROUNDS = [
  { id: 'none', label: 'Nenhum', src: null, poster: null },
  { id: 'space', label: 'Espaço', src: `${R2_BASE}/space.mp4` },
  { id: 'ondas', label: 'Ondas', src: `${R2_BASE}/ondas.mp4` },
  { id: 'fogueira', label: 'Fogueira', src: `${R2_BASE}/fogueira.mp4` },
  { id: 'eua', label: 'EUA', src: `${R2_BASE}/eua.mp4` },
  { id: 'japan', label: 'Japão', src: `${R2_BASE}/japan.mp4` },
]

const currentId = ref(localStorage.getItem(STORAGE_KEY) || 'none')

watch(currentId, (v) => {
  if (v) localStorage.setItem(STORAGE_KEY, v)
})

const current = computed(() => BACKGROUNDS.find((b) => b.id === currentId.value) || BACKGROUNDS[0])

function isWeb() {
  return !window.Capacitor?.isNativePlatform?.()
}

if (typeof document !== 'undefined') {
  watchEffect(() => {
    const active = isWeb() && !!current.value?.src
    document.documentElement.classList.toggle('has-video-bg', active)
  })
}

async function prefetchAll(onProgress) {
  if (!isWeb() || !('caches' in window)) return
  if (localStorage.getItem(STORAGE_PREFETCHED) === '1') return

  try {
    const cache = await caches.open(CACHE_NAME)
    const toFetch = BACKGROUNDS.filter((b) => b.src)
    let done = 0
    for (const bg of toFetch) {
      try {
        const hit = await cache.match(bg.src)
        if (!hit) {
          // R2 público não envia CORS — usamos no-cors e cacheamos a opaque response
          const res = await fetch(bg.src, { mode: 'no-cors', cache: 'force-cache' })
          if (res) await cache.put(bg.src, res.clone())
        }
      } catch {}
      done += 1
      onProgress?.(done, toFetch.length)
    }
    localStorage.setItem(STORAGE_PREFETCHED, '1')
  } catch {}
}

function setBackground(id) {
  if (!BACKGROUNDS.find((b) => b.id === id)) return
  currentId.value = id
}

export function useBackground() {
  return {
    backgrounds: BACKGROUNDS,
    currentId,
    current,
    setBackground,
    prefetchAll,
    isWeb,
  }
}
