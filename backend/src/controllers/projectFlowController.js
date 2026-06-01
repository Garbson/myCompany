import pool from '../database.js'

async function ensureProject(projectId, companyId) {
  const [rows] = await pool.query('SELECT id FROM projects WHERE id = ? AND company_id = ?', [projectId, companyId])
  return rows.length > 0
}

async function ensureTabBelongsToProject(tabId, projectId) {
  const [rows] = await pool.query(
    'SELECT id FROM project_flow_tabs WHERE id = ? AND project_id = ?',
    [tabId, projectId]
  )
  return rows.length > 0
}

function parseData(d) {
  if (!d) return { nodes: [], edges: [] }
  return typeof d === 'string' ? JSON.parse(d) : d
}

// ----- Compat: GET /projects/:projectId/flow → retorna primeira aba (legado) -----
export async function get(req, res) {
  const { projectId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const [rows] = await pool.query(
    'SELECT data, updated_at FROM project_flow_tabs WHERE project_id = ? ORDER BY position ASC, id ASC LIMIT 1',
    [projectId]
  )
  if (rows.length === 0) return res.json({ data: { nodes: [], edges: [] }, updated_at: null })
  res.json({ data: parseData(rows[0].data), updated_at: rows[0].updated_at })
}

// ----- Compat: PUT /projects/:projectId/flow → atualiza primeira aba (legado) -----
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
  const [rows] = await pool.query(
    'SELECT id FROM project_flow_tabs WHERE project_id = ? ORDER BY position ASC, id ASC LIMIT 1',
    [projectId]
  )
  if (rows.length === 0) {
    await pool.query(
      `INSERT INTO project_flow_tabs (project_id, title, position, data) VALUES (?, 'Principal', 0, ?)`,
      [projectId, json]
    )
  } else {
    await pool.query('UPDATE project_flow_tabs SET data = ? WHERE id = ?', [json, rows[0].id])
  }
  res.json({ success: true })
}

// ----- Múltiplas abas -----

// GET /projects/:projectId/flow-tabs  → lista todas as abas (sem o data, mais leve)
export async function listTabs(req, res) {
  const { projectId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const [rows] = await pool.query(
    'SELECT id, title, position, updated_at FROM project_flow_tabs WHERE project_id = ? ORDER BY position ASC, id ASC',
    [projectId]
  )
  // Garante pelo menos uma aba "Principal"
  if (rows.length === 0) {
    const [result] = await pool.query(
      `INSERT INTO project_flow_tabs (project_id, title, position, data) VALUES (?, 'Principal', 0, ?)`,
      [projectId, JSON.stringify({ nodes: [], edges: [] })]
    )
    return res.json([{ id: result.insertId, title: 'Principal', position: 0, updated_at: null }])
  }
  res.json(rows)
}

// GET /projects/:projectId/flow-tabs/:tabId  → conteúdo completo da aba
export async function getTab(req, res) {
  const { projectId, tabId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const [rows] = await pool.query(
    'SELECT id, title, position, data, updated_at FROM project_flow_tabs WHERE id = ? AND project_id = ?',
    [tabId, projectId]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Aba não encontrada' })
  res.json({ ...rows[0], data: parseData(rows[0].data) })
}

// POST /projects/:projectId/flow-tabs  → cria nova aba { title }
export async function createTab(req, res) {
  const { projectId } = req.params
  const { title } = req.body
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  const [[{ maxPos }]] = await pool.query(
    'SELECT COALESCE(MAX(position), -1) AS maxPos FROM project_flow_tabs WHERE project_id = ?',
    [projectId]
  )
  const position = (maxPos ?? -1) + 1
  const cleanTitle = (title || '').trim() || 'Nova aba'
  const [result] = await pool.query(
    `INSERT INTO project_flow_tabs (project_id, title, position, data) VALUES (?, ?, ?, ?)`,
    [projectId, cleanTitle.slice(0, 100), position, JSON.stringify({ nodes: [], edges: [] })]
  )
  res.status(201).json({ id: result.insertId, title: cleanTitle, position, data: { nodes: [], edges: [] } })
}

// PUT /projects/:projectId/flow-tabs/:tabId  → atualiza título e/ou data
export async function updateTab(req, res) {
  const { projectId, tabId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  if (!(await ensureTabBelongsToProject(tabId, projectId))) {
    return res.status(404).json({ error: 'Aba não encontrada' })
  }
  const sets = []
  const values = []
  if (typeof req.body.title === 'string') {
    sets.push('title = ?')
    values.push(req.body.title.trim().slice(0, 100) || 'Aba')
  }
  if (req.body.data && typeof req.body.data === 'object') {
    sets.push('data = ?')
    values.push(JSON.stringify(req.body.data))
  }
  if (typeof req.body.position === 'number') {
    sets.push('position = ?')
    values.push(req.body.position)
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(tabId)
  await pool.query(`UPDATE project_flow_tabs SET ${sets.join(', ')} WHERE id = ?`, values)
  res.json({ success: true })
}

// DELETE /projects/:projectId/flow-tabs/:tabId
export async function deleteTab(req, res) {
  const { projectId, tabId } = req.params
  if (!(await ensureProject(projectId, req.companyId))) {
    return res.status(404).json({ error: 'Projeto não encontrado' })
  }
  // Não deixa apagar se for a única aba
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM project_flow_tabs WHERE project_id = ?',
    [projectId]
  )
  if (total <= 1) return res.status(400).json({ error: 'Mantenha pelo menos uma aba' })
  await pool.query(
    'DELETE FROM project_flow_tabs WHERE id = ? AND project_id = ?',
    [tabId, projectId]
  )
  res.json({ success: true })
}
