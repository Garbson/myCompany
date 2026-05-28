import pool from '../database.js'

const TASK_SELECT = `
  SELECT t.id, t.title, t.description, t.status, t.priority, t.difficulty,
    DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
    t.user_id, t.project_id, t.dependency_id, t.company_id, t.created_at, t.updated_at,
    t.is_recurring, t.recurrence_days,
    u.name AS assigned_name, p.name AS project_name,
    d.title AS dependency_title, d.status AS dependency_status
  FROM tasks t
  LEFT JOIN users u ON t.user_id = u.id
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN tasks d ON t.dependency_id = d.id
`

// Aceita "1,3,5" ou array; normaliza pra CSV de dígitos 0-6
function normalizeRecurrenceDays(input) {
  if (input == null) return null
  const arr = Array.isArray(input) ? input : String(input).split(',')
  const clean = arr
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  return clean.length ? Array.from(new Set(clean)).sort().join(',') : null
}

export async function list(req, res) {
  const { project_id } = req.query
  let query = `${TASK_SELECT} WHERE t.company_id = ?`
  const params = [req.companyId]
  if (project_id) {
    query += ' AND t.project_id = ?'
    params.push(project_id)
  }
  query += ' ORDER BY FIELD(t.status, "done"), FIELD(t.difficulty, "easy", "medium", "hard"), t.created_at DESC'
  const [rows] = await pool.query(query, params)
  res.json(rows)
}

export async function create(req, res) {
  const { title, description, status, priority, difficulty, due_date, user_id, project_id, dependency_id, is_recurring, recurrence_days } = req.body
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' })
  }
  if (dependency_id && status === 'done') {
    return res.status(400).json({ error: 'Não é possível concluir uma tarefa que depende de outra' })
  }
  const assignedTo = user_id || req.userId
  const recurring = is_recurring ? 1 : 0
  const days = recurring ? normalizeRecurrenceDays(recurrence_days) : null
  const [result] = await pool.query(
    'INSERT INTO tasks (title, description, status, priority, difficulty, due_date, user_id, project_id, dependency_id, is_recurring, recurrence_days, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description || null, status || 'todo', priority || 'medium', difficulty || 'medium', due_date || null, assignedTo, project_id || null, dependency_id || null, recurring, days, req.companyId]
  )
  const [rows] = await pool.query(`${TASK_SELECT} WHERE t.id = ?`, [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const { id } = req.params
  const fields = ['title', 'description', 'status', 'priority', 'difficulty', 'due_date', 'user_id', 'project_id', 'dependency_id']
  const sets = []
  const values = []

  // If trying to complete, check dependency
  if (req.body.status === 'done') {
    const [deps] = await pool.query(
      'SELECT d.status FROM tasks t LEFT JOIN tasks d ON t.dependency_id = d.id WHERE t.id = ?',
      [id]
    )
    if (deps.length > 0 && deps[0].status && deps[0].status !== 'done') {
      return res.status(400).json({ error: 'Conclua a tarefa dependente primeiro' })
    }
  }

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`)
      values.push(f === 'dependency_id' && req.body[f] === null ? null : req.body[f])
    }
  })

  // is_recurring / recurrence_days (tratamento especial)
  if (req.body.is_recurring !== undefined) {
    const recurring = req.body.is_recurring ? 1 : 0
    sets.push('is_recurring = ?')
    values.push(recurring)
    // Se desligou recorrência, limpa os dias
    if (!recurring) {
      sets.push('recurrence_days = ?')
      values.push(null)
    }
  }
  if (req.body.recurrence_days !== undefined && (req.body.is_recurring === undefined || req.body.is_recurring)) {
    sets.push('recurrence_days = ?')
    values.push(normalizeRecurrenceDays(req.body.recurrence_days))
  }

  if (sets.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' })
  }

  values.push(id, req.companyId)
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, values)
  const [rows] = await pool.query(`${TASK_SELECT} WHERE t.id = ?`, [id])
  res.json(rows[0])
}

export async function remove(req, res) {
  await pool.query('DELETE FROM tasks WHERE id = ? AND company_id = ?', [req.params.id, req.companyId])
  res.json({ success: true })
}
