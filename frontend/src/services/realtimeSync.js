const CLIENT_KEY = 'mypaper-client-id'

function makeClientId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const realtimeClientId = sessionStorage.getItem(CLIENT_KEY) || makeClientId()
sessionStorage.setItem(CLIENT_KEY, realtimeClientId)

let abortController = null
let reconnectTimer = null
let reconnectDelay = 1000

function emitStatus(status) {
  window.dispatchEvent(new CustomEvent('mypaper:sync-status', { detail: { status } }))
}

function parseEvent(block) {
  let event = 'message'
  const data = []
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) data.push(line.slice(5).trim())
  }
  if (!data.length) return null
  try {
    return { event, payload: JSON.parse(data.join('\n')) }
  } catch {
    return null
  }
}

async function connect(onRemoteChange) {
  const token = localStorage.getItem('token')
  if (!token || abortController) return

  abortController = new AbortController()
  const currentController = abortController

  try {
    const response = await fetch('/api/realtime/events', {
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'X-MyPaper-Client': realtimeClientId,
      },
      cache: 'no-store',
      signal: currentController.signal,
    })
    if (!response.ok || !response.body) throw new Error(`Realtime indisponível: ${response.status}`)

    reconnectDelay = 1000
    emitStatus('online')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        const parsed = parseEvent(block)
        if (parsed?.event !== 'sync') continue
        if (parsed.payload.clientId === realtimeClientId) continue
        onRemoteChange(parsed.payload)
        window.dispatchEvent(new CustomEvent('mypaper:remote-change', { detail: parsed.payload }))
      }
    }
    throw new Error('Conexão em tempo real encerrada')
  } catch (error) {
    if (error.name !== 'AbortError') {
      emitStatus('reconnecting')
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null
        connect(onRemoteChange)
      }, reconnectDelay)
      reconnectDelay = Math.min(reconnectDelay * 2, 15000)
    }
  } finally {
    if (abortController === currentController) abortController = null
  }
}

export function startRealtimeSync(onRemoteChange) {
  emitStatus('connecting')
  connect(onRemoteChange)
}

export function stopRealtimeSync() {
  if (reconnectTimer) window.clearTimeout(reconnectTimer)
  reconnectTimer = null
  abortController?.abort()
  abortController = null
  reconnectDelay = 1000
  emitStatus('offline')
}
