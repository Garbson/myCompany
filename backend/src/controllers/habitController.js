import pool from '../database.js'

const TZ_OFFSET_MINUTES = -180 // America/Sao_Paulo

function localToday() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

function localDayOfWeek() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  return local.getUTCDay() // 0=dom..6=sáb
}

function parseDays(str) {
  if (!str) return []
  return String(str).split(',').map((d) => parseInt(d, 10)).filter((d) => d >= 0 && d <= 6)
}

function normalizeDays(input) {
  if (input == null) return null
  const arr = Array.isArray(input) ? input : String(input).split(',')
  const clean = arr.map((d) => parseInt(d, 10)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  return clean.length ? Array.from(new Set(clean)).sort().join(',') : null
}

function shouldShowOnDay(habit, dow) {
  if (habit.frequency === 'daily') return true
  const days = parseDays(habit.recurrence_days)
  return days.length === 0 || days.includes(dow)
}

// streak = quantos dias-de-prática consecutivos foram completados, contando do
// último dia em que o hábito deveria ter sido feito.
async function calcStreak(habit) {
  // Pega completions dos últimos 120 dias
  const [rows] = await pool.query(
    `SELECT completion_date FROM habit_completions
     WHERE habit_id = ? AND completion_date >= DATE_SUB(CURDATE(), INTERVAL 120 DAY)
     ORDER BY completion_date DESC`,
    [habit.id]
  )
  const doneSet = new Set(rows.map((r) => r.completion_date))

  const days = parseDays(habit.recurrence_days)
  const todayStr = localToday()
  const today = new Date(todayStr + 'T00:00:00Z')

  // Caminha pra trás dia a dia
  let streak = 0
  let cursor = new Date(today)
  // Se hoje ainda não foi marcado, começa contagem do dia anterior pra streak vigente
  const skipFirstIfNotDone = !doneSet.has(todayStr)

  while (true) {
    const dow = cursor.getUTCDay()
    const dateStr = cursor.toISOString().slice(0, 10)
    const required = habit.frequency === 'daily' || days.length === 0 || days.includes(dow)

    if (!required) {
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      if (streak > 1000) break // safety
      continue
    }

    // Pula só o "hoje" se ainda não foi marcado — pra streak não zerar antes do fim do dia
    if (dateStr === todayStr && skipFirstIfNotDone) {
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      continue
    }

    if (doneSet.has(dateStr)) {
      streak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
    if (streak > 365) break
  }
  return streak
}

async function lastNDaysStats(habit, n = 30) {
  const [rows] = await pool.query(
    `SELECT completion_date FROM habit_completions
     WHERE habit_id = ? AND completion_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [habit.id, n]
  )
  const doneSet = new Set(rows.map((r) => r.completion_date))
  const days = parseDays(habit.recurrence_days)
  let required = 0
  let done = 0
  const today = new Date(localToday() + 'T00:00:00Z')
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const dow = d.getUTCDay()
    if (habit.frequency === 'daily' || days.length === 0 || days.includes(dow)) {
      required += 1
      if (doneSet.has(d.toISOString().slice(0, 10))) done += 1
    }
  }
  return { required, done, pct: required === 0 ? 0 : Math.round((done / required) * 100) }
}

const SELECT = `
  SELECT id, user_id, company_id, name, identity, frequency, recurrence_days,
         cue_time, cue_location, stack_after, temptation_bundle, two_minute_version,
         reward, archived, created_at, updated_at
  FROM habits
`

async function decorate(habit) {
  const streak = await calcStreak(habit)
  const stats30 = await lastNDaysStats(habit, 30)
  const [[done]] = await pool.query(
    `SELECT id FROM habit_completions WHERE habit_id = ? AND completion_date = ? LIMIT 1`,
    [habit.id, localToday()]
  )
  return {
    ...habit,
    streak,
    pct_30d: stats30.pct,
    done_30d: stats30.done,
    required_30d: stats30.required,
    completed_today: !!done?.id,
    show_today: shouldShowOnDay(habit, localDayOfWeek()),
  }
}

// === Handlers ===

export async function list(req, res) {
  const [rows] = await pool.query(
    `${SELECT} WHERE user_id = ? AND archived = 0 ORDER BY created_at DESC`,
    [req.userId]
  )
  const decorated = await Promise.all(rows.map(decorate))
  res.json(decorated)
}

export async function create(req, res) {
  const b = req.body || {}
  if (!b.name) return res.status(400).json({ error: 'Nome é obrigatório' })
  const days = b.frequency === 'specific_days' ? normalizeDays(b.recurrence_days) : null
  const [result] = await pool.query(
    `INSERT INTO habits
      (user_id, company_id, name, identity, frequency, recurrence_days,
       cue_time, cue_location, stack_after, temptation_bundle, two_minute_version, reward)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.userId, req.companyId || null,
      String(b.name).slice(0, 255),
      b.identity ? String(b.identity).slice(0, 255) : null,
      b.frequency === 'specific_days' ? 'specific_days' : 'daily',
      days,
      b.cue_time || null,
      b.cue_location ? String(b.cue_location).slice(0, 255) : null,
      b.stack_after ? String(b.stack_after).slice(0, 255) : null,
      b.temptation_bundle || null,
      b.two_minute_version ? String(b.two_minute_version).slice(0, 255) : null,
      b.reward || null,
    ]
  )
  const [[row]] = await pool.query(`${SELECT} WHERE id = ?`, [result.insertId])
  res.status(201).json(await decorate(row))
}

export async function update(req, res) {
  const b = req.body || {}
  const sets = []
  const values = []
  const fields = ['name', 'identity', 'frequency', 'cue_time', 'cue_location', 'stack_after', 'temptation_bundle', 'two_minute_version', 'reward']
  for (const f of fields) {
    if (b[f] !== undefined) {
      sets.push(`${f} = ?`)
      values.push(b[f] === '' ? null : b[f])
    }
  }
  if (b.recurrence_days !== undefined) {
    sets.push('recurrence_days = ?')
    values.push(b.frequency === 'specific_days' || b.frequency === undefined ? normalizeDays(b.recurrence_days) : null)
  }
  if (b.archived !== undefined) {
    sets.push('archived = ?')
    values.push(b.archived ? 1 : 0)
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nada para atualizar' })
  values.push(req.params.id, req.userId)
  await pool.query(`UPDATE habits SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, values)
  const [[row]] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id])
  res.json(await decorate(row))
}

export async function remove(req, res) {
  await pool.query(`DELETE FROM habits WHERE id = ? AND user_id = ?`, [req.params.id, req.userId])
  res.json({ success: true })
}

export async function complete(req, res) {
  const date = req.body?.date || localToday()
  try {
    await pool.query(
      `INSERT INTO habit_completions (habit_id, user_id, completion_date, note)
       VALUES (?, ?, ?, ?)`,
      [req.params.id, req.userId, date, req.body?.note || null]
    )
  } catch (e) {
    if (e.code !== 'ER_DUP_ENTRY') throw e
  }
  const [[row]] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id])
  if (!row) return res.status(404).json({ error: 'Hábito não encontrado' })
  res.json(await decorate(row))
}

export async function uncomplete(req, res) {
  const date = req.body?.date || req.query?.date || localToday()
  await pool.query(
    `DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completion_date = ?`,
    [req.params.id, req.userId, date]
  )
  const [[row]] = await pool.query(`${SELECT} WHERE id = ?`, [req.params.id])
  if (!row) return res.status(404).json({ error: 'Hábito não encontrado' })
  res.json(await decorate(row))
}
