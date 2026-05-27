import { ref } from 'vue'

const APP_VERSION = '1.0.1'
const CHECK_INTERVAL = 15 * 60 * 1000

const updateAvailable = ref(false)
const updateMandatory = ref(false)
const updateInfo = ref(null)
const checking = ref(false)

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

async function check() {
  if (checking.value) return
  checking.value = true
  try {
    const r = await fetch('/version.json', { cache: 'no-cache' })
    const info = await r.json()
    updateInfo.value = info
    updateMandatory.value = compareVersions(info.minVersion, APP_VERSION) > 0
    updateAvailable.value = compareVersions(info.version, APP_VERSION) > 0
  } catch {
    // offline or server error — silently ignore
  } finally {
    checking.value = false
  }
}

let timer = null

export function useVersionCheck() {
  function start() {
    check()
    timer = setInterval(check, CHECK_INTERVAL)
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null }
  }

  return { updateAvailable, updateMandatory, updateInfo, checking, check, start, stop }
}
