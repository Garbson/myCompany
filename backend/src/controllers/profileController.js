import bcrypt from 'bcryptjs'
import pool from '../database.js'
import { sendTestReminder } from '../services/reminders.js'
import { presignUpload } from '../services/r2.js'

export async function me(req, res) {
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, avatar_url, notif_whatsapp, reminder_hour, created_at
     FROM users WHERE id = ?`,
    [req.userId]
  )
  if (rows.length === 0) return res.status(404).json({ error: 'Não encontrado' })
  res.json(rows[0])
}

export async function update(req, res) {
  const allowed = ['name', 'phone', 'avatar_url', 'notif_whatsapp', 'reminder_hour']
  const sets = []
  const values = []
  for (const f of allowed) {
    if (req.body[f] !== undefined) {
      sets.push(`${f} = ?`)
      values.push(req.body[f])
    }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(req.userId)
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values)
  const [rows] = await pool.query(
    `SELECT id, name, email, phone, avatar_url, notif_whatsapp, reminder_hour FROM users WHERE id = ?`,
    [req.userId]
  )
  res.json(rows[0])
}

export async function changePassword(req, res) {
  const { current, next } = req.body
  if (!current || !next) return res.status(400).json({ error: 'Senha atual e nova são obrigatórias' })
  if (String(next).length < 6) return res.status(400).json({ error: 'Senha nova precisa de pelo menos 6 caracteres' })

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.userId])
  if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' })
  const valid = await bcrypt.compare(current, rows[0].password_hash)
  if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' })

  const hash = await bcrypt.hash(next, 10)
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId])
  res.json({ success: true })
}

export async function testWhatsApp(req, res) {
  const r = await sendTestReminder(req.userId)
  if (!r.ok) return res.status(400).json(r)
  res.json(r)
}

export async function presignAvatar(req, res) {
  const { contentType } = req.body
  if (!contentType?.startsWith('image/')) {
    return res.status(400).json({ error: 'Apenas imagens' })
  }
  const ext = contentType.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'jpg'
  const key = `mycompany/avatars/${req.userId}/${Date.now()}.${ext}`
  const r = await presignUpload(key, contentType)
  res.json({ uploadUrl: r.uploadUrl, publicUrl: r.publicUrl, key })
}
