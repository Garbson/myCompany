const EVOLUTION_URL = process.env.EVOLUTION_URL || 'https://evolution.zlabs.com.br'
const EVOLUTION_TOKEN = process.env.EVOLUTION_TOKEN || '183b0825-a259-4806-87ae-8706165a838c'

function normalizePhone(raw) {
  if (!raw) return null
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  // se nao tiver codigo do pais, prefixa 55 (Brasil)
  return digits.length <= 11 ? `55${digits}` : digits
}

export async function sendWhatsApp(phone, text) {
  const number = normalizePhone(phone)
  if (!number) return { ok: false, error: 'phone vazio' }
  try {
    const res = await fetch(`${EVOLUTION_URL}/send/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_TOKEN,
      },
      body: JSON.stringify({ number, text }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.error || 'erro' }
    }
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}
