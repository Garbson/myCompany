<template>
  <div v-if="isGarbson">
    <!-- Dashboard pessoal - cabeçalho com frase + relógio lado a lado -->
    <div class="flex items-stretch gap-3 mb-6">
      <div class="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col justify-center">
        <p class="text-sm text-gray-300 italic">"{{ currentQuote.text }}"</p>
        <p class="text-xs text-gray-500 mt-1">— {{ currentQuote.author }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 font-mono text-2xl font-bold text-white tabular-nums tracking-[0.2em] flex items-center shrink-0">
        {{ clock.now }}
      </div>
    </div>

    <!-- Cards de tarefas -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Total de tarefas</p>
        <p class="text-2xl font-bold text-white mt-1">{{ taskStore.tasks.length }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">A fazer</p>
        <p class="text-2xl font-bold text-yellow-400 mt-1">{{ tasksByStatus.todo }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Em andamento</p>
        <p class="text-2xl font-bold text-blue-400 mt-1">{{ tasksByStatus.in_progress }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Concluídas</p>
        <p class="text-2xl font-bold text-green-400 mt-1">{{ tasksByStatus.done }}</p>
      </div>
    </div>

    <!-- Progresso + Dificuldade -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-4">Progresso</h3>
        <div class="space-y-3">
          <div v-for="s in statusBars" :key="s.key">
            <div class="flex justify-between text-xs mb-1">
              <span :class="s.color">{{ s.label }}</span>
              <span class="text-gray-400">{{ s.count }}</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2">
              <div class="h-2 rounded-full transition-all" :class="s.barColor" :style="{ width: s.pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-4">Por dificuldade</h3>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-green-400">Fácil</span>
              <span class="text-gray-400">{{ tasksByDifficulty.easy }}</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2">
              <div class="h-2 rounded-full bg-green-500" :style="{ width: (tasksByDifficulty.easy / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-yellow-400">Médio</span>
              <span class="text-gray-400">{{ tasksByDifficulty.medium }}</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2">
              <div class="h-2 rounded-full bg-yellow-500" :style="{ width: (tasksByDifficulty.medium / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-red-400">Difícil</span>
              <span class="text-gray-400">{{ tasksByDifficulty.hard }}</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2">
              <div class="h-2 rounded-full bg-red-500" :style="{ width: (tasksByDifficulty.hard / max(taskStore.tasks.length) * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximas tarefas (ordenadas por dificuldade: fácil primeiro) -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 class="text-sm font-semibold text-white mb-3">Próximas tarefas</h3>
      <div class="space-y-1">
        <div
          v-for="task in nextTasks"
          :key="task.id"
          class="flex items-center gap-3 px-3 py-2 bg-gray-800/50 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-600 transition-colors"
          @click="editTask(task)"
        >
          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="difficultyBadge(task.difficulty)">
            {{ difficultyLabel(task.difficulty) }}
          </span>
          <span class="text-sm text-gray-200 flex-1 truncate" :class="{ 'line-through opacity-50': task.status === 'done' }">{{ task.title }}</span>
          <span v-if="task.dependency_id && task.dependency_status !== 'done'" class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 shrink-0" :title="'Depende de: ' + task.dependency_title">🔗</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="statusBadge(task.status)">
            {{ statusLabel(task.status) }}
          </span>
          <span v-if="task.project_name" class="text-[10px] text-indigo-400">{{ task.project_name }}</span>
        </div>
        <p v-if="nextTasks.length === 0" class="text-center text-gray-600 py-6 text-sm">Nenhuma tarefa — crie uma!</p>
      </div>
    </div>

    <!-- Spotify -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4">
      <h3 class="text-sm font-semibold text-white mb-3">🎵 Foco</h3>
      <iframe
        style="border-radius:12px"
        src="https://open.spotify.com/embed/playlist/45pNIxE5hc1AGo5aIoII56?utm_source=generator"
        width="100%"
        height="352"
        allowfullscreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>

    <!-- Modal editar tarefa -->
    <Modal :show="showTaskModal" title="Editar tarefa" @close="closeTaskModal">
      <form @submit.prevent="saveTask" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Título *</label>
          <input v-model="taskForm.title" type="text" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
          <textarea v-model="taskForm.description" rows="2" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Dificuldade</label>
            <select v-model="taskForm.difficulty" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select v-model="taskForm.status" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluído</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="button" @click="deleteTaskFromDash" class="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">Excluir</button>
          <div class="flex-1"></div>
          <button type="button" @click="closeTaskModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  </div>

  <!-- Dashboard normal (financeiro) -->
  <div v-else>
    <h1 class="text-xl font-bold text-white mb-6">Dashboard</h1>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Recebido este mês</p>
        <p class="text-lg font-bold text-green-400 mt-1">{{ fmt(d.finance?.receivedThisMonth) }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">A receber (total pendente)</p>
        <p class="text-lg font-bold text-blue-400 mt-1">{{ fmt(d.finance?.totalPending) }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Implantação pendente</p>
        <p class="text-lg font-bold text-yellow-400 mt-1">{{ fmt(d.finance?.setupPending) }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Recorrente / mês</p>
        <p class="text-lg font-bold text-purple-400 mt-1">{{ fmt(d.finance?.monthlyRecurring) }}</p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Projetos ativos</p>
        <p class="text-lg font-bold text-indigo-400 mt-1">{{ d.finance?.activeProjects || 0 }} <span v-if="d.finance?.annualCount" class="text-xs text-gray-500">+{{ d.finance.annualCount }} anual</span></p>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p class="text-xs text-gray-500">Tarefas pendentes</p>
        <p class="text-lg font-bold text-orange-400 mt-1">{{ pendingTasks }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-4">Projeção de recebimentos (6 meses)</h3>
        <div class="h-64">
          <canvas ref="projectionChart"></canvas>
        </div>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-4">Visão geral da receita</h3>
        <div class="h-64 flex items-center justify-center">
          <canvas ref="revenueChart"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-3">Tarefas</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm" v-for="(label, key) in { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluídas' }" :key="key">
            <span class="text-gray-400">{{ label }}</span>
            <span class="font-medium text-white bg-gray-800 px-2 py-0.5 rounded text-xs">{{ d.tasks?.[key] || 0 }}</span>
          </div>
        </div>
      </div>
      <div class="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 class="text-sm font-semibold text-white mb-3">Leads</h3>
        <div class="space-y-2">
          <div class="flex justify-between text-sm" v-for="(count, status) in d.leads" :key="status">
            <span class="text-gray-400 capitalize">{{ status }}</span>
            <span class="font-medium text-white bg-gray-800 px-2 py-0.5 rounded text-xs">{{ count }}</span>
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

const isGarbson = computed(() => auth.user?.email === 'garbsonsouza@gmail.com')

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
  { key: 'todo', label: 'A fazer', count: tasksByStatus.value.todo, color: 'text-yellow-400', barColor: 'bg-yellow-500', pct: Math.round(tasksByStatus.value.todo / total.value * 100) },
  { key: 'in_progress', label: 'Em andamento', count: tasksByStatus.value.in_progress, color: 'text-blue-400', barColor: 'bg-blue-500', pct: Math.round(tasksByStatus.value.in_progress / total.value * 100) },
  { key: 'done', label: 'Concluídas', count: tasksByStatus.value.done, color: 'text-green-400', barColor: 'bg-green-500', pct: Math.round(tasksByStatus.value.done / total.value * 100) }
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
  return { easy: 'bg-green-500/20 text-green-400', medium: 'bg-yellow-500/20 text-yellow-400', hard: 'bg-red-500/20 text-red-400' }[d] || ''
}
function difficultyLabel(d) {
  return { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }[d] || d
}
function statusBadge(s) {
  return { todo: 'bg-gray-500/20 text-gray-400', in_progress: 'bg-blue-500/20 text-blue-400', done: 'bg-green-500/20 text-green-400' }[s] || ''
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
            const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899']
            return colors[i] || '#3B82F6'
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
          x: { ticks: { color: '#9CA3AF', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#9CA3AF', font: { size: 10 }, callback: (v) => fmt(v) }, grid: { color: '#1F2937' } }
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
          backgroundColor: ['#22C55E', '#3B82F6', '#A855F7', '#F59E0B'],
          borderColor: '#111827',
          borderWidth: 3,
          hoverBorderColor: '#374151'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9CA3AF', padding: 16, font: { size: 11 }, usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}` } }
        }
      }
    })
  }
}

onMounted(async () => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
  if (isGarbson.value) {
    await taskStore.fetch()
  } else {
    await dashboard.fetch()
    buildCharts()
  }
})

watch(() => dashboard.data, () => {
  if (!isGarbson.value) setTimeout(buildCharts, 100)
})
</script>
