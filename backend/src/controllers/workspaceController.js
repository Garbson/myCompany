import pool from '../database.js'

const TYPES = new Set(['task', 'note', 'project', 'flowchart'])
const ENTITY_META = {
  task: { table: 'tasks', title: 'title', scope: 'company_id' },
  note: { table: 'notes', title: 'title', scope: 'user_id' },
  project: { table: 'projects', title: 'name', scope: 'company_id' },
  flowchart: { table: 'flowcharts', title: 'title', scope: 'user_id' },
}

const SYSTEM_TEMPLATES = [
  {
    id: 'system-weekly',
    system: true,
    name: 'Planejamento semanal',
    description: 'Prioridades, compromissos e revisão da semana.',
    target_type: 'note',
    payload: {
      title: 'Planejamento semanal',
      content: noteDocument([
        ['heading', 'Prioridades da semana'],
        ['bulletList', ['Prioridade 1', 'Prioridade 2', 'Prioridade 3']],
        ['heading', 'Compromissos'],
        ['paragraph', 'Liste reuniões e prazos importantes.'],
        ['heading', 'Revisão'],
        ['paragraph', 'O que funcionou? O que precisa mudar?'],
      ]),
    },
  },
  {
    id: 'system-meeting',
    system: true,
    name: 'Ata de reunião',
    description: 'Pauta, decisões e próximos passos.',
    target_type: 'note',
    payload: {
      title: 'Reunião — nova ata',
      content: noteDocument([
        ['heading', 'Pauta'],
        ['paragraph', ''],
        ['heading', 'Decisões'],
        ['bulletList', ['']],
        ['heading', 'Próximos passos'],
        ['bulletList', ['']],
      ]),
    },
  },
  {
    id: 'system-software',
    system: true,
    name: 'Projeto de software',
    description: 'Projeto com objetivo, escopo e prioridade definidos.',
    target_type: 'project',
    payload: {
      name: 'Novo projeto de software',
      description: 'Objetivo:\n\nEscopo:\n\nCritérios de sucesso:',
      priority: 'high',
    },
  },
  {
    id: 'system-launch',
    system: true,
    name: 'Checklist de lançamento',
    description: 'Uma tarefa principal pronta para receber subtarefas.',
    target_type: 'task',
    payload: {
      title: 'Preparar lançamento',
      description: 'Revisar conteúdo, comunicação, responsáveis e validação final.',
      priority: 'high',
      difficulty: 'hard',
    },
  },
  {
    id: 'system-process',
    system: true,
    name: 'Mapeamento de processo',
    description: 'Fluxograma vazio com título e ponto de partida.',
    target_type: 'flowchart',
    payload: {
      title: 'Novo processo',
      data: {
        nodes: [
          { id: 'start-1', type: 'bpmn', position: { x: 120, y: 160 }, data: { kind: 'start', label: 'Início' } },
        ],
        edges: [],
      },
    },
  },
]

function noteDocument(blocks) {
  const content = blocks.map(([type, value]) => {
    if (type === 'heading') {
      return { type: 'heading', attrs: { level: 2 }, content: value ? [{ type: 'text', text: value }] : [] }
    }
    if (type === 'bulletList') {
      return {
        type: 'bulletList',
        content: value.map((text) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
        })),
      }
    }
    return { type: 'paragraph', content: value ? [{ type: 'text', text: value }] : [] }
  })
  return JSON.stringify({ type: 'doc', content })
}

function parsePayload(payload) {
  if (!payload) return {}
  if (typeof payload === 'object') return payload
  try { return JSON.parse(payload) } catch { return {} }
}

export async function listInbox(req, res) {
  const processed = req.query.processed === '1' ? 1 : 0
  const [rows] = await pool.query(
    `SELECT id, content, kind, processed, processed_type, processed_id, created_at, updated_at
     FROM inbox_items WHERE user_id = ? AND processed = ? ORDER BY created_at DESC`,
    [req.userId, processed]
  )
  res.json(rows)
}

