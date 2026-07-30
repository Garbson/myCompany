import { onBeforeUnmount, onMounted } from 'vue'

export function useRealtimeRefresh(refresh, pathPrefixes = []) {
  let timer = null

  function onRemoteChange(event) {
    const path = event.detail?.path || ''
    if (pathPrefixes.length && !pathPrefixes.some((prefix) => path.startsWith(prefix))) return
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      Promise.resolve(refresh(event.detail)).catch(() => {})
    }, 120)
  }

  onMounted(() => window.addEventListener('mypaper:remote-change', onRemoteChange))
  onBeforeUnmount(() => {
    window.removeEventListener('mypaper:remote-change', onRemoteChange)
    if (timer) window.clearTimeout(timer)
  })
}
