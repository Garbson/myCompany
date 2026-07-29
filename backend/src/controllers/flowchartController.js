import pool from '../database.js'

function parseData(d) {
  if (!d) return { nodes: [], edges: [] }
  return typeof d === 'string' ? JSON.parse(d) : d
}

async function ensureOwnership(id, userId) {
  const [rows] = await pool.query('SELECT id FROM flowcharts WHERE id = ? AND user_id = ?', [id, userId])
  return rows.length > 0
}

// GET /flowcharts — lista todos (sem o data pesado)
export async function list(req, res) {
  const [rows] = await pool.query(
    `SELECT id, title, folder_id, position, updated_at
     FROM flowcharts WHERE user_id = ?
     ORDER BY folder_id IS NULL DESC, folder_id ASC, position ASC, id ASC`,
    [req.userId]
  )
  res.json(rows)
}

// GET /flowcharts/:id — conteúdo completo
export async function get(req, res) {
  const [rows] = await pool.query(
    'SELECT id, title, folder_id, position, data, updated_at FROM flowcharts WHERE id = ? AND user_id = ?',
    [req.params.id, req.userId]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Fluxograma não encontrado' })
  res.json({ ...rows[0], data: parseData(rows[0].data) })
}

// POST /flowcharts — cria { title?, folder_id? }
export async function create(req, res) {
  const title = (req.body.title || '').trim().slice(0, 255) || 'Sem título'
  const folderId = req.body.folder_id ?? null
  const [[{ maxPos }]] = await pool.query(
    'SELECT COALESCE(MAX(position), -1) AS maxPos FROM flowcharts WHERE user_id = ?',
    [req.userId]
  )
  const [result] = await pool.query(
    `INSERT INTO flowcharts (user_id, company_id, folder_id, title, data, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.userId, req.companyId || null, folderId, title, JSON.stringify({ nodes: [], edges: [] }), (maxPos ?? -1) + 1]
  )
  const [rows] = await pool.query(
    'SELECT id, title, folder_id, position, data, updated_at FROM flowcharts WHERE id = ?',
    [result.insertId]
  )
  res.status(201).json({ ...rows[0], data: parseData(rows[0].data) })
}

// PUT /flowcharts/:id — atualiza { title?, folder_id?, data?, position? }
export async function update(req, res) {
  if (!(await ensureOwnership(req.params.id, req.userId))) {
    return res.status(404).json({ error: 'Fluxograma não encontrado' })
  }
  const sets = []
  const values = []
  if (typeof req.body.title === 'string') {
    sets.push('title = ?')
    values.push(req.body.title.trim().slice(0, 255) || 'Sem título')
  }
  if ('folder_id' in req.body) {
    sets.push('folder_id = ?')
    values.push(req.body.folder_id === null ? null : Number(req.body.folder_id) || null)
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
  values.push(req.params.id)
  await pool.query(`UPDATE flowcharts SET ${sets.join(', ')} WHERE id = ?`, values)
  res.json({ success: true })
}

// DELETE /flowcharts/:id
export async function remove(req, res) {
  await pool.query('DELETE FROM flowcharts WHERE id = ? AND user_id = ?', [req.params.id, req.userId])
  res.json({ success: true })
}
