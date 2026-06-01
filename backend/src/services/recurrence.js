import pool from '../database.js'

// Reseta tarefas recorrentes pra status='todo' nos dias em que devem aparecer.
// Importante: SÓ reseta tarefas done cujo updated_at é ANTERIOR ao início
// de hoje (local TZ). Assim, se o user acaba de marcar como done hoje,
// o reset não desfaz isso — mesmo que o servidor reinicie (deploy, etc).

const TZ_OFFSET_MINUTES = -180 // America/Sao_Paulo (UTC-3) — sem DST

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

// Retorna o instante UTC equivalente a 00:00 do dia local atual.
// Ex: agora=2026-05-29 02:00 UTC (= 28/05 23:00 BRT) → retorna 28/05 03:00 UTC
//                                                               (00:00 BRT do dia 28).
function startOfTodayLocalAsUTC() {
  const now = new Date()
  const local = new Date(now.getTime() + TZ_OFFSET_MINUTES * 60 * 1000)
  local.setUTCHours(0, 0, 0, 0)
  return new Date(local.getTime() - TZ_OFFSET_MINUTES * 60 * 1000)
}

function toMysqlDateTime(d) {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function parseDays(str) {
  if (!str) return []
  return String(str)
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
}

export async function runRecurrenceReset() {
  const today = localDate()
  const dow = localDayOfWeek()
  const cutoff = toMysqlDateTime(startOfTodayLocalAsUTC())

  // Só pega tarefas recorrentes que estão done E que foram marcadas como
  // done antes do início do dia local atual.
  const [tasks] = await pool.query(
    `SELECT id, recurrence_days
     FROM tasks
     WHERE is_recurring = 1
       AND status = 'done'
       AND updated_at < ?`,
    [cutoff]
  )

  const idsToReset = []
  for (const t of tasks) {
    const days = parseDays(t.recurrence_days)
    // Sem dias selecionados → considera diária; senão, só se hoje está na lista
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
  console.log(`[recurrence] reset ${idsToReset.length} tarefa(s) recorrente(s) (${today}, dow=${dow})`)
  return { reset: idsToReset.length }
}

export function startRecurrenceLoop() {
  // Roda uma vez no startup e depois a cada hora. A query agora é segura
  // (filtra por updated_at < início do dia), então pode rodar várias vezes
  // sem efeitos colaterais.
  runRecurrenceReset().catch((e) => console.error('recurrence error', e))
  setInterval(() => {
    runRecurrenceReset().catch((e) => console.error('recurrence error', e))
  }, 60 * 60 * 1000)
  console.log('[recurrence] loop iniciado (reset diário de tarefas recorrentes)')
}
