<template>
  <Modal :show="show" :title="editing ? 'Editar tarefa' : 'Nova tarefa'" size="xl" @close="$emit('close')">
    <form @submit.prevent="save" class="-m-4">
      <div class="flex flex-col md:flex-row md:items-stretch md:min-h-[60vh]">
        <!-- ===== Coluna principal ===== -->
        <div class="flex-1 min-w-0 p-5 md:p-6 space-y-5">
          <!-- Status chip + Título grande -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] uppercase tracking-wider text-ink-50 font-semibold mr-1">Status</span>
              <button
                v-for="s in statusOptions"
                :key="s.value"
                type="button"
                @click="form.status = s.value"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.status === s.value
                  ? s.activeClass
                  : 'glass-light text-ink-100 hover:text-ink-400 hover:bg-[var(--paper-surface-3)]'"
              >
                {{ s.label }}
              </button>
            </div>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Título da tarefa"
              class="w-full bg-transparent border-0 outline-none text-xl md:text-2xl font-bold text-ink-400 placeholder-gray-600 focus:bg-[var(--paper-surface-2)] rounded-lg px-2 -mx-2 py-1 transition-colors"
            />
          </div>

          <!-- Descrição (auto-expansível) -->
          <div>
            <p class="text-[11px] uppercase tracking-wider text-ink-50 font-semibold mb-1.5">Descrição</p>
            <textarea
              v-model="form.description"
              ref="descRef"
              rows="3"
              placeholder="Adicione contexto, links, decisões…"
              class="w-full px-3 py-2 bg-[var(--paper-surface-2)] border border-[var(--paper-border)] rounded-lg text-sm text-ink-300 placeholder-gray-600 focus:outline-none focus:border-indigo_ink-500/60 focus:bg-[var(--paper-surface)] transition-colors resize-none overflow-hidden leading-relaxed"
              @input="autoResize"
            ></textarea>
          </div>

          <!-- Subtarefas: logo abaixo da descrição -->
          <div class="pt-1">
            <SubtaskList v-if="editing" :task-id="editing.id" />
            <!-- Modo "nova tarefa": lista in-memory de subtarefas planejadas -->
            <div v-else>
              <h4 class="text-xs font-semibold text-ink-100 uppercase tracking-wide mb-2">
                Subtarefas
                <span v-if="pendingSubtasks.length" class="ml-1 text-ink-50 normal-case font-normal">
                  {{ pendingSubtasks.length }}
                </span>
              </h4>
              <ul v-if="pendingSubtasks.length" class="space-y-1 mb-2">
                <li
                  v-for="(t, i) in pendingSubtasks"
                  :key="i"
                  class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--paper-surface-2)] group"
                >
                  <span class="w-4 h-4 rounded border border-[var(--paper-border-strong)] shrink-0"></span>
                  <span class="flex-1 text-sm text-ink-300 break-words">{{ t }}</span>
                  <button
                    type="button"
                    @click="pendingSubtasks.splice(i, 1)"
                    class="opacity-0 group-hover:opacity-100 text-ink-50 hover:text-terra-600 transition-opacity"
                    aria-label="Remover"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              </ul>
              <form @submit.prevent="addPendingSubtask" class="flex gap-2">
                <input
                  v-model="pendingSubtaskTitle"
                  type="text"
                  placeholder="+ Adicionar subtarefa"
                  class="flex-1 px-3 py-1.5 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 placeholder-gray-500 focus:outline-none focus:border-indigo_ink-500 transition-colors"
                />
                <button
                  v-if="pendingSubtaskTitle.trim()"
                  type="submit"
                  class="px-3 py-1.5 text-xs font-semibold bg-terra-500/12 text-terra-600 hover:bg-terra-500/20 rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </form>
              <p v-if="pendingSubtasks.length" class="text-[11px] text-ink-50 mt-2">
                Serão criadas junto com a tarefa ao salvar.
              </p>
            </div>
          </div>

          <!-- Anexos -->
          <div v-if="editing" class="pt-1">
            <AttachmentList entity-type="task" :entity-id="editing.id" />
          </div>

          <!-- Comentários -->
          <div v-if="editing" class="pt-1">
            <CommentList :task-id="editing.id" />
          </div>

          <RelationsPanel
            v-if="editing"
            class="mt-2"
            entity-type="task"
            :entity-id="editing.id"
          />
        </div>

        <!-- ===== Sidebar de metadados ===== -->
        <aside class="md:w-72 md:shrink-0 md:border-l border-t md:border-t-0 border-[var(--paper-border)] bg-[var(--paper-bg)]/40 p-5 md:p-5 space-y-4">
          <p class="text-[11px] uppercase tracking-wider text-ink-50 font-semibold">Detalhes</p>

          <!-- Projeto -->
          <div v-if="!fixedProjectId" class="space-y-1">
            <label class="text-[11px] text-ink-100">Projeto</label>
            <select
              v-model="form.project_id"
              class="w-full px-2.5 py-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md text-sm text-ink-400 focus:outline-none focus:border-indigo_ink-500"
            >
              <option :value="null">Nenhum</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <!-- Responsável: oculta se só 1 usuário -->
          <div v-if="users.length > 1" class="space-y-1">
            <label class="text-[11px] text-ink-100">Responsável</label>
            <select
              v-model="form.user_id"
              class="w-full px-2.5 py-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md text-sm text-ink-400 focus:outline-none focus:border-indigo_ink-500"
            >
              <option :value="null">Não atribuído</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>
          </div>

          <!-- Data de entrega -->
          <div class="space-y-1">
            <label class="text-[11px] text-ink-100">
              {{ form.is_recurring ? 'Próxima entrega' : 'Data de entrega' }}
            </label>
            <input
              v-model="form.due_date"
              type="date"
              class="w-full px-2.5 py-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md text-sm text-ink-400 focus:outline-none focus:border-indigo_ink-500"
            />
            <p v-if="form.due_date" class="text-[10px] text-ink-50">
              Lembrete no WhatsApp no dia (configure em
              <router-link to="/configuracoes" class="text-terra-600 hover:underline">Configurações</router-link>)
            </p>
          </div>

          <!-- Recorrência -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="form.is_recurring"
                type="checkbox"
                class="w-4 h-4 rounded border-[var(--paper-border-strong)] bg-slate-900 text-blue-500 focus:ring-indigo_ink-500 focus:ring-offset-0"
              />
              <span class="text-[11px] text-ink-100">Tarefa recorrente</span>
            </label>
            <div v-if="form.is_recurring" class="flex gap-1 flex-wrap">
              <button
                v-for="d in weekDays"
                :key="d.idx"
                type="button"
                @click="toggleDay(d.idx)"
                :class="[
                  'w-7 h-7 rounded-md text-[11px] font-semibold transition-colors',
                  form.recurrence_days.includes(d.idx)
                    ? 'bg-blue-500 text-ink-400 shadow shadow-paper'
                    : 'glass-light text-ink-100 hover:text-ink-400 hover:bg-[var(--paper-surface-3)]',
                ]"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- Dificuldade -->
          <div class="space-y-1">
            <label class="text-[11px] text-ink-100">Dificuldade</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="d in difficultyOptions"
                :key="d.value"
                type="button"
                @click="form.difficulty = d.value"
                class="px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.difficulty === d.value
                  ? d.activeClass
                  : 'glass-light text-ink-100 hover:text-ink-400 hover:bg-[var(--paper-surface-3)]'"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- Prioridade -->
          <div class="space-y-1">
            <label class="text-[11px] text-ink-100">Prioridade</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="p in priorityOptions"
                :key="p.value"
                type="button"
                @click="form.priority = p.value"
                class="px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.priority === p.value
                  ? p.activeClass
                  : 'glass-light text-ink-100 hover:text-ink-400 hover:bg-[var(--paper-surface-3)]'"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Dependência -->
          <div v-if="availableDeps.length > 0 || form.dependency_id" class="space-y-1">
            <label class="text-[11px] text-ink-100">Depende de</label>
            <select
              v-model="form.dependency_id"
              class="w-full px-2.5 py-1.5 bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-md text-sm text-ink-400 focus:outline-none focus:border-indigo_ink-500"
            >
              <option :value="null">Nenhuma</option>
              <option v-for="t in availableDeps" :key="t.id" :value="t.id">{{ t.title }}</option>
            </select>
          </div>
        </aside>
      </div>

      <!-- ===== Footer ===== -->
      <div class="flex items-center gap-3 px-5 py-3 md:px-6 border-t border-[var(--paper-border)] bg-[var(--paper-bg)]/60">
        <button
          v-if="editing"
          type="button"
          @click="$emit('delete', editing)"
          class="px-3 py-2 text-sm text-terra-600 hover:bg-terra-500/10 rounded-lg transition-colors"
        >
          Excluir
        </button>
        <button
          v-if="editing"
          type="button"
          @click="showFlow = true"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
          title="Fluxograma desta tarefa"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h6v6H4zM14 6h6v4h-6zM14 14h6v4h-6zM10 9h4M14 16H7a1 1 0 01-1-1v-3"/>
          </svg>
          Fluxograma
        </button>
        <div class="flex-1"></div>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-ink-100 hover:bg-[var(--paper-surface-2)] rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-5 py-2 text-sm bg-terra-500 text-ink-400 rounded-lg shadow-lg shadow-paper hover:shadow-paper-lg transition-all font-medium"
        >
          {{ editing ? 'Salvar' : 'Criar tarefa' }}
        </button>
      </div>
    </form>
  </Modal>

  <!-- Fluxograma da tarefa (reusa o componente generalizado) -->
  <ProjectFlowModal
    :show="showFlow"
    :entity="editing ? { id: editing.id, name: editing.title || form.title || 'Tarefa' } : null"
    :api-base="editing ? `/tasks/${editing.id}/flow-tabs` : ''"
    subtitle="Fluxograma da tarefa"
    @close="showFlow = false"
  />
