import pool from '../database.js'

async function ensureTaskBelongsToCompany(taskId, companyId) {
  const [rows] = await pool.query('SELECT id FROM tasks WHERE id = ? AND company_id = ?', [taskId, companyId])
  return rows.length > 0
}

export async function listByTask(req, res) {
  const { taskId } = req.params
  if (!(await ensureTaskBelongsToCompany(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [rows] = await pool.query(
    'SELECT id, task_id, title, is_done, position, created_at FROM subtasks WHERE task_id = ? ORDER BY position ASC, id ASC',
    [taskId]
  )
  res.json(rows)
}

export async function create(req, res) {
  const { taskId } = req.params
  const { title } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'Título é obrigatório' })
  if (!(await ensureTaskBelongsToCompany(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [posRow] = await pool.query('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM subtasks WHERE task_id = ?', [taskId])
  const [result] = await pool.query(
    'INSERT INTO subtasks (task_id, title, position) VALUES (?, ?, ?)',
    [taskId, title.trim(), posRow[0].next]
  )
  const [rows] = await pool.query('SELECT id, task_id, title, is_done, position, created_at FROM subtasks WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const { id } = req.params
  const [own] = await pool.query(
    'SELECT s.id FROM subtasks s JOIN tasks t ON t.id = s.task_id WHERE s.id = ? AND t.company_id = ?',
    [id, req.companyId]
  )
  if (own.length === 0) return res.status(404).json({ error: 'Subtarefa não encontrada' })

  const fields = ['title', 'is_done', 'position']
  const sets = []
  const values = []
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`)
      values.push(req.body[f])
    }
  })
  if (sets.length === 0) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(id)
  await pool.query(`UPDATE subtasks SET ${sets.join(', ')} WHERE id = ?`, values)
  const [rows] = await pool.query('SELECT id, task_id, title, is_done, position, created_at FROM subtasks WHERE id = ?', [id])
  res.json(rows[0])
}

export async function remove(req, res) {
  const { id } = req.params
  const [result] = await pool.query(
    'DELETE s FROM subtasks s JOIN tasks t ON t.id = s.task_id WHERE s.id = ? AND t.company_id = ?',
    [id, req.companyId]
  )
  res.json({ success: result.affectedRows > 0 })
}
