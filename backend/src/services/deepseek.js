// Cliente mínimo da DeepSeek API (compatível com OpenAI Chat Completions).
// Usa fetch nativo do Node 18+. Suporta `response_format: json_object`
// pra forçar saída JSON válida.

const BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'

function getKey() {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) {
    const err = new Error('DEEPSEEK_API_KEY não configurada')
    err.code = 'NO_KEY'
    throw err
  }
  return key
}

export async function chat({ messages, model = DEFAULT_MODEL, temperature = 0.2, jsonMode = false, maxTokens = 1024 }) {
  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }
  if (jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`DeepSeek ${res.status}: ${text.slice(0, 300)}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function chatJson(opts) {
  const raw = await chat({ ...opts, jsonMode: true })
  try {
    return JSON.parse(raw)
  } catch (e) {
    const err = new Error('Resposta da DeepSeek não é JSON válido')
    err.raw = raw
    throw err
  }
}
