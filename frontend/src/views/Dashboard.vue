<template>
  <div v-if="workMode" class="dashboard-notebook">
    <header class="dashboard-heading">
      <div>
        <span class="eyebrow">{{ todayLabel }}</span>
        <h1>{{ greeting }}, {{ firstName }}.</h1>
        <p>Abra o caderno e escolha o que merece sua atenção hoje.</p>
      </div>
      <div class="notebook-clock" aria-label="Horário atual">{{ clock.now }}</div>
    </header>

    <div class="dashboard-canvas">
      <section class="dashboard-main">
        <div class="quote-note">
          <span class="paper-tape" aria-hidden="true"></span>
          <p>“{{ currentQuote.text }}”</p>
          <small>— {{ currentQuote.author }}</small>
        </div>

        <div class="stat-strip" aria-label="Resumo das tarefas">
          <div><strong>{{ taskStore.tasks.length }}</strong><span>anotadas</span></div>
          <i></i>
          <div><strong>{{ tasksByStatus.todo }}</strong><span>a fazer</span></div>
          <i></i>
          <div><strong>{{ tasksByStatus.in_progress }}</strong><span>em curso</span></div>
          <i></i>
          <div class="stat-done"><strong>{{ tasksByStatus.done }}</strong><span>concluídas</span></div>
        </div>

        <section class="ruled-sheet">
          <div class="sheet-title">
            <div>
              <span class="eyebrow">Minha lista</span>
              <h2>Próximas tarefas</h2>
            </div>
            <span class="hand-note">{{ completionPct }}% feito</span>
          </div>
          <div class="task-lines">
            <button
              v-for="task in nextTasks"
              :key="task.id"
              class="task-line"
              type="button"
              @click="editTask(task)"
            >
              <span class="check-circle" :class="{ active: task.status === 'in_progress' }"></span>
              <span class="task-copy">
                <strong>{{ task.title }}</strong>
                <small>
                  {{ difficultyLabel(task.difficulty) }}
                  <template v-if="task.project_name"> · {{ task.project_name }}</template>
                  <template v-if="task.due_date"> · {{ shortDate(task.due_date) }}</template>
                </small>
              </span>
              <span class="task-status" :class="`status-${task.status}`">{{ statusLabel(task.status) }}</span>
            </button>
            <p v-if="nextTasks.length === 0" class="empty-note">Tudo em dia. Que sensação boa.</p>
          </div>
        </section>

        <section class="progress-sheet">
          <div class="sheet-title compact">
            <div>
              <span class="eyebrow">Ritmo da semana</span>
              <h2>Como as coisas estão andando</h2>
            </div>
          </div>
          <div class="progress-list">
            <div v-for="s in statusBars" :key="s.key" class="progress-row">
              <span>{{ s.label }}</span>
              <div class="pencil-track"><i :class="s.barColor" :style="{ width: s.pct + '%' }"></i></div>
              <strong>{{ s.count }}</strong>
            </div>
          </div>
          <div class="difficulty-note">
            <span><i class="dot easy"></i>{{ tasksByDifficulty.easy }} fáceis</span>
            <span><i class="dot medium"></i>{{ tasksByDifficulty.medium }} médias</span>
            <span><i class="dot hard"></i>{{ tasksByDifficulty.hard }} difíceis</span>
          </div>
        </section>
      </section>

      <aside class="calendar-sheet">
        <span class="binder-hole hole-one" aria-hidden="true"></span>
        <span class="binder-hole hole-two" aria-hidden="true"></span>
        <div class="calendar-head">
          <div>
            <span class="eyebrow">Agenda</span>
            <h2>{{ calendarMonthLabel }}</h2>
          </div>
          <div class="calendar-nav">
            <button type="button" @click="changeMonth(-1)" aria-label="Mês anterior">←</button>
            <button type="button" @click="goToToday">hoje</button>
            <button type="button" @click="changeMonth(1)" aria-label="Próximo mês">→</button>
          </div>
        </div>
        <div class="calendar-weekdays">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>
        <div class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            class="calendar-day"
            :class="{ muted: !day.currentMonth, today: day.isToday, selected: day.key === selectedDate }"
            @click="selectedDate = day.key"
          >
            <span>{{ day.number }}</span>
            <i v-if="day.tasks.length" :title="`${day.tasks.length} tarefa(s)`">{{ day.tasks.length }}</i>
          </button>
        </div>
        <div class="day-agenda">
          <div class="day-agenda-title">
            <span>{{ selectedDateLabel }}</span>
            <strong>{{ selectedDayTasks.length }}</strong>
          </div>
          <button
            v-for="task in selectedDayTasks"
            :key="task.id"
            type="button"
            @click="editTask(task)"
          >
            <i :class="`status-${task.status}`"></i>
            <span>{{ task.title }}</span>
          </button>
          <p v-if="selectedDayTasks.length === 0">Nenhuma tarefa marcada para este dia.</p>
        </div>
      </aside>
    </div>

    <!-- Modal editar tarefa -->
    <Modal :show="showTaskModal" title="Editar tarefa" @close="closeTaskModal">
      <form @submit.prevent="saveTask" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink-200 mb-1">Título *</label>
          <input v-model="taskForm.title" type="text" required class="w-full px-3 py-2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-200 mb-1">Descrição</label>
          <textarea v-model="taskForm.description" rows="2" class="w-full px-3 py-2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-ink-200 mb-1">Dificuldade</label>
            <select v-model="taskForm.difficulty" class="w-full px-3 py-2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500">
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-200 mb-1">Status</label>
            <select v-model="taskForm.status" class="w-full px-3 py-2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500">
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluído</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-200 mb-1">Data</label>
          <input v-model="taskForm.due_date" type="date" class="w-full px-3 py-2 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500" />
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="deleteTaskFromDash" class="px-4 py-2 text-sm text-terra-600 hover:bg-terra-500/10 rounded-lg">Excluir</button>
          <div class="flex-1"></div>
          <button type="button" @click="closeTaskModal" class="px-4 py-2 text-sm text-ink-100 hover:bg-[var(--paper-surface-2)] rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-terra-500 text-ink-400 rounded-lg hover:bg-terra-600">Salvar</button>
        </div>
      </form>
    </Modal>
  </div>

  <!-- Dashboard normal (financeiro) -->
  <div v-else>
    <h1 class="text-xl font-bold text-ink-400 mb-6">Dashboard</h1>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">Recebido este mês</p>
        <p class="text-lg font-bold text-olive-500 mt-1">{{ fmt(d.finance?.receivedThisMonth) }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">A receber (total pendente)</p>
        <p class="text-lg font-bold text-terra-600 mt-1">{{ fmt(d.finance?.totalPending) }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">Implantação pendente</p>
        <p class="text-lg font-bold text-[#C89A3F] mt-1">{{ fmt(d.finance?.setupPending) }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">Recorrente / mês</p>
        <p class="text-lg font-bold text-terra-500 mt-1">{{ fmt(d.finance?.monthlyRecurring) }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">Projetos ativos</p>
        <p class="text-lg font-bold text-indigo_ink-500 mt-1">{{ d.finance?.activeProjects || 0 }} <span v-if="d.finance?.annualCount" class="text-xs text-ink-50">+{{ d.finance.annualCount }} anual</span></p>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <p class="text-xs text-ink-50">Tarefas pendentes</p>
        <p class="text-lg font-bold text-terra-500 mt-1">{{ pendingTasks }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-4">Projeção de recebimentos (6 meses)</h3>
        <div class="h-64">
          <canvas ref="projectionChart"></canvas>
        </div>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-4">Visão geral da receita</h3>
        <div class="h-64 flex items-center justify-center">
          <canvas ref="revenueChart"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-3">Tarefas</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm" v-for="(label, key) in { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluídas' }" :key="key">
            <span class="text-ink-100">{{ label }}</span>
            <span class="font-medium text-ink-400 bg-[var(--paper-surface-3)] px-2 py-0.5 rounded text-xs ring-1 ring-[var(--paper-border)]">{{ d.tasks?.[key] || 0 }}</span>
          </div>
        </div>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-3">Leads</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm" v-for="(count, status) in d.leads" :key="status">
            <span class="text-ink-100 capitalize">{{ status }}</span>
            <span class="font-medium text-ink-400 bg-[var(--paper-surface-3)] px-2 py-0.5 rounded text-xs ring-1 ring-[var(--paper-border)]">{{ count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
import { useTaskStore } from '../stores/tasks'
import { useAuthStore } from '../stores/auth'
import { Chart, registerables } from 'chart.js'
import { quotes, getQuote } from '../quotes'
import Modal from '../components/ui/Modal.vue'
import api from '../api'

Chart.register(...registerables)

const dashboard = useDashboardStore()
const taskStore = useTaskStore()
const auth = useAuthStore()
const d = computed(() => dashboard.data || { tasks: {}, leads: {}, finance: {} })

const workMode = computed(() => !!auth.workMode)

// Task editing modal (shared with Tarefas behavior)
const showTaskModal = ref(false)
const editingTask = ref(null)
const taskForm = reactive({ title: '', description: '', difficulty: 'medium', status: 'todo', due_date: '' })

function editTask(task) {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.difficulty = task.difficulty || 'medium'
  taskForm.status = task.status
  taskForm.due_date = task.due_date || ''
  showTaskModal.value = true
}

function closeTaskModal() { showTaskModal.value = false; editingTask.value = null }

async function saveTask() {
  if (editingTask.value) {
    await taskStore.update(editingTask.value.id, { ...taskForm })
  }
  closeTaskModal()
}

async function deleteTaskFromDash() {
  if (!confirm('Excluir esta tarefa?')) return
  await taskStore.remove(editingTask.value.id)
  closeTaskModal()
}

const projectionChart = ref(null)
const revenueChart = ref(null)
let projInstance = null
let revInstance = null

const currentQuote = ref(getQuote('quote-dash'))

const firstName = computed(() => auth.user?.name?.split(' ')[0] || '')
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
})
const todayLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
)

const calendarCursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const selectedDate = ref(localDateKey(new Date()))
const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function localDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const calendarMonthLabel = computed(() =>
  calendarCursor.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
)

const calendarDays = computed(() => {
  const start = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), 1)
  start.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = localDateKey(date)
    return {
      key,
      number: date.getDate(),
      currentMonth: date.getMonth() === calendarCursor.value.getMonth(),
      isToday: key === localDateKey(new Date()),
      tasks: taskStore.tasks.filter(task => task.due_date === key)
    }
  })
})

