import pool from '../database.js'

async function ensureProject(projectId, companyId) {
  const [rows] = await pool.query('SELECT id FROM projects WHERE id = ? AND company_id = ?', [projectId, companyId])
  return rows.length > 0
}

export async function get(req, res) {
  const { projectId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const [rows] = await pool.query('SELECT data, updated_at FROM project_flows WHERE project_id = ?', [projectId])
  if (rows.length === 0) return res.json({ data: { nodes: [], edges: [] }, updated_at: null })
  // mysql2 retorna JSON ja parseado quando coluna é JSON
  const data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data
  res.json({ data, updated_at: rows[0].updated_at })
}

export async function save(req, res) {
  const { projectId } = req.params
  const { data } = req.body
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'data invalido' })
  }
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const json = JSON.stringify(data)
  await pool.query(
    `INSERT INTO project_flows (project_id, data) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data)`,
    [projectId, json]
  )
  res.json({ success: true })
}
