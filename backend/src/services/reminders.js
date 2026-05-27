import pool from '../database.js'
import { sendWhatsApp } from './whatsapp.js'

const TZ_OFFSET_MINUTES = -180 // America/Sao_Paulo (UTC-3) — sem DST

let lastRunKey = null

function localHour() {
  const now = new Date()
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const local = (utcMinutes + TZ_OFFSET_MINUTES + 24 * 60) % (24 * 60)
  return Math.floor(local / 60)
}

function dateKey() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

function formatMessage(user, tasks) {
  const lines = []
  lines.push(`Bom dia, ${user.name?.split(' ')[0] || 'amigo'}! 👋`)
  lines.push('')
  lines.push(`Você tem ${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'} para entregar hoje:`)
  lines.push('')
  tasks.forEach((t) => {
    const diff = { easy: '🟢', medium: '🟡', hard: '🔴' }[t.difficulty] || '⚪'
    const proj = t.project_name ? ` _(${t.project_name})_` : ''
    lines.push(`${diff} *${t.title}*${proj}`)
  })
  lines.push('')
  lines.push('🚀 Vamos lá! Bora fechar essa lista.')
  return lines.join('\n')
}

async function getTodayTasksForUser(userId) {
  const [rows] = await pool.query(
    `SELECT t.id, t.title, t.difficulty, t.due_date, p.name AS project_name
     FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.user_id = ? AND t.status != 'done' AND t.due_date = CURDATE()
     ORDER BY FIELD(t.difficulty, 'easy', 'medium', 'hard'), t.id`,
    [userId]
  )
  return rows
}

export async function runReminderCheck({ force = false } = {}) {
  const hour = localHour()
  const day = dateKey()
  const key = `${day}-${hour}`
  if (!force && lastRunKey === key) return { skipped: true, reason: 'already ran this hour' }
  lastRunKey = key

  const [users] = await pool.query(
    `SELECT id, name, phone, reminder_hour FROM users
     WHERE notif_whatsapp = 1 AND phone IS NOT NULL AND phone <> '' AND reminder_hour = ?`,
    [hour]
  )

  const results = []
  for (const user of users) {
    const tasks = await getTodayTasksForUser(user.id)
    if (tasks.length === 0) {
      results.push({ user_id: user.id, sent: false, reason: 'sem tarefas hoje' })
      continue
    }
    const msg = formatMessage(user, tasks)
    const r = await sendWhatsApp(user.phone, msg)
    results.push({ user_id: user.id, sent: r.ok, error: r.error || null, count: tasks.length })
  }
  return { hour, day, processed: users.length, results }
}

export async function sendTestReminder(userId) {
  const [rows] = await pool.query(
    `SELECT id, name, phone FROM users WHERE id = ?`,
    [userId]
  )
  if (rows.length === 0) return { ok: false, error: 'usuário não encontrado' }
  const user = rows[0]
  if (!user.phone) return { ok: false, error: 'cadastre um telefone primeiro' }
  const tasks = await getTodayTasksForUser(userId)
  const msg = tasks.length === 0
    ? `Olá, ${user.name?.split(' ')[0] || 'amigo'}! 👋\n\nEsse é um teste do lembrete de tarefas do *myCompany*. Quando você tiver uma tarefa com data de entrega para hoje, eu te aviso! 🚀`
    : formatMessage(user, tasks)
  return await sendWhatsApp(user.phone, msg)
}

export function startReminderLoop() {
  setInterval(() => {
    runReminderCheck().catch((e) => console.error('reminder error', e))
  }, 60 * 1000)
  console.log('[reminders] loop iniciado (TZ America/Sao_Paulo)')
}
