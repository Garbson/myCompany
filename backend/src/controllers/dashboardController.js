import pool from '../database.js'

export async function summary(req, res) {
  const cid = req.companyId
  const [tasks] = await pool.query(`SELECT status, COUNT(*) as count FROM tasks WHERE company_id = ? GROUP BY status`, [cid])
  const [leads] = await pool.query(`SELECT status, COUNT(*) as count FROM leads WHERE company_id = ? AND status != 'perdido' GROUP BY status`, [cid])

  // Recebido este mês (soma dos pagamentos marcados como pago este mês)
  const [received] = await pool.query(`
    SELECT COALESCE(SUM(pay.amount), 0) as total FROM payments pay
    JOIN projects p ON p.id = pay.project_id
    WHERE pay.status = 'pago' AND p.company_id = ?
    AND MONTH(pay.paid_at) = MONTH(CURDATE()) AND YEAR(pay.paid_at) = YEAR(CURDATE())
  `, [cid])

  // Total recebido de todos os tempos
  const [totalReceived] = await pool.query(`
    SELECT COALESCE(SUM(pay.amount), 0) as total FROM payments pay
    JOIN projects p ON p.id = pay.project_id
    WHERE pay.status = 'pago' AND p.company_id = ?
  `, [cid])

  // Projetos ativos com o total pago
  const [projects] = await pool.query(`
    SELECT p.*, COALESCE(SUM(pay.amount), 0) as total_paid
    FROM projects p
    LEFT JOIN payments pay ON pay.project_id = p.id AND pay.status = 'pago'
    WHERE p.status = 'ativo' AND p.company_id = ?
    GROUP BY p.id
  `, [cid])

  // Calcula totais
  let totalPending = 0
  let setupPending = 0
  let monthlyRecurring = 0
  let annualRecurring = 0
  let annualCount = 0
  let activeCount = projects.length

  projects.forEach(p => {
    const totalVal = Number(p.total_value) || 0
    const setupVal = Number(p.setup_value) || 0
    const monthlyVal = Number(p.monthly_fee) || 0
    const paid = Number(p.total_paid) || 0
    const projectTotal = setupVal + totalVal

    // Pendente do projeto (valores únicos)
    if (projectTotal > paid) {
      totalPending += projectTotal - paid
    }

    // Setup pendente
    if (setupVal > 0) {
      setupPending += Math.max(0, setupVal - paid)
    }

    // Recorrentes
    if (monthlyVal > 0 && p.monthly_cycle === 'mensal') {
      monthlyRecurring += monthlyVal
    }
    if (monthlyVal > 0 && p.monthly_cycle === 'anual') {
      annualRecurring += monthlyVal
      annualCount++
    }
  })

  // Projeção 6 meses: parcelas agendadas + mensalidades
  const [scheduled] = await pool.query(`
    SELECT DATE_FORMAT(pay.due_date, '%Y-%m') as month, SUM(pay.amount) as total
    FROM payments pay
    JOIN projects p ON p.id = pay.project_id
    WHERE pay.status IN ('pendente', 'atrasado')
      AND p.company_id = ?
      AND pay.due_date < DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(pay.due_date, '%Y-%m')
  `, [cid])

  const projection = {}
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    projection[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
  }

  scheduled.forEach(s => {
    if (projection[s.month] !== undefined) projection[s.month] += Number(s.total)
  })

  // Adiciona mensalidades em cada mês
  Object.keys(projection).forEach(month => {
    projection[month] += monthlyRecurring
  })

  // Distribui anuidades
  projects.forEach(p => {
    if (Number(p.monthly_fee) > 0 && p.monthly_cycle === 'anual') {
      const start = p.start_date ? new Date(p.start_date + 'T00:00:00') : new Date()
      const installments = Number(p.annual_installments) || 1
      const annualVal = Number(p.monthly_fee)
      for (let inst = 0; inst < installments; inst++) {
        const due = new Date(start)
        due.setMonth(due.getMonth() + Math.round((12 / installments) * inst))
        const key = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}`
        if (projection[key] !== undefined) {
          projection[key] += annualVal / installments
        }
      }
    }
  })

  const monthlyProjection = Object.entries(projection).map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }))

  res.json({
    tasks: {
      todo: tasks.find(t => t.status === 'todo')?.count || 0,
      in_progress: tasks.find(t => t.status === 'in_progress')?.count || 0,
      done: tasks.find(t => t.status === 'done')?.count || 0
    },
    leads: {
      novo: leads.find(l => l.status === 'novo')?.count || 0,
      contato: leads.find(l => l.status === 'contato')?.count || 0,
      negociando: leads.find(l => l.status === 'negociando')?.count || 0,
      ganho: leads.find(l => l.status === 'ganho')?.count || 0
    },
    finance: {
      receivedThisMonth: Number(received[0].total),
      totalReceived: Number(totalReceived[0].total),
      totalPending: Math.round(totalPending * 100) / 100,
      setupPending: Math.round(setupPending * 100) / 100,
      monthlyRecurring,
      annualRecurring,
      annualCount,
      activeProjects: activeCount,
      monthlyProjection
    }
  })
}
