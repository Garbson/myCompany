<template>
  <div v-if="workMode">
    <!-- Hello header (desktop) -->
    <div class="hidden md:flex items-end justify-between mb-6 md-sticky-title">
      <div>
        <h1 class="text-2xl font-bold text-ink-400 tracking-tight">{{ greeting }}, {{ firstName }}</h1>
        <p class="text-sm text-ink-50 mt-0.5">{{ todayLabel }}</p>
      </div>
    </div>

    <!-- Dashboard pessoal - frase + relógio -->
    <div class="flex flex-col-reverse md:flex-row md:items-stretch gap-3 mb-4 md:mb-6">
      <div class="flex-1 glass rounded-xl glow-hover p-4 md:p-5 flex flex-col justify-center">
        <p class="text-sm text-ink-200 italic leading-relaxed">"{{ currentQuote.text }}"</p>
        <p class="text-xs text-ink-50 mt-1.5">— {{ currentQuote.author }}</p>
      </div>
      <div class="paper-strong rounded-xl px-5 py-3 font-mono text-xl md:text-3xl font-bold text-ink-400 tabular-nums tracking-[0.18em] flex items-center justify-center shrink-0 md:min-w-[200px] relative overflow-hidden">
        <span class="relative z-10 text-terra-600">{{ clock.now }}</span>
      </div>
    </div>

    <!-- Cards de tarefas -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="glass rounded-xl glow-hover p-4 hover:border-[var(--paper-border-strong)] transition-colors">
        <p class="text-xs text-ink-50 font-medium uppercase tracking-wide">Total</p>
        <p class="text-2xl font-bold text-ink-400 mt-1.5">{{ taskStore.tasks.length }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4 hover:border-[#C89A3F]/30 transition-colors">
        <p class="text-xs text-ink-50 font-medium uppercase tracking-wide">A fazer</p>
        <p class="text-2xl font-bold text-[#C89A3F] mt-1.5">{{ tasksByStatus.todo }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4 hover:border-terra-500/30 transition-colors">
        <p class="text-xs text-ink-50 font-medium uppercase tracking-wide">Em andamento</p>
        <p class="text-2xl font-bold text-terra-600 mt-1.5">{{ tasksByStatus.in_progress }}</p>
      </div>
      <div class="glass rounded-xl glow-hover p-4 hover:border-olive-500/30 transition-colors">
        <p class="text-xs text-ink-50 font-medium uppercase tracking-wide">Concluídas</p>
        <p class="text-2xl font-bold text-olive-500 mt-1.5">{{ tasksByStatus.done }}</p>
      </div>
    </div>

    <!-- Progresso + Dificuldade -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-4">Progresso</h3>
        <div class="space-y-3">
          <div v-for="s in statusBars" :key="s.key">
            <div class="flex justify-between text-xs mb-1">
              <span :class="s.color">{{ s.label }}</span>
              <span class="text-ink-100">{{ s.count }}</span>
            </div>
            <div class="w-full bg-[var(--paper-surface-2)] rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full transition-all" :class="s.barColor" :style="{ width: s.pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="glass rounded-xl glow-hover p-4">
        <h3 class="text-sm font-semibold text-ink-400 mb-4">Por dificuldade</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-olive-500">Fácil</span>
              <span class="text-ink-100">{{ tasksByDifficulty.easy }}</span>
            </div>
            <div class="w-full bg-[var(--paper-surface-2)] rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full bg-olive-500" :style="{ width: (tasksByDifficulty.easy / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-[#C89A3F]">Médio</span>
              <span class="text-ink-100">{{ tasksByDifficulty.medium }}</span>
            </div>
            <div class="w-full bg-[var(--paper-surface-2)] rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full bg-[#C89A3F]" :style="{ width: (tasksByDifficulty.medium / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-terra-600">Difícil</span>
              <span class="text-ink-100">{{ tasksByDifficulty.hard }}</span>
            </div>
            <div class="w-full bg-[var(--paper-surface-2)] rounded-full h-2 overflow-hidden">
              <div class="h-2 rounded-full bg-red-500" :style="{ width: (tasksByDifficulty.hard / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximas tarefas (ordenadas por dificuldade: fácil primeiro) -->
    <div class="glass rounded-xl glow-hover p-4">
      <h3 class="text-sm font-semibold text-ink-400 mb-3">Próximas tarefas</h3>
      <div class="space-y-1">
        <div
          v-for="task in nextTasks"
          :key="task.id"
          class="flex items-center gap-3 px-3 py-2 glass-light rounded-lg cursor-pointer glow-hover"
          @click="editTask(task)"
        >
          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="difficultyBadge(task.difficulty)">
            {{ difficultyLabel(task.difficulty) }}
          </span>
          <span class="text-sm text-ink-300 flex-1 truncate" :class="{ 'line-through opacity-50': task.status === 'done' }">{{ task.title }}</span>
          <span
            v-if="task.dependency_id && task.dependency_status !== 'done'"
            class="inline-flex items-center justify-center shrink-0 w-5 h-5 rounded bg-[#C89A3F]/20 text-[#C89A3F]"
            :title="'Depende de: ' + task.dependency_title"
            aria-label="Tem dependência"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="statusBadge(task.status)">
            {{ statusLabel(task.status) }}
          </span>
          <span v-if="task.project_name" class="text-[10px] text-indigo_ink-500">{{ task.project_name }}</span>
        </div>
        <p v-if="nextTasks.length === 0" class="text-center text-ink-50 py-6 text-sm">Nenhuma tarefa — crie uma!</p>
      </div>
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
const taskForm = reactive({ title: '', description: '', difficulty: 'medium', status: 'todo' })

function editTask(task) {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.difficulty = task.difficulty || 'medium'
  taskForm.status = task.status
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

watch(() => dashboard.data, () => {
  if (!workMode.value) setTimeout(buildCharts, 100)
})
</script>
