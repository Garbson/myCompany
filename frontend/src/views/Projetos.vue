<template>
  <div>
    <div class="flex items-center justify-between mb-6 md-sticky-title">
      <h1 class="text-xl font-bold text-white">Projetos</h1>
      <button @click="openCreateProject" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
        + Projeto
      </button>
    </div>

    <!-- Frase motivacional -->
    <div v-if="workMode" class="glass rounded-xl glow-hover p-4 mb-4 text-center">
      <p class="text-sm text-gray-300 italic">"{{ currentQuote.text }}"</p>
      <p class="text-xs text-gray-500 mt-1">— {{ currentQuote.author }}</p>
    </div>

    <div class="space-y-3">
      <div v-for="project in projectTasks" :key="project.id" class="glass rounded-xl glow-hover overflow-hidden">
        <div class="p-4 cursor-pointer hover:bg-white/5 transition-colors" @click="toggle(project.id)">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <span class="text-lg shrink-0">{{ expanded === project.id ? '▼' : '▶' }}</span>
              <span
                class="shrink-0 inline-flex items-center justify-center w-2 h-2 rounded-full"
                :class="priorityDot(project.priority)"
                :title="`Prioridade ${priorityLabel(project.priority)}`"
              ></span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-200 truncate">{{ project.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ project.openCount }} pendente{{ project.openCount !== 1 ? 's' : '' }}
                  <span v-if="project.doneCount" class="text-gray-600">· {{ project.doneCount }} concluída{{ project.doneCount !== 1 ? 's' : '' }}</span>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click.stop="openFlow(project)"
                class="text-gray-600 hover:text-indigo-400 transition-colors p-1"
                title="Fluxograma do projeto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h6v6H4zM14 6h6v4h-6zM14 14h6v4h-6zM10 9h4M14 16H7a1 1 0 01-1-1v-3" />
                </svg>
              </button>
              <button
                @click.stop="openEditProject(project)"
                class="text-gray-600 hover:text-blue-400 transition-colors p-1"
                title="Editar projeto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                @click.stop="askDeleteProject(project)"
                class="text-gray-600 hover:text-red-400 transition-colors p-1"
                title="Excluir projeto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <span
                class="text-[10px] px-2 py-0.5 rounded-full font-medium hidden sm:inline-block"
                :class="priorityBadge(project.priority)"
              >
                {{ priorityLabel(project.priority) }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="statusBadge(project.status)">
                {{ statusLabel(project.status) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="expanded === project.id" class="border-t border-white/5 p-4 bg-slate-950/40">
          <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <p class="text-xs font-medium text-gray-400">Tarefas do projeto</p>
            <div class="flex items-center gap-2">
              <button
                @click.stop="showCompleted = !showCompleted"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                :class="showCompleted ? 'bg-green-500/90 text-white shadow-md shadow-green-500/20' : 'glass-light text-gray-400 hover:text-white'"
                :title="showCompleted ? 'Ocultar concluídas' : 'Mostrar concluídas'"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path v-if="showCompleted" stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path v-else stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
                </svg>
                {{ showCompleted ? 'Ocultar concluídas' : 'Mostrar concluídas' }}
              </button>
              <button
                @click.stop="openCreateTask(project)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nova tarefa
              </button>
            </div>
          </div>
          <div class="space-y-1">
            <div
              v-for="task in visibleTasksFor(project)"
              :key="task.id"
              class="flex items-center gap-3 px-4 py-2 glass-light rounded-lg glow-hover hover:border-gray-700 cursor-pointer transition-colors"
              @click.stop="openEditTask(task)"
            >
              <button
                @click.stop="toggleTaskStatus(task)"
                class="w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center"
                :class="task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-blue-500'"
                :aria-label="task.status === 'done' ? 'Marcar como pendente' : 'Concluir'"
              >
                <svg v-if="task.status === 'done'" class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200 truncate" :class="{ 'line-through opacity-50': task.status === 'done' }">{{ task.title }}</p>
              </div>
              <span v-if="task.is_recurring" class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 shrink-0" title="Tarefa recorrente">↻</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="difficultyBadge(task.difficulty)">
                {{ difficultyLabel(task.difficulty) }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="statusBadge(task.status)">
                {{ statusLabel(task.status) }}
              </span>
            </div>
            <p v-if="project.tasks.length === 0" class="text-center text-gray-600 py-6 text-sm">
              Nenhuma tarefa vinculada — clique em <span class="text-blue-400">Nova tarefa</span> pra começar
            </p>
          </div>
        </div>
      </div>

      <p v-if="projectTasks.length === 0" class="text-center text-gray-500 py-12 text-sm">
        Nenhum projeto cadastrado
      </p>
    </div>

    <!-- Modal criar/editar projeto -->
    <Modal :show="showProjectModal" :title="editingProject ? 'Editar projeto' : 'Novo projeto'" @close="closeProjectModal">
      <form @submit.prevent="saveProject" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
          <input v-model="projectForm.name" type="text" required class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
          <textarea v-model="projectForm.description" rows="2" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1.5">Prioridade</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="p in priorityOptions"
              :key="p.value"
              type="button"
              @click="projectForm.priority = p.value"
              class="px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
              :class="projectForm.priority === p.value
                ? p.activeClass
                : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div v-if="editingProject" class="pt-3 border-t border-white/5">
          <AttachmentList entity-type="project" :entity-id="editingProject.id" />
        </div>

        <div class="flex gap-3 pt-2">
          <div class="flex-1"></div>
          <button type="button" @click="closeProjectModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all font-medium">{{ editingProject ? 'Salvar' : 'Criar' }}</button>
        </div>
      </form>
    </Modal>

    <!-- Modal fluxograma -->
    <ProjectFlowModal
      :show="!!flowProject"
      :project="flowProject"
      @close="flowProject = null"
    />

    <!-- Modal de tarefa (criar/editar dentro do projeto) -->
    <TaskFormModal
      :show="showTaskModal"
      :editing="editingTask"
      :users="users"
      :projects="projects"
      :fixed-project-id="taskProjectId"
      :default-user-id="defaultUserId"
      @close="closeTaskModal"
      @save="saveTask"
      @delete="(t) => (taskToDelete = t)"
    />

    <ConfirmDialog
      :show="!!taskToDelete"
      title="Excluir tarefa?"
      :message="taskToDelete ? `“${taskToDelete.title}” será removida permanentemente.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDeleteTask"
      @cancel="taskToDelete = null"
    />

    <ConfirmDialog
      :show="!!projectToDelete"
      title="Excluir projeto?"
      :message="projectToDelete ? `“${projectToDelete.name}” e todas as tarefas vinculadas serão removidas.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDeleteProject"
      @cancel="projectToDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTaskStore } from '../stores/tasks'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import { quotes, getQuote } from '../quotes'
import Modal from '../components/ui/Modal.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import AttachmentList from '../components/tasks/AttachmentList.vue'
import ProjectFlowModal from '../components/projects/ProjectFlowModal.vue'
import TaskFormModal from '../components/tasks/TaskFormModal.vue'
import { useToast } from '../composables/useToast'
import { hapticLight } from '../services/haptics'

const taskStore = useTaskStore()
const auth = useAuthStore()
const toast = useToast()
const expanded = ref(null)
const projects = ref([])
const users = ref([])
const flowProject = ref(null)
const projectToDelete = ref(null)

// Tarefa dentro do projeto
const showTaskModal = ref(false)
const editingTask = ref(null)
const taskProjectId = ref(null)
const taskToDelete = ref(null)
const showCompleted = ref(false)

const workMode = computed(() => !!auth.workMode)
const defaultUserId = computed(() => auth.user?.id || null)

const currentQuote = ref(getQuote('quote-proj'))

// Criar/editar projeto
const showProjectModal = ref(false)
const editingProject = ref(null)
const projectForm = reactive({ name: '', description: '', priority: 'medium' })

const priorityOptions = [
  { value: 'low',    label: 'Baixa', activeClass: 'bg-slate-500/30 text-slate-200 ring-1 ring-slate-400/40' },
  { value: 'medium', label: 'Média', activeClass: 'bg-amber-500/30 text-amber-200 ring-1 ring-amber-400/40' },
  { value: 'high',   label: 'Alta',  activeClass: 'bg-red-500/30 text-red-200 ring-1 ring-red-400/40' },
]

function priorityBadge(p) {
  return {
    low:    'bg-slate-500/20 text-slate-300',
    medium: 'bg-amber-500/20 text-amber-300',
    high:   'bg-red-500/20 text-red-300',
  }[p] || 'bg-slate-500/20 text-slate-300'
}
function priorityDot(p) {
  return {
    low:    'bg-slate-400',
    medium: 'bg-amber-400',
    high:   'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.7)]',
  }[p] || 'bg-slate-400'
}
function priorityLabel(p) {
  return { low: 'Baixa', medium: 'Média', high: 'Alta' }[p] || 'Média'
}

function openCreateProject() {
  editingProject.value = null
  projectForm.name = ''
  projectForm.description = ''
  projectForm.priority = 'medium'
  showProjectModal.value = true
}

function openEditProject(project) {
  editingProject.value = project
  projectForm.name = project.name
  projectForm.description = project.description || ''
  projectForm.priority = project.priority || 'medium'
  showProjectModal.value = true
}

function closeProjectModal() {
  showProjectModal.value = false
  editingProject.value = null
}

async function saveProject() {
  if (editingProject.value) {
    await api.put(`/projects/${editingProject.value.id}`, { ...projectForm })
  } else {
    await api.post('/projects', { ...projectForm, payment_type: 'pagamento_unico', status: 'ativo', is_freela: false })
  }
  closeProjectModal()
  await loadProjects()
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }

const projectTasks = computed(() => {
  return projects.value
    .filter(p => !p.is_freela)
    .map(p => {
      const all = taskStore.tasks.filter(t => t.project_id === p.id)
      const open = all.filter(t => t.status !== 'done')
      const done = all.filter(t => t.status === 'done')
      return {
        ...p,
        tasks: all,
        openCount: open.length,
        doneCount: done.length,
      }
    })
    .sort((a, b) => {
      // Primeiro por prioridade (high → low); empate, por pendentes; empate, por nome
      const ra = PRIORITY_RANK[a.priority] ?? 1
      const rb = PRIORITY_RANK[b.priority] ?? 1
      if (ra !== rb) return ra - rb
      if (a.openCount !== b.openCount) return b.openCount - a.openCount
      return a.name.localeCompare(b.name)
    })
})

function visibleTasksFor(project) {
  return showCompleted.value
    ? project.tasks
    : project.tasks.filter((t) => t.status !== 'done')
}

function toggle(id) {
  expanded.value = expanded.value === id ? null : id
}

function difficultyBadge(d) {
  return { easy: 'bg-green-500/20 text-green-400', medium: 'bg-yellow-500/20 text-yellow-400', hard: 'bg-red-500/20 text-red-400' }[d] || ''
}
function difficultyLabel(d) {
  return { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }[d] || d
}
function statusBadge(s) {
  return { todo: 'bg-gray-500/20 text-gray-400', in_progress: 'bg-blue-500/20 text-blue-400', done: 'bg-green-500/20 text-green-400', ativo: 'bg-blue-500/20 text-blue-400', concluido: 'bg-green-500/20 text-green-400', cancelado: 'bg-red-500/20 text-red-400' }[s] || ''
}
function statusLabel(s) {
  return { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluído', ativo: 'Ativo', concluido: 'Concluído', cancelado: 'Cancelado' }[s] || s
}

function askDeleteProject(project) {
  projectToDelete.value = project
}

async function doDeleteProject() {
  if (!projectToDelete.value) return
  const id = projectToDelete.value.id
  projectToDelete.value = null
  try {
    await api.delete(`/projects/${id}`)
    hapticLight()
    toast.success('Projeto excluído')
    await loadProjects()
  } catch {
    toast.error('Falha ao excluir')
  }
}

function openFlow(project) {
  flowProject.value = project
  hapticLight()
}

async function loadProjects() {
  await taskStore.fetch()
  const [projRes, usersRes] = await Promise.all([
    api.get('/projects'),
    api.get('/auth/users'),
  ])
  projects.value = projRes.data
  users.value = usersRes.data
}

// === Tarefas dentro do projeto ===
function openCreateTask(project) {
  editingTask.value = null
  taskProjectId.value = project.id
  showTaskModal.value = true
}

function openEditTask(task) {
  editingTask.value = task
  taskProjectId.value = task.project_id
  showTaskModal.value = true
}

function closeTaskModal() {
  showTaskModal.value = false
  editingTask.value = null
  taskProjectId.value = null
}

async function saveTask(payload) {
  try {
    if (editingTask.value) {
      await taskStore.update(editingTask.value.id, payload)
      toast.success('Tarefa atualizada')
      hapticLight()
      closeTaskModal()
    } else {
      const newTask = await taskStore.create(payload)
      hapticLight()
      toast.success('Tarefa criada — adicione subtarefas, anexos, comentários…')
      // Mantém o modal aberto em modo edição
      editingTask.value = newTask
    }
  } catch {
    toast.error('Não foi possível salvar')
  }
}

async function doDeleteTask() {
  if (!taskToDelete.value) return
  const id = taskToDelete.value.id
  taskToDelete.value = null
  try {
    await taskStore.remove(id)
    toast.success('Tarefa excluída')
    if (editingTask.value?.id === id) closeTaskModal()
  } catch {
    toast.error('Não foi possível excluir')
  }
}

async function toggleTaskStatus(task) {
  if (task.status !== 'done' && task.dependency_id && task.dependency_status !== 'done') {
    toast.warning(`Conclua primeiro: "${task.dependency_title}"`)
    return
  }
  const next = task.status === 'done' ? 'todo' : 'done'
  await taskStore.update(task.id, { status: next })
  hapticLight()
}

onMounted(() => loadProjects())
</script>