</template>

<script setup>
import { reactive, computed, watch, ref, nextTick } from 'vue'
import Modal from '../ui/Modal.vue'
import SubtaskList from './SubtaskList.vue'
import CommentList from './CommentList.vue'
import AttachmentList from './AttachmentList.vue'
import ProjectFlowModal from '../projects/ProjectFlowModal.vue'
import RelationsPanel from '../RelationsPanel.vue'
import { useTaskStore } from '../../stores/tasks'

const props = defineProps({
  show: Boolean,
  editing: { type: Object, default: null },
  users: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] },
  fixedProjectId: { type: [Number, String, null], default: null },
  defaultUserId: { type: [Number, String, null], default: null },
})

const emit = defineEmits(['close', 'save', 'delete'])

const taskStore = useTaskStore()
const descRef = ref(null)
const showFlow = ref(false)

// === Subtarefas planejadas ANTES da task existir (modo "nova tarefa") ===
const pendingSubtasks = ref([])
const pendingSubtaskTitle = ref('')

function addPendingSubtask() {
  const t = pendingSubtaskTitle.value.trim()
  if (!t) return
  pendingSubtasks.value.push(t)
  pendingSubtaskTitle.value = ''
}

// Limpa lista quando o modal abre em modo novo, ou quando alterna pra edição
watch(() => [props.show, props.editing], ([show, editing]) => {
  if (!show || editing) {
    pendingSubtasks.value = []
    pendingSubtaskTitle.value = ''
  }
})

