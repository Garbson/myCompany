import pool from '../database.js'

// Reseta tarefas recorrentes pra status='todo' no início de cada novo dia,
// caso o dia da semana atual esteja em recurrence_days (ou se a tarefa
// não tem dias específicos — aí é considerada diária).

const TZ_OFFSET_MINUTES = -180 // America/Sao_Paulo (UTC-3) — sem DST

let lastRunDate = null

function localDate() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  return local.toISOString().slice(0, 10) // YYYY-MM-DD
}

function localDayOfWeek() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  return local.getUTCDay() // 0=dom ... 6=sáb
}

function parseDays(str) {
  if (!str) return []
  return String(str)
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
}

export async function runRecurrenceReset({ force = false } = {}) {
  const today = localDate()
  if (!force && lastRunDate === today) {
    return { skipped: true, reason: 'já rodou hoje' }
  }
  lastRunDate = today

  const dow = localDayOfWeek()
  const [tasks] = await pool.query(
    `SELECT id, recurrence_days FROM tasks
     WHERE is_recurring = 1 AND status = 'done'`
  )

  const idsToReset = []
  for (const t of tasks) {
    const days = parseDays(t.recurrence_days)
    // Sem dias selecionados: considera diária; senão, só se hoje está na lista
    if (days.length === 0 || days.includes(dow)) {
      idsToReset.push(t.id)
    }
  }

  if (idsToReset.length === 0) {
    return { reset: 0 }
  }

  await pool.query(
    `UPDATE tasks SET status = 'todo' WHERE id IN (?)`,
    [idsToReset]
  )
  console.log(`[recurrence] reset ${idsToReset.length} tarefa(s) para hoje (${today}, dow=${dow})`)
  return { reset: idsToReset.length }
}

export function startRecurrenceLoop() {
  // Roda imediatamente e depois a cada hora — `lastRunDate` evita duplicação
  runRecurrenceReset().catch((e) => console.error('recurrence error', e))
  setInterval(() => {
    runRecurrenceReset().catch((e) => console.error('recurrence error', e))
  }, 60 * 60 * 1000)
  console.log('[recurrence] loop iniciado (reset diário de tarefas recorrentes)')
}
