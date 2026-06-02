import pool from '../database.js'
import { chatJson } from '../services/deepseek.js'

const SYSTEM_PROMPT = `Você é um assistente que extrai tarefas de mensagens curtas em português brasileiro.

Sempre responda com um JSON válido neste formato exato:
{
  "title": "string curta e clara, no infinitivo (ex: 'Enviar planilha de NF')",
  "description": "contexto adicional ou null",
  "priority": "low" | "medium" | "high",
  "difficulty": "easy" | "medium" | "hard",
  "due_date": "YYYY-MM-DD" | null,
  "project_id": número do projeto ou null,
  "confidence": 0.0 a 1.0,
  "reasoning": "frase curta explicando suas escolhas"
}

Regras:
- title: ação no infinitivo, sem pronome, máx 80 chars
- priority: "high" se o usuário disse "urgente", "alta", "asap" ou citou prazo curto; "low" se disse "quando puder", "baixa"; senão "medium"
- difficulty: "easy" pra coisas rápidas (ligações, envios); "hard" pra coisas longas (relatórios, módulos); senão "medium"
- due_date: interprete expressões temporais usando a data de hoje fornecida. "amanhã" = hoje+1, "sexta" = próxima sexta, etc. Se não houver prazo claro, null.
- project_id: só preencha se o texto cita claramente o NOME de um projeto da lista fornecida. Senão null.
- confidence: 1.0 quando você tem certeza; abaixo de 0.6 quando o texto é ambíguo
- reasoning: curto, em pt-br

NUNCA invente data. NUNCA invente project_id. Em dúvida, deixe null.`

function nextWeekdayDate(today, targetDow) {
  // targetDow: 0=dom..6=sáb
  const d = new Date(today)
  const diff = (targetDow - d.getDay() + 7) % 7 || 7 // pelo menos 1 dia à frente
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

function todayLocalDateBR() {
  const offsetMinutes = -180 // BRT
  const now = new Date()
  const local = new Date(now.getTime() + offsetMinutes * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export async function extractTask(req, res) {
  const { text } = req.body
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text obrigatório' })
  }

  // Contexto: projetos da company (ID + nome) — ajuda a IA escolher project_id
  const [projects] = await pool.query(
    `SELECT id, name FROM projects WHERE company_id = ? AND status = 'ativo' ORDER BY name`,
    [req.companyId]
  )
  const projectsContext = projects.length
    ? `Projetos disponíveis (use só se o texto citar claramente):\n${projects.map((p) => `- ${p.id}: ${p.name}`).join('\n')}`
    : 'Nenhum projeto cadastrado.'

  const today = todayLocalDateBR()
  const userPrompt = [
    `Hoje é ${today} (fuso America/Sao_Paulo).`,
    '',
    projectsContext,
    '',
    `Texto do usuário:\n"""${text.trim()}"""`,
  ].join('\n')

  try {
    const result = await chatJson({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      maxTokens: 600,
    })

    // Validações leves + sanity
    const out = {
      title: String(result.title || '').slice(0, 80) || null,
      description: result.description ? String(result.description) : null,
      priority: ['low', 'medium', 'high'].includes(result.priority) ? result.priority : 'medium',
      difficulty: ['easy', 'medium', 'hard'].includes(result.difficulty) ? result.difficulty : 'medium',
      due_date: typeof result.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(result.due_date) ? result.due_date : null,
      project_id: Number.isInteger(result.project_id) && projects.some((p) => p.id === result.project_id) ? result.project_id : null,
      confidence: typeof result.confidence === 'number' ? Math.max(0, Math.min(1, result.confidence)) : 0.5,
      reasoning: result.reasoning ? String(result.reasoning) : null,
    }

    if (!out.title) {
      return res.status(422).json({ error: 'Não foi possível extrair título da mensagem', raw: result })
    }

    res.json(out)
  } catch (e) {
    if (e.code === 'NO_KEY') return res.status(500).json({ error: 'DEEPSEEK_API_KEY não configurada no servidor' })
    console.error('[ai] extractTask error:', e.message)
    res.status(500).json({ error: 'Falha ao extrair tarefa', detail: e.message })
  }
}

// Atalho: extrai e já cria a tarefa
export async function createFromText(req, res) {
  const { text } = req.body
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text obrigatório' })
  }

  // Reusa a lógica de extração
  req.body = { text }
  let extracted = null
  const stubRes = {
    json: (data) => (extracted = { ok: true, data }),
    status(code) {
      this._code = code
      return {
        json: (data) => (extracted = { ok: false, code, data }),
      }
    },
  }
  await extractTask(req, stubRes)
  if (!extracted?.ok) {
    return res.status(extracted?.code || 500).json(extracted?.data || { error: 'falha' })
  }

  const t = extracted.data
  const [result] = await pool.query(
    `INSERT INTO tasks (title, description, status, priority, difficulty, due_date, user_id, project_id, company_id)
     VALUES (?, ?, 'todo', ?, ?, ?, ?, ?, ?)`,
    [t.title, t.description, t.priority, t.difficulty, t.due_date, req.userId, t.project_id, req.companyId]
  )
  const [rows] = await pool.query(
    `SELECT t.*, p.name AS project_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id WHERE t.id = ?`,
    [result.insertId]
  )
  res.status(201).json({ task: rows[0], extracted: t })
}