function autoResize() {
  const ta = descRef.value
  if (!ta) return
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}

const weekDays = [
  { idx: 0, label: 'D' },
  { idx: 1, label: 'S' },
  { idx: 2, label: 'T' },
  { idx: 3, label: 'Q' },
  { idx: 4, label: 'Q' },
  { idx: 5, label: 'S' },
  { idx: 6, label: 'S' },
]

const statusOptions = [
  { value: 'todo',        label: 'A fazer',       activeClass: 'bg-[#E1DDD2] text-[#312D26] ring-1 ring-[#8A8172]' },
  { value: 'in_progress', label: 'Em andamento',  activeClass: 'bg-[#C7D8DC] text-[#233F4D] ring-1 ring-[#5E7D8C]' },
  { value: 'done',        label: 'Concluído',     activeClass: 'bg-[#C5DFC0] text-[#2F5428] ring-1 ring-[#6B7A3F]' },
]

const difficultyOptions = [
  { value: 'easy',   label: 'Fácil',   activeClass: 'bg-[#C5DFC0] text-[#2F5428] ring-1 ring-[#6B7A3F]' },
  { value: 'medium', label: 'Médio',   activeClass: 'bg-[#F2D99B] text-[#674A0B] ring-1 ring-[#B88627]' },
  { value: 'hard',   label: 'Difícil', activeClass: 'bg-[#F0BDB2] text-[#722C20] ring-1 ring-[#B8593D]' },
]

