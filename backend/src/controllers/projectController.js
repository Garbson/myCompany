import pool from '../database.js'

function cid(req) { return req.companyId }

export async function list(req, res) {
  const [rows] = await pool.query(`
    SELECT p.*, l.name as lead_name, l.company as lead_company,
      COALESCE(SUM(pay.amount), 0) as total_paid
    FROM projects p
    LEFT JOIN leads l ON p.lead_id = l.id
    LEFT JOIN payments pay ON pay.project_id = p.id AND pay.status = 'pago'
    WHERE p.company_id = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `, [cid(req)])
  res.json(rows)
}

export async function create(req, res) {
  const { name, description, lead_id, total_value, setup_value, entry_value, entry_date, installments, monthly_fee, monthly_cycle, annual_installments, payment_type, start_date, end_date, is_freela } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' })
  }
  const [result] = await pool.query(
    'INSERT INTO projects (name, description, lead_id, total_value, setup_value, entry_value, entry_date, installments, monthly_fee, monthly_cycle, annual_installments, payment_type, start_date, end_date, is_freela, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description || null, lead_id || null, total_value || 0, setup_value || 0, entry_value || 0, entry_date || null, installments || 1, monthly_fee || 0, monthly_cycle || 'mensal', annual_installments || 1, payment_type || 'pagamento_unico', start_date || null, end_date || null, is_freela ? 1 : 0, cid(req)]
  )
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
}

export async function update(req, res) {
  const { id } = req.params
  const fields = ['name', 'description', 'lead_id', 'total_value', 'setup_value', 'entry_value', 'entry_date', 'installments', 'monthly_fee', 'monthly_cycle', 'annual_installments', 'payment_type', 'start_date', 'end_date', 'status', 'is_freela']
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

  values.push(id, cid(req))
  await pool.query(`UPDATE projects SET ${sets.join(', ')} WHERE id = ? AND company_id = ?`, values)
  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id])
  res.json(rows[0])
}

export async function remove(req, res) {
  await pool.query('DELETE FROM projects WHERE id = ? AND company_id = ?', [req.params.id, cid(req)])
  res.json({ success: true })
}

export async function getPayments(req, res) {
  const [rows] = await pool.query(
    'SELECT * FROM payments WHERE project_id = ? ORDER BY due_date ASC',
    [req.params.id]
  )
  res.json(rows)
}

export async function addPayment(req, res) {
  const { amount, due_date, installment_number, notes } = req.body
  if (!amount || !due_date) {
    return res.status(400).json({ error: 'Valor e data de vencimento obrigatórios' })
  }
  const [result] = await pool.query(
    'INSERT INTO payments (project_id, amount, due_date, installment_number, notes) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, amount, due_date, installment_number || 1, notes || null]
  )
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [result.insertId])
  res.status(201).json(rows[0])
}

export async function payInstallment(req, res) {
  const { id } = req.params
  await pool.query(
    "UPDATE payments SET status = 'pago', paid_at = CURDATE() WHERE id = ?",
    [id]
  )
  const [rows] = await pool.query('SELECT * FROM payments WHERE id = ?', [id])
  res.json(rows[0])
}
