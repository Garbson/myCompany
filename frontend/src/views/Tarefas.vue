<template>
  <div>
    <div class="hidden md:flex items-center justify-between mb-6 md-sticky-title">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Tarefas</h1>
        <p class="text-xs text-gray-500 mt-0.5">{{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'tarefa' : 'tarefas' }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nova tarefa
      </button>
    </div>

    <!-- FAB mobile -->
    <button
      @click="openCreate"
      class="md:hidden fixed z-30 right-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-xl shadow-blue-500/50 hover:shadow-blue-500/70 active:scale-95 transition-all flex items-center justify-center w-14 h-14 ring-1 ring-white/20"
      style="bottom: calc(var(--safe-bottom) + 5rem)"
      aria-label="Nova tarefa"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Frase motivacional -->
    <div v-if="isGarbson" class="glass rounded-xl p-4 mb-4 text-center">
      <p class="text-sm text-gray-300 italic">"{{ currentQuote.text }}"</p>
      <p class="text-xs text-gray-500 mt-1">— {{ currentQuote.author }}</p>
    </div>

    <!-- Filtros -->
    <div class="space-y-2 mb-4">
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:flex-wrap md:items-center scrollbar-none">
        <button
          v-for="f in filters"
          :key="f.key"
          @click="activeFilter = f.key"
          class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
          :class="activeFilter === f.key ? 'bg-blue-500/90 text-white shadow-lg shadow-blue-500/30' : 'glass-light text-gray-400 hover:text-white'"
        >
          {{ f.label }}
          <span class="ml-1 opacity-60">({{ f.count }})</span>
        </button>
        <select
          v-model="projectFilter"
          class="hidden md:block md:ml-auto px-3 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-blue-500"
          @change="applyProjectFilter"
        >
          <option value="">Todos os projetos</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <select
        v-model="projectFilter"
        class="md:hidden w-full px-3 py-2 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-gray-300 focus:outline-none focus:border-blue-500"
        @change="applyProjectFilter"
      >
        <option value="">Todos os projetos</option>
        <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
    </div>

    <!-- Lista -->
    <div class="space-y-1">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 glass rounded-xl glow-hover active:bg-white/5 cursor-pointer group"
        @click="editTask(task)"
      >
        <!-- Status checkbox -->
        <button
          @click.stop="toggleStatus(task)"
          class="w-6 h-6 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center"
          :class="task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-blue-500'"
          :aria-label="task.status === 'done' ? 'Marcar como pendente' : 'Concluir'"
        >
          <svg v-if="task.status === 'done'" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 min-w-0">
            <p class="flex-1 min-w-0 text-sm text-gray-200 break-words" :class="{ 'line-through opacity-50': task.status === 'done' }">
              {{ task.title }}
            </p>
            <span
              v-if="task.dependency_id && task.dependency_status !== 'done'"
              class="inline-flex items-center justify-center shrink-0 text-amber-400"
              :title="'Depende de: ' + task.dependency_title"
              aria-label="Tem dependência"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </span>
          </div>
          <p v-if="task.description" class="hidden md:block text-xs text-gray-500 truncate max-w-md mt-0.5">
            {{ task.description }}
          </p>
          <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="difficultyBadge(task.difficulty)">
              {{ difficultyLabel(task.difficulty) }}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="statusBadge(task.status)">
              {{ statusLabel(task.status) }}
            </span>
            <span
              v-if="task.due_date && task.status !== 'done'"
              class="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
              :class="dueBadgeClass(task.due_date)"
            >
              <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ dueLabel(task.due_date) }}
            </span>
            <span v-if="task.project_name" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 truncate max-w-[50%]">
              {{ task.project_name }}
            </span>
          </div>
        </div>

        <div v-if="task.assigned_name" class="hidden sm:flex items-center gap-1.5 shrink-0">
          <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-300">
            {{ task.assigned_name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Quick actions (somente desktop) -->
        <div class="hidden md:opacity-0 md:group-hover:opacity-100 md:flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            v-if="task.status !== 'done'"
            @click.stop="moveTask(task, task.status === 'todo' ? 'in_progress' : 'done')"
            class="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-500/10 rounded-md transition-colors"
            :title="task.status === 'todo' ? 'Iniciar' : 'Concluir'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path v-if="task.status === 'todo'" stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            @click.stop="confirmDelete(task)"
            class="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Excluir tarefa"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <p v-if="filteredTasks.length === 0" class="text-center text-gray-500 py-12 text-sm">
        Nenhuma tarefa
      </p>
    </div>

    <!-- Modal de criar/editar tarefa -->
    <TaskFormModal
      :show="showModal"
      :editing="editing"
      :users="users"
      :projects="projects"
      :default-user-id="defaultUserId"
      @close="closeModal"
      @save="save"
      @delete="(task) => (taskToDelete = task)"
    />

    <ConfirmDialog
      :show="!!taskToDelete"
      title="Excluir tarefa?"
      :message="taskToDelete ? `“${taskToDelete.title}” será removida permanentemente.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDelete"
      @cancel="taskToDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import TaskFormModal from '../components/tasks/TaskFormModal.vue'
import { quotes, getQuote } from '../quotes'
import { useToast } from '../composables/useToast'
import { hapticLight, hapticMedium, hapticSuccess } from '../services/haptics'

const toast = useToast()

const taskStore = useTaskStore()
const auth = useAuthStore()
const showModal = ref(false)
const editing = ref(null)
const taskToDelete = ref(null)
const users = ref([])
const projects = ref([])
const activeFilter = ref('all')
const projectFilter = ref('')

const isGarbson = computed(() => auth.user?.email === 'garbsonsouza@gmail.com')
const defaultUserId = computed(() => auth.user?.id || null)

const currentQuote = ref(getQuote('quote-tasks'))

const filters = computed(() => {
  let tasks = taskStore.tasks
  if (projectFilter.value) tasks = tasks.filter(t => t.project_id === Number(projectFilter.value))
  return [
    { key: 'all', label: 'Todas', count: tasks.length },
    { key: 'todo', label: 'A fazer', count: tasks.filter(t => t.status === 'todo').length },
    { key: 'in_progress', label: 'Em andamento', count: tasks.filter(t => t.status === 'in_progress').length },
    { key: 'done', label: 'Concluídas', count: tasks.filter(t => t.status === 'done').length }
  ]
})

const filteredTasks = computed(() => {
  let tasks = [...taskStore.tasks]
  if (projectFilter.value) tasks = tasks.filter(t => t.project_id === Number(projectFilter.value))
  if (activeFilter.value !== 'all') tasks = tasks.filter(t => t.status === activeFilter.value)
  // Sort: done at bottom, then by difficulty (easy first), blocked tasks stay visible
  tasks.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    const diff = { easy: 0, medium: 1, hard: 2 }
    return (diff[a.difficulty] || 1) - (diff[b.difficulty] || 1)
  })
  return tasks
})

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.round((due - today) / (1000 * 60 * 60 * 24))
}

