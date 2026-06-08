import pool from '../database.js'

async function ensureTask(taskId, companyId) {
  const [rows] = await pool.query('SELECT id FROM tasks WHERE id = ? AND company_id = ?', [taskId, companyId])
  return rows.length > 0
}

async function ensureTabBelongsToTask(tabId, taskId) {
  const [rows] = await pool.query(
    'SELECT id FROM task_flow_tabs WHERE id = ? AND task_id = ?',
    [tabId, taskId]
  )
  return rows.length > 0
}

function parseData(d) {
  if (!d) return { nodes: [], edges: [] }
  return typeof d === 'string' ? JSON.parse(d) : d
}

// GET /tasks/:taskId/flow-tabs
export async function listTabs(req, res) {
  const { taskId } = req.params
  if (!(await ensureTask(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [rows] = await pool.query(
    'SELECT id, title, position, updated_at FROM task_flow_tabs WHERE task_id = ? ORDER BY position ASC, id ASC',
    [taskId]
  )
  if (rows.length === 0) {
    const [result] = await pool.query(
      `INSERT INTO task_flow_tabs (task_id, title, position, data) VALUES (?, 'Principal', 0, ?)`,
      [taskId, JSON.stringify({ nodes: [], edges: [] })]
    )
    return res.json([{ id: result.insertId, title: 'Principal', position: 0, updated_at: null }])
  }
  res.json(rows)
}

// GET /tasks/:taskId/flow-tabs/:tabId
export async function getTab(req, res) {
  const { taskId, tabId } = req.params
  if (!(await ensureTask(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [rows] = await pool.query(
    'SELECT id, title, position, data, updated_at FROM task_flow_tabs WHERE id = ? AND task_id = ?',
    [tabId, taskId]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Aba não encontrada' })
  res.json({ ...rows[0], data: parseData(rows[0].data) })
}

// POST /tasks/:taskId/flow-tabs
export async function createTab(req, res) {
  const { taskId } = req.params
  const { title } = req.body
  if (!(await ensureTask(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [[{ maxPos }]] = await pool.query(
    'SELECT COALESCE(MAX(position), -1) AS maxPos FROM task_flow_tabs WHERE task_id = ?',
    [taskId]
  )
  const position = (maxPos ?? -1) + 1
  const cleanTitle = (title || '').trim() || 'Nova aba'
  const [result] = await pool.query(
    `INSERT INTO task_flow_tabs (task_id, title, position, data) VALUES (?, ?, ?, ?)`,
    [taskId, cleanTitle.slice(0, 100), position, JSON.stringify({ nodes: [], edges: [] })]
  )
  res.status(201).json({ id: result.insertId, title: cleanTitle, position, data: { nodes: [], edges: [] } })
}

// PUT /tasks/:taskId/flow-tabs/:tabId
export async function updateTab(req, res) {
  const { taskId, tabId } = req.params
  if (!(await ensureTask(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  if (!(await ensureTabBelongsToTask(tabId, taskId))) {
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
  await pool.query(`UPDATE task_flow_tabs SET ${sets.join(', ')} WHERE id = ?`, values)
  res.json({ success: true })
}

// DELETE /tasks/:taskId/flow-tabs/:tabId
export async function deleteTab(req, res) {
  const { taskId, tabId } = req.params
  if (!(await ensureTask(taskId, req.companyId))) {
    return res.status(404).json({ error: 'Tarefa não encontrada' })
  }
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM task_flow_tabs WHERE task_id = ?',
    [taskId]
  )
  if (total <= 1) return res.status(400).json({ error: 'Mantenha pelo menos uma aba' })
  await pool.query(
    'DELETE FROM task_flow_tabs WHERE id = ? AND task_id = ?',
    [tabId, taskId]
  )
  res.json({ success: true })
}
