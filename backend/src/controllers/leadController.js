import pool from '../database.js'

export async function list(req, res) {
  const [rows] = await pool.query('SELECT * FROM leads WHERE company_id = ? ORDER BY created_at DESC', [req.companyId])
  res.json(rows)
}

export async function create(req, res) {
  const { name, email, phone, company, status, notes, value_estimate, setup_value, monthly_fee, payment_type } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' })
  }
  const [result] = await pool.query(
    'INSERT INTO leads (name, email, phone, company, status, notes, value_estimate, setup_value, monthly_fee, payment_type, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, email || null, phone || null, company || null, status || 'novo', notes || null, value_estimate || 0, setup_value || 0, monthly_fee || 0, payment_type || 'pagamento_unico', req.companyId]
  )
  const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const { id } = req.params
  const fields = ['name', 'email', 'phone', 'company', 'status', 'notes', 'value_estimate', 'setup_value', 'monthly_fee', 'payment_type']
  const sets = []
  const values = []

  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`)
      values.push(req.body[f])
    }
  })

  if (sets.length === 0) {
    return res.status(400).json({ error: 'Nenhum campo para atualizar' })
  }

  values.push(id, req.companyId)
  await pool.query(`UPDATE leads SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, values)
  const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id])
  res.json(rows[0])
}

export async function remove(req, res) {
  await pool.query('DELETE FROM leads WHERE id = ? AND company_id = ?', [req.params.id, req.companyId])
  res.json({ success: true })
}