function dueLabel(dateStr) {
  const days = daysUntil(dateStr)
  if (days === null) return ''
  if (days < 0) return `Atrasada ${Math.abs(days)}d`
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  if (days <= 7) return `${days}d`
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function dueBadgeClass(dateStr) {
  const days = daysUntil(dateStr)
  if (days === null) return ''
  if (days < 0) return 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
  if (days === 0) return 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30 animate-pulse'
  if (days <= 2) return 'bg-yellow-500/20 text-yellow-300'
  return 'bg-white/5 text-gray-400'
}

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

function openCreate() {
  editing.value = null
  showModal.value = true
}

function editTask(task) {
  editing.value = task
  showModal.value = true
}

function closeModal() { showModal.value = false; editing.value = null }

async function save(payload) {
  try {
    if (editing.value) {
      await taskStore.update(editing.value.id, payload)
      toast.success('Tarefa atualizada')
    } else {
      await taskStore.create(payload)
      toast.success('Tarefa criada')
    }
    hapticMedium()
    closeModal()
  } catch (e) {
    toast.error('Não foi possível salvar')
  }
}

function confirmDelete(task) {
  taskToDelete.value = task
}

async function doDelete() {
  if (!taskToDelete.value) return
  const id = taskToDelete.value.id
  taskToDelete.value = null
  try {
    await taskStore.remove(id)
    hapticMedium()
    toast.success('Tarefa excluída')
  } catch {
    toast.error('Não foi possível excluir')
  }
  if (editing.value?.id === id) closeModal()
}

async function toggleStatus(task) {
  if (task.status !== 'done' && task.dependency_id && task.dependency_status !== 'done') {
    toast.warning(`Conclua primeiro: "${task.dependency_title}"`)
    return
  }
  const next = task.status === 'done' ? 'todo' : 'done'
  await taskStore.update(task.id, { status: next })
  if (next === 'done') {
    hapticSuccess()
    toast.success('Concluído! 🎉')
  } else {
    hapticLight()
  }
}

async function moveTask(task, status) {
  if (status === 'done' && task.dependency_id && task.dependency_status !== 'done') {
    toast.warning(`Conclua primeiro: "${task.dependency_title}"`)
    return
  }
  await taskStore.update(task.id, { status })
  hapticLight()
}

function applyProjectFilter() {
  activeFilter.value = 'all'
}

onMounted(async () => {
  taskStore.fetch()
  const [usersRes, projectsRes] = await Promise.all([
    api.get('/auth/users'),
    api.get('/projects')
  ])
  users.value = usersRes.data
  projects.value = projectsRes.data
})
</script>