const priorityOptions = [
  { value: 'low',    label: 'Baixa', activeClass: 'bg-[#E1DDD2] text-[#312D26] ring-1 ring-[#8A8172]' },
  { value: 'medium', label: 'Média', activeClass: 'bg-[#F2D99B] text-[#674A0B] ring-1 ring-[#B88627]' },
  { value: 'high',   label: 'Alta',  activeClass: 'bg-[#F0BDB2] text-[#722C20] ring-1 ring-[#B8593D]' },
]

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  difficulty: 'medium',
  due_date: '',
  status: 'todo',
  user_id: null,
  project_id: null,
  dependency_id: null,
  is_recurring: false,
  recurrence_days: [],
})

function parseDays(str) {
  if (!str) return []
  return String(str)
    .split(',')
    .map((d) => parseInt(d, 10))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
}

function toggleDay(idx) {
  const i = form.recurrence_days.indexOf(idx)
  if (i >= 0) form.recurrence_days.splice(i, 1)
  else form.recurrence_days.push(idx)
}

const availableDeps = computed(() => {
  const projectId = form.project_id || props.editing?.project_id
  return taskStore.tasks.filter((t) => {
    if (props.editing && t.id === props.editing.id) return false
    if (!projectId) return false
    if (t.project_id !== Number(projectId)) return false
    return t.status !== 'done'
  })
})

watch(
  // reage tanto a show quanto a uma troca de tarefa (incluindo create → edit)
  [() => props.show, () => props.editing?.id ?? null],
  async ([show]) => {
    if (!show) return
    if (props.editing) {
      Object.assign(form, {
        title: props.editing.title || '',
        description: props.editing.description || '',
        priority: props.editing.priority || 'medium',
        difficulty: props.editing.difficulty || 'medium',
        due_date: props.editing.due_date || '',
        status: props.editing.status || 'todo',
        user_id: props.editing.user_id || null,
        project_id: props.editing.project_id || null,
        dependency_id: props.editing.dependency_id || null,
        is_recurring: !!props.editing.is_recurring,
        recurrence_days: parseDays(props.editing.recurrence_days),
      })
    } else {
      Object.assign(form, {
        title: '',
        description: '',
        priority: 'medium',
        difficulty: 'medium',
        due_date: '',
        status: 'todo',
        user_id: props.defaultUserId || null,
        project_id: props.fixedProjectId || null,
        dependency_id: null,
        is_recurring: false,
        recurrence_days: [],
      })
    }
    // ajusta altura do textarea pro conteúdo carregado
    await nextTick()
    autoResize()
  },
  { immediate: true }
)

function save() {
  emit('save', {
    ...form,
    project_id: form.project_id || null,
    dependency_id: form.dependency_id || null,
    due_date: form.due_date || null,
    is_recurring: form.is_recurring ? 1 : 0,
    recurrence_days: form.is_recurring && form.recurrence_days.length ? form.recurrence_days.join(',') : null,
    // Só passa quando estamos criando (o parent cria via API depois de criar a task)
    __pendingSubtasks: !props.editing && pendingSubtasks.value.length
      ? [...pendingSubtasks.value]
      : undefined,
  })
}
</script>
