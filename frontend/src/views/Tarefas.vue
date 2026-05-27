<template>
  <div>
    <div class="flex items-center justify-between mb-4 md:mb-6">
      <h1 class="hidden md:block text-xl font-bold text-white">Tarefas</h1>
      <button
        @click="openCreate"
        class="hidden md:inline-flex px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors ml-auto"
      >
        + Nova tarefa
      </button>
    </div>

    <!-- FAB mobile -->
    <button
      @click="openCreate"
      class="md:hidden fixed z-30 right-4 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 hover:bg-blue-500 active:scale-95 transition-all flex items-center justify-center w-14 h-14"
      style="bottom: calc(var(--safe-bottom) + 5rem)"
      aria-label="Nova tarefa"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>

    <!-- Frase motivacional -->
    <div v-if="isGarbson" class="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 text-center">
      <p class="text-sm text-gray-300 italic">"{{ currentQuote.text }}"</p>
      <p class="text-xs text-gray-500 mt-1">— {{ currentQuote.author }}</p>
    </div>

    <!-- Filtros -->
    <div class="flex gap-2 mb-4 flex-wrap items-center">
      <button
        v-for="f in filters"
        :key="f.key"
        @click="activeFilter = f.key"
        class="px-3 py-1.5 text-xs rounded-lg transition-colors"
        :class="activeFilter === f.key ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'"
      >
        {{ f.label }}
        <span class="ml-1 opacity-60">({{ f.count }})</span>
      </button>
      <select
        v-model="projectFilter"
        class="ml-auto px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-400 focus:outline-none focus:border-blue-500"
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
        class="flex items-center gap-3 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 active:bg-gray-800/60 cursor-pointer transition-colors group"
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
          <div class="flex items-start md:items-center gap-2 flex-wrap">
            <p class="text-sm text-gray-200 break-words" :class="{ 'line-through opacity-50': task.status === 'done' }">
              {{ task.title }}
            </p>
            <span v-if="task.dependency_id && task.dependency_status !== 'done'" class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 shrink-0" :title="'Depende de: ' + task.dependency_title">
              🔗 {{ task.dependency_title }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="difficultyBadge(task.difficulty)">
              {{ difficultyLabel(task.difficulty) }}
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="statusBadge(task.status)">
              {{ statusLabel(task.status) }}
            </span>
            <span v-if="task.project_name" class="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
              {{ task.project_name }}
            </span>
            <p v-if="task.description" class="hidden md:block text-xs text-gray-500 truncate max-w-md">
              {{ task.description }}
            </p>
          </div>
        </div>

        <div v-if="task.assigned_name" class="hidden sm:flex items-center gap-1.5 shrink-0">
          <div class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-300">
            {{ task.assigned_name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Quick actions (somente desktop) -->
        <div class="hidden md:group-hover:flex items-center gap-1 shrink-0">
          <button
            v-if="task.status !== 'todo'"
            @click.stop="moveTask(task, 'todo')"
            class="text-[10px] px-1.5 py-0.5 text-gray-500 hover:text-gray-300 rounded"
            title="Mover para A fazer"
          >◀◀</button>
          <button
            v-if="task.status !== 'done'"
            @click.stop="moveTask(task, task.status === 'todo' ? 'in_progress' : 'done')"
            class="text-[10px] px-1.5 py-0.5 text-gray-500 hover:text-green-400 rounded"
            :title="task.status === 'todo' ? 'Iniciar' : 'Concluir'"
          >{{ task.status === 'todo' ? '▶' : '✓' }}</button>
          <button
            @click.stop="deleteTaskFromList(task.id)"
            class="text-[10px] px-1.5 py-0.5 text-gray-600 hover:text-red-400 rounded"
            title="Excluir tarefa"
          >🗑</button>
        </div>
      </div>

      <p v-if="filteredTasks.length === 0" class="text-center text-gray-500 py-12 text-sm">
        Nenhuma tarefa
      </p>
    </div>

    <!-- Modal -->
    <Modal :show="showModal" :title="editing ? 'Editar tarefa' : 'Nova tarefa'" @close="closeModal">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Título *</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Projeto</label>
          <select
            v-model="form.project_id"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option :value="null">Nenhum</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Responsável</label>
          <select
            v-model="form.user_id"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option :value="null">Não atribuído</option>
            <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Depende de</label>
          <select
            v-model="form.dependency_id"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option :value="null">Nenhuma</option>
            <option v-for="t in availableDeps" :key="t.id" :value="t.id">{{ t.title }}</option>
          </select>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Dificuldade</label>
            <select
              v-model="form.difficulty"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Prioridade</label>
            <select
              v-model="form.priority"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluído</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button v-if="editing" type="button" @click="deleteTask" class="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
            Excluir
          </button>
          <div class="flex-1"></div>
          <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import Modal from '../components/ui/Modal.vue'
import { quotes, getQuote } from '../quotes'

const taskStore = useTaskStore()
const auth = useAuthStore()
const showModal = ref(false)
const editing = ref(null)
const users = ref([])
const projects = ref([])
const activeFilter = ref('all')
const projectFilter = ref('')

const isGarbson = computed(() => auth.user?.email === 'garbsonsouza@gmail.com')

const currentQuote = ref(getQuote('quote-tasks'))

const form = reactive({
  title: '', description: '', priority: 'medium', difficulty: 'medium', status: 'todo', user_id: null, project_id: null, dependency_id: null
})

const availableDeps = computed(() => {
  const projectId = form.project_id || (editing.value?.project_id)
  return taskStore.tasks.filter(t => {
    if (editing.value && t.id === editing.value.id) return false
    if (!projectId) return false
    if (t.project_id !== Number(projectId)) return false
    return t.status !== 'done'
  })
})

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
  Object.assign(form, { title: '', description: '', priority: 'medium', difficulty: 'medium', status: 'todo', user_id: null, project_id: null, dependency_id: null })
  showModal.value = true
}

function editTask(task) {
  editing.value = task
  Object.assign(form, {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    difficulty: task.difficulty || 'medium',
    status: task.status,
    user_id: task.user_id,
    project_id: task.project_id,
    dependency_id: task.dependency_id
  })
  showModal.value = true
}

function closeModal() { showModal.value = false; editing.value = null }

async function save() {
  const payload = { ...form, project_id: form.project_id || null, dependency_id: form.dependency_id || null }
  if (editing.value) await taskStore.update(editing.value.id, payload)
  else await taskStore.create(payload)
  closeModal()
}

async function deleteTask() {
  if (confirm('Excluir esta tarefa?')) { await taskStore.remove(editing.value.id); closeModal() }
}

async function deleteTaskFromList(id) {
  if (confirm('Excluir esta tarefa?')) { await taskStore.remove(id) }
}

async function toggleStatus(task) {
  if (task.status !== 'done' && task.dependency_id && task.dependency_status !== 'done') {
    alert(`Conclua primeiro a tarefa "${task.dependency_title}"`)
    return
  }
  const next = task.status === 'done' ? 'todo' : 'done'
  await taskStore.update(task.id, { status: next })
}

async function moveTask(task, status) {
  if (status === 'done' && task.dependency_id && task.dependency_status !== 'done') {
    alert(`Conclua primeiro a tarefa "${task.dependency_title}"`)
    return
  }
  await taskStore.update(task.id, { status })
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
