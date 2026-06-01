import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../database.js'

async function getCompanyWorkMode(companyId) {
  if (!companyId) return 0
  const [rows] = await pool.query('SELECT work_mode FROM companies WHERE id = ?', [companyId])
  return rows[0]?.work_mode ? 1 : 0
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha obrigatórios' })
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Email ou senha inválidos' })
  }

  const user = rows[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Email ou senha inválidos' })
  }

  const work_mode = await getCompanyWorkMode(user.company_id)
  const token = jwt.sign({ id: user.id, company_id: user.company_id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, company_id: user.company_id, avatar_url: user.avatar_url, work_mode } })
}

export async function register(req, res) {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha obrigatórios' })
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Email já cadastrado' })
  }

  const hash = await bcrypt.hash(password, 10)
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, hash]
  )

  const token = jwt.sign({ id: result.insertId, company_id: null }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: { id: result.insertId, name, email, company_id: null } })
}

export async function me(req, res) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.company_id, u.avatar_url, u.created_at,
            COALESCE(c.work_mode, 0) AS work_mode
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = ?`,
    [req.userId]
  )
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Usuário não encontrado' })
  }
  res.json(rows[0])
}

export async function listUsers(req, res) {
  const [rows] = await pool.query('SELECT id, name, email FROM users WHERE company_id = ? ORDER BY name', [req.companyId])
  res.json(rows)
}