const selectedDayTasks = computed(() =>
  taskStore.tasks.filter(task => task.due_date === selectedDate.value)
)

const selectedDateLabel = computed(() => {
  const date = new Date(`${selectedDate.value}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
})

function changeMonth(offset) {
  calendarCursor.value = new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth() + offset, 1)
}

function goToToday() {
  const now = new Date()
  calendarCursor.value = new Date(now.getFullYear(), now.getMonth(), 1)
  selectedDate.value = localDateKey(now)
}

function shortDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Relógio digital
const clock = reactive({ now: '' })
let clockTimer = null

function updateClock() {
  const d = new Date()
  clock.now = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Garbson dashboard
const tasksByStatus = computed(() => ({
  todo: taskStore.tasks.filter(t => t.status === 'todo').length,
  in_progress: taskStore.tasks.filter(t => t.status === 'in_progress').length,
  done: taskStore.tasks.filter(t => t.status === 'done').length
}))

const tasksByDifficulty = computed(() => ({
  easy: taskStore.tasks.filter(t => t.difficulty === 'easy').length,
  medium: taskStore.tasks.filter(t => t.difficulty === 'medium').length,
  hard: taskStore.tasks.filter(t => t.difficulty === 'hard').length
}))

const total = computed(() => taskStore.tasks.length || 1)
const completionPct = computed(() => Math.round(tasksByStatus.value.done / total.value * 100))

const statusBars = computed(() => [
  { key: 'todo', label: 'A fazer', count: tasksByStatus.value.todo, color: 'text-[#C89A3F]', barColor: 'bg-yellow-500', pct: Math.round(tasksByStatus.value.todo / total.value * 100) },
  { key: 'in_progress', label: 'Em andamento', count: tasksByStatus.value.in_progress, color: 'text-terra-600', barColor: 'bg-blue-500', pct: Math.round(tasksByStatus.value.in_progress / total.value * 100) },
  { key: 'done', label: 'Concluídas', count: tasksByStatus.value.done, color: 'text-olive-500', barColor: 'bg-green-500', pct: Math.round(tasksByStatus.value.done / total.value * 100) }
])

const nextTasks = computed(() => {
  return [...taskStore.tasks]
    .filter(t => t.status !== 'done')
    .sort((a, b) => {
      const diffOrder = { easy: 0, medium: 1, hard: 2 }
      return (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1)
    })
    .slice(0, 10)
})

function max(n) { return n || 1 }
function difficultyBadge(d) {
  return { easy: 'bg-olive-500/20 text-olive-500', medium: 'bg-[#C89A3F]/20 text-[#C89A3F]', hard: 'bg-terra-500/20 text-terra-600' }[d] || ''
}
function difficultyLabel(d) {
  return { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }[d] || d
}
function statusBadge(s) {
  return { todo: 'bg-gray-500/20 text-ink-100', in_progress: 'bg-blue-500/20 text-terra-600', done: 'bg-olive-500/20 text-olive-500' }[s] || ''
}
function statusLabel(s) {
  return { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluído' }[s] || s
}

// Normal dashboard
const pendingTasks = computed(() => {
  if (!dashboard.data) return 0
  return (dashboard.data.tasks.todo || 0) + (dashboard.data.tasks.in_progress || 0)
})

function fmt(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v) || 0)
}

function buildCharts() {
  if (!dashboard.data) return
  const proj = dashboard.data.finance.monthlyProjection || []
  const monthLabels = proj.map(p => {
    const [y, m] = p.month.split('-')
    return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(m) - 1]
  })

  if (projInstance) projInstance.destroy()
  if (revInstance) revInstance.destroy()

  if (projectionChart.value) {
    projInstance = new Chart(projectionChart.value, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [{
          label: 'Previsto',
          data: proj.map(p => p.total),
          backgroundColor: proj.map((_, i) => {
            const colors = ['#B8593D', '#6B7A3F', '#2C4A5C', '#C89A3F', '#994932', '#556231']
            return colors[i % colors.length]
          }),
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmt(ctx.raw) } } },
        scales: {
          x: { ticks: { color: '#6B6558', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#8A8172', font: { size: 10 }, callback: (v) => fmt(v) }, grid: { color: 'rgba(94, 79, 45, 0.10)' } }
        }
      }
    })
  }

  if (revenueChart.value) {
    const totalReceived = d.value.finance.totalReceived || 0
    const totalPending = d.value.finance.totalPending || 0
    const monthlyR = d.value.finance.monthlyRecurring || 0
    const annualR = d.value.finance.annualRecurring || 0

    revInstance = new Chart(revenueChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Recebido', 'A receber', 'Mensal/mês', 'Anual/ano'],
        datasets: [{
          data: [totalReceived, totalPending, monthlyR, annualR],
          backgroundColor: ['#6B7A3F', '#B8593D', '#2C4A5C', '#C89A3F'],
          borderColor: '#FDFBF5',
          borderWidth: 3,
          hoverBorderColor: '#F7F1E1'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#6B6558', padding: 16, font: { size: 11 }, usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
        }
      }
    })
  }
}

onMounted(async () => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  if (workMode.value) {
    await taskStore.fetch()
  } else {
    await dashboard.fetch()
    buildCharts()
  }
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (projInstance) projInstance.destroy()
  if (revInstance) revInstance.destroy()
})

watch(() => dashboard.data, () => {
  if (!workMode.value) setTimeout(buildCharts, 100)
})
</script>

<style scoped>
.dashboard-notebook { max-width: 1440px; margin: 0 auto; padding-bottom: 2rem; }
.dashboard-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:2rem; padding:1.25rem .5rem 1.5rem; }
.dashboard-heading h1 { font-size:clamp(2rem,4vw,3.35rem); line-height:1; margin:.25rem 0 .55rem; font-weight:600; }
.dashboard-heading p { color:var(--ink-muted); font-size:.92rem; }
.eyebrow { color:var(--accent-terra); font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.16em; }
.notebook-clock { font-family:'JetBrains Mono',monospace; color:var(--ink-faint); font-size:.9rem; letter-spacing:.08em; padding-bottom:.25rem; }
.dashboard-canvas { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(320px,.72fr); gap:1.5rem; align-items:start; }
.dashboard-main { display:flex; flex-direction:column; gap:1.25rem; }
.quote-note { position:relative; background:#f1df9d; padding:1.5rem 1.75rem 1.25rem; width:min(92%,760px); border:1px solid rgba(112,91,48,.1); border-radius:3px; box-shadow:0 10px 25px rgba(83,66,26,.11); }
.quote-note p { font-family:'Fraunces',serif; font-size:1.08rem; line-height:1.55; color:#443b27; }
.quote-note small { display:block; margin-top:.45rem; color:#716443; font-size:.72rem; }
.paper-tape { position:absolute; width:92px; height:24px; top:-11px; left:48%; transform:translateX(-50%) rotate(2deg); background:rgba(211,176,139,.53); }
.stat-strip { display:flex; align-items:center; gap:1.15rem; padding:.7rem .85rem; flex-wrap:wrap; }
.stat-strip div { display:flex; align-items:baseline; gap:.45rem; }
.stat-strip strong { font:600 1.65rem 'Fraunces',serif; color:var(--ink-heading); }
.stat-strip span { color:var(--ink-muted); font-size:.78rem; }
.stat-strip i { width:22px; height:1px; background:var(--paper-border-strong); transform:rotate(-12deg); }
.stat-strip .stat-done strong { color:var(--accent-olive); }
.ruled-sheet,.progress-sheet,.calendar-sheet { position:relative; border:1px solid rgba(112,91,48,.1); border-radius:3px; box-shadow:0 16px 40px rgba(75,61,32,.1),0 2px 4px rgba(75,61,32,.08); }
.ruled-sheet { padding:1.6rem 1.7rem 1.3rem 3.5rem; background-color:#f3e5a9; }
.sheet-title { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:.9rem; }
.sheet-title h2,.calendar-head h2 { font-size:1.35rem; font-weight:600; margin-top:.12rem; }
.hand-note { font-family:'Fraunces',serif; font-style:italic; color:var(--accent-olive); transform:rotate(3deg); border-bottom:2px solid rgba(107,122,63,.35); }
.task-line { width:100%; min-height:54px; display:flex; align-items:center; gap:.8rem; text-align:left; padding:.35rem .2rem; transition:transform .15s,color .15s; }
.task-line:hover { transform:translateX(4px); }
.check-circle { width:17px; height:17px; border:1.5px solid var(--ink-faint); border-radius:48% 52% 46% 54%; flex:none; }
.check-circle.active { border-color:var(--accent-terra); box-shadow:inset 0 0 0 4px #fdfbf5; background:var(--accent-terra); }
.task-copy { display:flex; flex-direction:column; min-width:0; flex:1; }
.task-copy strong { font-size:.88rem; font-weight:600; color:var(--ink-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.task-copy small { color:var(--ink-faint); font-size:.68rem; }
.task-status { font-size:.62rem; padding:.18rem .48rem; transform:rotate(-1deg); color:var(--ink-muted); border:1px solid var(--paper-border-strong); }
.task-status.status-in_progress { color:var(--accent-terra); border-color:rgba(184,89,61,.3); }
.empty-note { padding:2.2rem 0; color:var(--ink-faint); font-family:'Fraunces',serif; font-style:italic; }
.progress-sheet { padding:1.5rem 1.75rem; background:#cfdcb5; }
.sheet-title.compact { margin-bottom:1.2rem; }
.progress-list { display:flex; flex-direction:column; gap:.8rem; }
.progress-row { display:grid; grid-template-columns:90px 1fr 24px; align-items:center; gap:.75rem; font-size:.76rem; color:var(--ink-muted); }
.pencil-track { height:5px; background:rgba(94,79,45,.1); transform:rotate(-.3deg); }
.pencil-track i { display:block; height:100%; border-radius:40% 60% 45% 55%; opacity:.75; }
.progress-row strong { font-family:'JetBrains Mono',monospace; font-size:.7rem; }
.difficulty-note { display:flex; gap:1rem; flex-wrap:wrap; margin-top:1.15rem; padding-top:.8rem; border-top:1px dashed var(--paper-border-strong); font-size:.68rem; color:var(--ink-faint); }
.difficulty-note span { display:flex; align-items:center; gap:.35rem; }
.dot { width:7px; height:7px; border-radius:50%; }.dot.easy{background:var(--accent-olive)}.dot.medium{background:#c89a3f}.dot.hard{background:var(--accent-terra)}
.calendar-sheet { position:sticky; top:1rem; padding:1.65rem 1.45rem 1.35rem 2rem; background:#c9dadd; }
.binder-hole { display:none; }
.calendar-head { display:flex; justify-content:space-between; align-items:flex-start; gap:.75rem; margin-bottom:1rem; }
.calendar-head h2 { text-transform:capitalize; }
.calendar-nav { display:flex; align-items:center; gap:.2rem; }
.calendar-nav button { color:var(--ink-muted); font-size:.7rem; padding:.25rem .38rem; border-bottom:1px solid transparent; }
.calendar-nav button:hover { color:var(--accent-terra); border-color:var(--accent-terra); }
.calendar-weekdays,.calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); }
.calendar-weekdays span { text-align:center; color:var(--ink-faint); font-size:.6rem; font-weight:700; padding:.35rem 0; }
.calendar-day { position:relative; aspect-ratio:1; display:flex; align-items:center; justify-content:center; font:500 .7rem 'JetBrains Mono',monospace; color:var(--ink-primary); border-top:1px solid rgba(94,79,45,.08); }
.calendar-day:hover { background:var(--paper-surface-2); }
.calendar-day.muted { color:rgba(107,101,88,.35); }
.calendar-day.today span { border-bottom:2px solid var(--accent-terra); }
.calendar-day.selected { background:#efe3bc; border-radius:44% 56% 46% 54%; }
.calendar-day i { position:absolute; right:2px; bottom:1px; width:12px; height:12px; display:grid; place-items:center; border-radius:50%; background:var(--accent-olive); color:white; font-size:.45rem; font-style:normal; }
.day-agenda { margin-top:1.15rem; padding-top:.9rem; border-top:1px dashed var(--paper-border-strong); }
.day-agenda-title { display:flex; justify-content:space-between; color:var(--ink-muted); font-size:.72rem; text-transform:capitalize; margin-bottom:.6rem; }
.day-agenda-title strong { font-family:'JetBrains Mono',monospace; color:var(--accent-terra); }
.day-agenda button { display:flex; align-items:center; gap:.55rem; width:100%; padding:.35rem 0; text-align:left; font-size:.73rem; color:var(--ink-primary); }
.day-agenda button i { width:6px; height:6px; border-radius:50%; background:#c89a3f; flex:none; }.day-agenda button i.status-in_progress{background:var(--accent-terra)}.day-agenda button i.status-done{background:var(--accent-olive)}
.day-agenda p { color:var(--ink-faint); font-size:.7rem; font-style:italic; padding:.45rem 0; }
@media(max-width:1023px){.dashboard-canvas{grid-template-columns:1fr}.calendar-sheet{position:relative;top:auto;order:-1}.dashboard-main{display:contents}.quote-note{order:1}.stat-strip{order:2}.ruled-sheet{order:4}.progress-sheet{order:5}.calendar-sheet{order:3}}
@media(max-width:767px){.dashboard-heading{padding:.8rem 0 1rem}.dashboard-heading h1{font-size:2rem}.dashboard-heading p{font-size:.8rem}.notebook-clock{display:none}.quote-note{width:96%;padding:1.25rem}.stat-strip{gap:.65rem}.stat-strip i{display:none}.stat-strip div{min-width:43%}.ruled-sheet{padding-left:2.6rem;padding-right:.8rem}.task-status{display:none}.calendar-sheet{padding-left:1.6rem}.progress-row{grid-template-columns:78px 1fr 20px}}
</style>
