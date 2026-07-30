const clientsByUser = new Map()

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export function subscribeToRealtime(req, res) {
  const userId = Number(req.userId)
  const clients = clientsByUser.get(userId) || new Set()

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()

  clients.add(res)
  clientsByUser.set(userId, clients)
  writeEvent(res, 'connected', { connected: true, at: new Date().toISOString() })

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${Date.now()}\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(res)
    if (clients.size === 0) clientsByUser.delete(userId)
  })
}

export function broadcastRealtime(userId, payload) {
  const clients = clientsByUser.get(Number(userId))
  if (!clients?.size) return

  for (const res of clients) {
    if (res.destroyed || res.writableEnded) {
      clients.delete(res)
      continue
    }
    writeEvent(res, 'sync', payload)
  }
}

export function realtimeMutationObserver(req, res, next) {
  const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
  if (!mutatingMethods.has(req.method)) return next()

  res.on('finish', () => {
    if (!req.userId || res.statusCode < 200 || res.statusCode >= 300) return

    broadcastRealtime(req.userId, {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      clientId: req.get('X-MyPaper-Client') || null,
      at: new Date().toISOString(),
    })
  })

  next()
}
