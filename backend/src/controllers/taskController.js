import pool from '../database.js'

export async function list(req, res) {
  const { project_id } = req.query
  let query = `
    SELECT t.*, u.name as assigned_name, p.name as project_name,
      d.title as dependency_title, d.status as dependency_status
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN tasks d ON t.dependency_id = d.id
    WHERE t.company_id = ?
  `
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
  const { title, description, status, priority, difficulty, user_id, project_id, dependency_id } = req.body
  if (!title) {
    return res.status(400).json({ error: 'Título é obrigatório' })
  }
  // Prevent setting dependency on completed task
  if (dependency_id && status === 'done') {
    return res.status(400).json({ error: 'Não é possível concluir uma tarefa que depende de outra' })
  }
  const assignedTo = user_id || req.userId
  const [result] = await pool.query(
    'INSERT INTO tasks (title, description, status, priority, difficulty, user_id, project_id, dependency_id, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description || null, status || 'todo', priority || 'medium', difficulty || 'medium', assignedTo, project_id || null, dependency_id || null, req.companyId]
  )
  const [rows] = await pool.query(`
    SELECT t.*, u.name as assigned_name, p.name as project_name,
      d.title as dependency_title, d.status as dependency_status
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN tasks d ON t.dependency_id = d.id
    WHERE t.id = ?
  `, [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const { id } = req.params
  const fields = ['title', 'description', 'status', 'priority', 'difficulty', 'user_id', 'project_id', 'dependency_id']
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

  if (sets.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' })
  }

  values.push(id, req.companyId)
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, values)
  const [rows] = await pool.query(`
    SELECT t.*, u.name as assigned_name, p.name as project_name,
      d.title as dependency_title, d.status as dependency_status
    FROM tasks t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN tasks d ON t.dependency_id = d.id
    WHERE t.id = ?
  `, [id])
  res.json(rows[0])
}

export async function remove(req, res) {
  await pool.query('DELETE FROM tasks WHERE id = ? AND company_id = ?', [req.params.id, req.companyId])
  res.json({ success: true })
}
