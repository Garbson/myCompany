import pool from '../database.js'

export async function listFolders(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, position FROM flowchart_folders WHERE user_id = ? ORDER BY position ASC, id ASC`,
    [req.userId]
  )
  res.json(rows)
}

export async function createFolder(req, res) {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' })
  const [result] = await pool.query(
    `INSERT INTO flowchart_folders (user_id, company_id, name) VALUES (?, ?, ?)`,
    [req.userId, req.companyId || null, name.trim().slice(0, 255)]
  )
  const [rows] = await pool.query(`SELECT id, name, position FROM flowchart_folders WHERE id = ?`, [result.insertId])
  res.status(201).json(rows[0])
}

export async function updateFolder(req, res) {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Nome obrigatório' })
  await pool.query(
    `UPDATE flowchart_folders SET name = ? WHERE id = ? AND user_id = ?`,
    [name.trim().slice(0, 255), req.params.id, req.userId]
  )
  const [rows] = await pool.query(`SELECT id, name, position FROM flowchart_folders WHERE id = ?`, [req.params.id])
  res.json(rows[0])
}

export async function deleteFolder(req, res) {
  await pool.query(`DELETE FROM flowchart_folders WHERE id = ? AND user_id = ?`, [req.params.id, req.userId])
  res.json({ success: true })
}
