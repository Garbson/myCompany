import pool from '../database.js'

const SELECT = `
  SELECT id, user_id, company_id, folder_id, title, content, created_at, updated_at
  FROM notes
`

export async function list(req, res) {
  const [rows] = await pool.query(
    `${SELECT} WHERE user_id = ? ORDER BY updated_at DESC`,
    [req.userId]
  )
  res.json(rows)
}

export async function get(req, res) {
  const [rows] = await pool.query(
    `${SELECT} WHERE id = ? AND user_id = ?`,
    [req.params.id, req.userId]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Anotação não encontrada' })
  res.json(rows[0])
}

export async function create(req, res) {
  const { title, content, folder_id } = req.body
  const [result] = await pool.query(
    `INSERT INTO notes (user_id, company_id, folder_id, title, content) VALUES (?, ?, ?, ?, ?)`,
    [req.userId, req.companyId || null, folder_id || null, (title || '').slice(0, 255), content || '']
  )
  const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const sets = []
  const values = []
  if (typeof req.body.title === 'string') {
    sets.push('title = ?')
    values.push(req.body.title.slice(0, 255))
  }
  if (typeof req.body.content === 'string') {
    sets.push('content = ?')
    values.push(req.body.content)
  }
  if ('folder_id' in req.body) {
    sets.push('folder_id = ?')
    values.push(req.body.folder_id || null)
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(req.params.id, req.userId)
  await pool.query(
    `UPDATE notes SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  )
  const [rows] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id])
  res.json(rows[0])
}

export async function remove(req, res) {
  await pool.query(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [req.params.id, req.userId])
  res.json({ success: true })
}
