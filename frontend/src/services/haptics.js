let mod = null
let loaded = false

async function load() {
  if (loaded) return mod
  loaded = true
  if (!window.Capacitor?.isNativePlatform?.()) return null
  try {
    mod = await import('@capacitor/haptics')
  } catch {
    mod = null
  }
  return mod
}

export async function hapticLight() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.impact({ style: m.ImpactStyle.Light }) } catch {}
}

export async function hapticMedium() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.impact({ style: m.ImpactStyle.Medium }) } catch {}
}

export async function hapticHeavy() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.impact({ style: m.ImpactStyle.Heavy }) } catch {}
}

export async function hapticSuccess() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.notification({ type: m.NotificationType.Success }) } catch {}
}

export async function hapticWarning() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.notification({ type: m.NotificationType.Warning }) } catch {}
}

export async function hapticError() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.notification({ type: m.NotificationType.Error }) } catch {}
}

export async function hapticSelection() {
  const m = await load()
  if (!m) return
  try { await m.Haptics.selectionChanged() } catch {}
}