export async function createInbox(req, res) {
  const content = String(req.body.content || '').trim()
  if (!content) return res.status(400).json({ error: 'Escreva algo para capturar' })
  const kind = ['capture', 'task', 'note'].includes(req.body.kind) ? req.body.kind : 'capture'
  const [result] = await pool.query(
    'INSERT INTO inbox_items (user_id, company_id, content, kind) VALUES (?, ?, ?, ?)',
    [req.userId, req.companyId || null, content.slice(0, 5000), kind]
  )
  const [rows] = await pool.query('SELECT * FROM inbox_items WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
}

export async function updateInbox(req, res) {
  const sets = []
  const values = []
  if (typeof req.body.content === 'string' && req.body.content.trim()) {
    sets.push('content = ?')
    values.push(req.body.content.trim().slice(0, 5000))
  }
  if (['capture', 'task', 'note'].includes(req.body.kind)) {
    sets.push('kind = ?')
    values.push(req.body.kind)
  }
  if (typeof req.body.processed === 'boolean' || req.body.processed === 0 || req.body.processed === 1) {
    sets.push('processed = ?')
    values.push(req.body.processed ? 1 : 0)
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(req.params.id, req.userId)
  await pool.query(`UPDATE inbox_items SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, values)
  const [rows] = await pool.query('SELECT * FROM inbox_items WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json(rows[0])
}

export async function deleteInbox(req, res) {
  await pool.query('DELETE FROM inbox_items WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
}

export async function convertInbox(req, res) {
  const targetType = req.body.target_type
  if (!['task', 'note'].includes(targetType)) {
    return res.status(400).json({ error: 'Conversão inválida' })
  }
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [items] = await conn.query(
      'SELECT * FROM inbox_items WHERE id = ? AND user_id = ? AND processed = 0 FOR UPDATE',
      [req.params.id, req.userId]
    )
    if (!items.length) {
      await conn.rollback()
      return res.status(404).json({ error: 'Captura não encontrada' })
    }
    const item = items[0]
    let result
    if (targetType === 'task') {
      const [created] = await conn.query(
        `INSERT INTO tasks
          (title, description, status, priority, difficulty, due_date, user_id, project_id, company_id)
         VALUES (?, ?, 'todo', ?, ?, ?, ?, ?, ?)`,
        [
          item.content.slice(0, 255),
          item.content.length > 255 ? item.content : null,
          req.body.priority || 'medium',
          req.body.difficulty || 'medium',
          req.body.due_date || null,
          req.userId,
          req.body.project_id || null,
          req.companyId,
        ]
      )
      result = { type: 'task', id: created.insertId }
    } else {
      const [created] = await conn.query(
        `INSERT INTO notes (user_id, company_id, title, content) VALUES (?, ?, ?, ?)`,
        [
          req.userId,
          req.companyId || null,
          item.content.split('\n')[0].slice(0, 255),
          noteDocument([['paragraph', item.content]]),
        ]
      )
      result = { type: 'note', id: created.insertId }
    }
    await conn.query(
      'UPDATE inbox_items SET processed = 1, processed_type = ?, processed_id = ? WHERE id = ?',
      [result.type, result.id, item.id]
    )
    await conn.commit()
    res.json(result)
  } catch (error) {
    await conn.rollback()
    console.error('[inbox convert]', error.message)
    res.status(500).json({ error: 'Falha ao organizar captura' })
  } finally {
    conn.release()
  }
}

export async function listEvents(req, res) {
  const from = req.query.from || '1900-01-01'
  const to = req.query.to || '2999-12-31'
  const [rows] = await pool.query(
    `SELECT id, title, description, DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(event_time, '%H:%i') AS event_time, color, created_at, updated_at
     FROM calendar_events
     WHERE user_id = ? AND event_date BETWEEN ? AND ?
     ORDER BY event_date, event_time IS NULL, event_time`,
    [req.userId, from, to]
  )
  res.json(rows)
}

export async function createEvent(req, res) {
  const title = String(req.body.title || '').trim()
  if (!title || !req.body.event_date) return res.status(400).json({ error: 'Título e data são obrigatórios' })
  const color = ['terra', 'olive', 'blue', 'amber'].includes(req.body.color) ? req.body.color : 'terra'
  const [result] = await pool.query(
    `INSERT INTO calendar_events (user_id, company_id, title, description, event_date, event_time, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [req.userId, req.companyId || null, title.slice(0, 255), req.body.description || null, req.body.event_date, req.body.event_time || null, color]
  )
  const [rows] = await pool.query(
    `SELECT id, title, description, DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(event_time, '%H:%i') AS event_time, color
     FROM calendar_events WHERE id = ?`,
    [result.insertId]
  )
  res.status(201).json(rows[0])
}

export async function updateEvent(req, res) {
  const allowed = ['title', 'description', 'event_date', 'event_time', 'color']
  const sets = []
  const values = []
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      sets.push(`${field} = ?`)
      values.push(req.body[field] || null)
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(req.params.id, req.userId)
  await pool.query(`UPDATE calendar_events SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, values)
  const [rows] = await pool.query(
    `SELECT id, title, description, DATE_FORMAT(event_date, '%Y-%m-%d') AS event_date,
            TIME_FORMAT(event_time, '%H:%i') AS event_time, color
     FROM calendar_events WHERE id = ? AND user_id = ?`,
    [req.params.id, req.userId]
  )
  res.json(rows[0])
}

export async function deleteEvent(req, res) {
  await pool.query('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
}

export async function listTemplates(req, res) {
  const [rows] = await pool.query(
    'SELECT id, name, description, target_type, payload, created_at FROM content_templates WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  )
  res.json([
    ...SYSTEM_TEMPLATES,
    ...rows.map((row) => ({ ...row, system: false, payload: parsePayload(row.payload) })),
  ])
}

export async function createTemplate(req, res) {
  if (!TYPES.has(req.body.target_type)) return res.status(400).json({ error: 'Tipo inválido' })
  const name = String(req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' })
  const [result] = await pool.query(
    `INSERT INTO content_templates (user_id, company_id, name, description, target_type, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.userId,
      req.companyId || null,
      name.slice(0, 120),
      String(req.body.description || '').slice(0, 255) || null,
      req.body.target_type,
      JSON.stringify(req.body.payload || {}),
    ]
  )
  const [rows] = await pool.query('SELECT * FROM content_templates WHERE id = ?', [result.insertId])
  res.status(201).json({ ...rows[0], system: false, payload: parsePayload(rows[0].payload) })
}

export async function deleteTemplate(req, res) {
  await pool.query('DELETE FROM content_templates WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
}

export async function applyTemplate(req, res) {
  let template
  if (String(req.params.id).startsWith('system-')) {
    template = SYSTEM_TEMPLATES.find((item) => item.id === req.params.id)
  } else {
    const [rows] = await pool.query(
      'SELECT target_type, payload FROM content_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    )
    if (rows.length) template = { target_type: rows[0].target_type, payload: parsePayload(rows[0].payload) }
  }
  if (!template) return res.status(404).json({ error: 'Template não encontrado' })
  const payload = { ...template.payload, ...(req.body.overrides || {}) }
  let result
  if (template.target_type === 'task') {
    const [created] = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, difficulty, due_date, user_id, project_id, company_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.title || 'Nova tarefa',
        payload.description || null,
        payload.status || 'todo',
        payload.priority || 'medium',
        payload.difficulty || 'medium',
        payload.due_date || null,
        req.userId,
        payload.project_id || null,
        req.companyId,
      ]
    )
    result = { type: 'task', id: created.insertId }
  } else if (template.target_type === 'note') {
    const [created] = await pool.query(
      'INSERT INTO notes (user_id, company_id, title, content) VALUES (?, ?, ?, ?)',
      [req.userId, req.companyId || null, payload.title || 'Nova anotação', payload.content || noteDocument([['paragraph', '']])]
    )
    result = { type: 'note', id: created.insertId }
  } else if (template.target_type === 'project') {
    const [created] = await pool.query(
      `INSERT INTO projects (name, description, priority, company_id) VALUES (?, ?, ?, ?)`,
      [payload.name || 'Novo projeto', payload.description || null, payload.priority || 'medium', req.companyId]
    )
    result = { type: 'project', id: created.insertId }
  } else {
    const [[{ maxPos }]] = await pool.query(
      'SELECT COALESCE(MAX(position), -1) AS maxPos FROM flowcharts WHERE user_id = ?',
      [req.userId]
    )
    const [created] = await pool.query(
      `INSERT INTO flowcharts (user_id, company_id, title, data, position) VALUES (?, ?, ?, ?, ?)`,
      [req.userId, req.companyId || null, payload.title || 'Novo fluxograma', JSON.stringify(payload.data || { nodes: [], edges: [] }), (maxPos ?? -1) + 1]
    )
    result = { type: 'flowchart', id: created.insertId }
  }
  res.status(201).json(result)
}

async function entityInfo(type, id, req) {
  const meta = ENTITY_META[type]
  if (!meta) return null
  const scopeValue = meta.scope === 'user_id' ? req.userId : req.companyId
  const [rows] = await pool.query(
    `SELECT id, ${meta.title} AS title FROM ${meta.table} WHERE id = ? AND ${meta.scope} = ?`,
    [id, scopeValue]
  )
  return rows[0] || null
}

export async function listRelations(req, res) {
  const { entityType, entityId } = req.params
  if (!TYPES.has(entityType)) return res.status(400).json({ error: 'Tipo inválido' })
  const [rows] = await pool.query(
    `SELECT * FROM entity_relations
     WHERE user_id = ? AND (
       (source_type = ? AND source_id = ?) OR
       (target_type = ? AND target_id = ?)
     ) ORDER BY created_at DESC`,
    [req.userId, entityType, entityId, entityType, entityId]
  )
  const relations = await Promise.all(rows.map(async (row) => {
    const sourceIsCurrent = row.source_type === entityType && Number(row.source_id) === Number(entityId)
    const type = sourceIsCurrent ? row.target_type : row.source_type
    const id = sourceIsCurrent ? row.target_id : row.source_id
    const info = await entityInfo(type, id, req)
    return { id: row.id, type, entity_id: id, title: info?.title || 'Item removido', label: row.label }
  }))
  res.json(relations)
}

export async function createRelation(req, res) {
  const { source_type, source_id, target_type, target_id, label } = req.body
  if (!TYPES.has(source_type) || !TYPES.has(target_type)) return res.status(400).json({ error: 'Tipo inválido' })
  if (source_type === target_type && Number(source_id) === Number(target_id)) {
    return res.status(400).json({ error: 'Escolha outro conteúdo' })
  }
  const [source, target] = await Promise.all([
    entityInfo(source_type, source_id, req),
    entityInfo(target_type, target_id, req),
  ])
  if (!source || !target) return res.status(404).json({ error: 'Conteúdo não encontrado' })
  try {
    const [result] = await pool.query(
      `INSERT INTO entity_relations
        (user_id, company_id, source_type, source_id, target_type, target_id, label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.userId, req.companyId || null, source_type, source_id, target_type, target_id, String(label || '').slice(0, 80) || null]
    )
    res.status(201).json({ id: result.insertId, type: target_type, entity_id: target_id, title: target.title, label: label || null })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Este conteúdo já está relacionado' })
    console.error('[relations create]', error.message)
    res.status(500).json({ error: 'Falha ao criar conexão' })
  }
}

export async function deleteRelation(req, res) {
  await pool.query('DELETE FROM entity_relations WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
}
