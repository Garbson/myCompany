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
    `SELECT c.id, c.task_id, c.user_id, c.body, c.created_at, u.name AS user_name, u.email AS user_email
     FROM task_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,
    [taskId]
  )
  res.json(rows)
}

export async function create(req, res) {
  const { taskId } = req.params
  const { body } = req.body
  if (!body?.trim()) return res.status(400).json({ error: 'Comentário vazio' })
  if (!(await ensureTaskBelongsToCompany(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [result] = await pool.query(
    'INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)',
    [taskId, req.userId, body.trim()]
  )
  const [rows] = await pool.query(
    `SELECT c.id, c.task_id, c.user_id, c.body, c.created_at, u.name AS user_name, u.email AS user_email
     FROM task_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?`,
    [result.insertId]
  )
  res.status(201).json(rows[0])
}

export async function remove(req, res) {
  const { id } = req.params
  const [result] = await pool.query(
    `DELETE c FROM task_comments c
     JOIN tasks t ON t.id = c.task_id
     WHERE c.id = ? AND t.company_id = ? AND c.user_id = ?`,
    [id, req.companyId, req.userId]
  )
  res.json({ success: result.affectedRows > 0 })
}
