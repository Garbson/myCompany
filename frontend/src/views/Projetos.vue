<template>
  <div>
    <div class="flex items-center justify-between mb-6 md-sticky-title">
      <h1 class="text-xl font-bold text-white">Projetos</h1>
      <button @click="openCreateProject" class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
        + Projeto
      </button>
    </div>

    <!-- Frase motivacional -->
    <div v-if="isGarbson" class="glass rounded-xl glow-hover p-4 mb-4 text-center">
      <p class="text-sm text-gray-300 italic">"{{ currentQuote.text }}"</p>
      <p class="text-xs text-gray-500 mt-1">— {{ currentQuote.author }}</p>
    </div>

    <div class="space-y-3">
      <div v-for="project in projectTasks" :key="project.id" class="glass rounded-xl glow-hover overflow-hidden">
        <div class="p-4 cursor-pointer hover:bg-white/5 transition-colors" @click="toggle(project.id)">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ expanded === project.id ? '▼' : '▶' }}</span>
              <div>
                <p class="text-sm font-medium text-gray-200">{{ project.name }}</p>
                <p class="text-xs text-gray-500">
                  {{ project.taskCount }} tarefa{{ project.taskCount !== 1 ? 's' : '' }}
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
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" :class="statusBadge(project.status)">
                {{ statusLabel(project.status) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="expanded === project.id" class="border-t border-white/5 p-4 bg-slate-950/40">
          <div class="space-y-1">
            <div
              v-for="task in project.tasks"
              :key="task.id"
              class="flex items-center gap-3 px-4 py-2 glass-light rounded-lg glow-hover hover:border-gray-700 transition-colors"
            >
              <button
                class="w-5 h-5 rounded-full border-2 shrink-0"
                :class="task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-600'"
              >
                <svg v-if="task.status === 'done'" class="w-3 h-3 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-200" :class="{ 'line-through opacity-50': task.status === 'done' }">{{ task.title }}</p>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="difficultyBadge(task.difficulty)">
                {{ difficultyLabel(task.difficulty) }}
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0" :class="statusBadge(task.status)">
                {{ statusLabel(task.status) }}
              </span>
            </div>
            <p v-if="project.tasks.length === 0" class="text-center text-gray-600 py-6 text-sm">
              Nenhuma tarefa vinculada
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
import { useToast } from '../composables/useToast'
import { hapticLight } from '../services/haptics'

const taskStore = useTaskStore()
const auth = useAuthStore()
const toast = useToast()
const expanded = ref(null)
const projects = ref([])
const flowProject = ref(null)
const projectToDelete = ref(null)

const isGarbson = computed(() => auth.user?.email === 'garbsonsouza@gmail.com')

const currentQuote = ref(getQuote('quote-proj'))

// Criar/editar projeto
const showProjectModal = ref(false)
const editingProject = ref(null)
const projectForm = reactive({ name: '', description: '' })

function openCreateProject() {
  editingProject.value = null
  projectForm.name = ''
  projectForm.description = ''
  showProjectModal.value = true
}

function openEditProject(project) {
  editingProject.value = project
  projectForm.name = project.name
  projectForm.description = project.description || ''
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

const projectTasks = computed(() => {
  return projects.value
    .filter(p => !p.is_freela)
    .map(p => ({
      ...p,
      tasks: taskStore.tasks.filter(t => t.project_id === p.id),
      taskCount: taskStore.tasks.filter(t => t.project_id === p.id).length
    }))
    .sort((a, b) => b.taskCount - a.taskCount)
})

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
  const { data } = await api.get('/projects')
  projects.value = data
}

onMounted(() => loadProjects())
</script>
