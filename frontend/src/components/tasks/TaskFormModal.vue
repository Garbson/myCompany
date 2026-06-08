<template>
  <Modal :show="show" :title="editing ? 'Editar tarefa' : 'Nova tarefa'" size="xl" @close="$emit('close')">
    <form @submit.prevent="save" class="-m-4">
      <div class="flex flex-col md:flex-row md:items-stretch md:min-h-[60vh]">
        <!-- ===== Coluna principal ===== -->
        <div class="flex-1 min-w-0 p-5 md:p-6 space-y-5">
          <!-- Status chip + Título grande -->
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mr-1">Status</span>
              <button
                v-for="s in statusOptions"
                :key="s.value"
                type="button"
                @click="form.status = s.value"
                class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.status === s.value
                  ? s.activeClass
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'"
              >
                {{ s.label }}
              </button>
            </div>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Título da tarefa"
              class="w-full bg-transparent border-0 outline-none text-xl md:text-2xl font-bold text-white placeholder-gray-600 focus:bg-white/[0.03] rounded-lg px-2 -mx-2 py-1 transition-colors"
            />
          </div>

          <!-- Descrição (auto-expansível) -->
          <div>
            <p class="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Descrição</p>
            <textarea
              v-model="form.description"
              ref="descRef"
              rows="3"
              placeholder="Adicione contexto, links, decisões…"
              class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-900/60 transition-colors resize-none overflow-hidden leading-relaxed"
              @input="autoResize"
            ></textarea>
          </div>

          <!-- Subtarefas: logo abaixo da descrição -->
          <div v-if="editing" class="pt-1">
            <SubtaskList :task-id="editing.id" />
          </div>

          <!-- Anexos -->
          <div v-if="editing" class="pt-1">
            <AttachmentList entity-type="task" :entity-id="editing.id" />
          </div>

          <!-- Comentários -->
          <div v-if="editing" class="pt-1">
            <CommentList :task-id="editing.id" />
          </div>
        </div>

        <!-- ===== Sidebar de metadados ===== -->
        <aside class="md:w-72 md:shrink-0 md:border-l border-t md:border-t-0 border-white/5 bg-slate-950/40 p-5 md:p-5 space-y-4">
          <p class="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Detalhes</p>

          <!-- Projeto -->
          <div v-if="!fixedProjectId" class="space-y-1">
            <label class="text-[11px] text-gray-400">Projeto</label>
            <select
              v-model="form.project_id"
              class="w-full px-2.5 py-1.5 bg-slate-900/60 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option :value="null">Nenhum</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <!-- Responsável: oculta se só 1 usuário -->
          <div v-if="users.length > 1" class="space-y-1">
            <label class="text-[11px] text-gray-400">Responsável</label>
            <select
              v-model="form.user_id"
              class="w-full px-2.5 py-1.5 bg-slate-900/60 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option :value="null">Não atribuído</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
            </select>
          </div>

          <!-- Data de entrega -->
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">
              {{ form.is_recurring ? 'Próxima entrega' : 'Data de entrega' }}
            </label>
            <input
              v-model="form.due_date"
              type="date"
              class="w-full px-2.5 py-1.5 bg-slate-900/60 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <p v-if="form.due_date" class="text-[10px] text-gray-500">
              Lembrete no WhatsApp no dia (configure em
              <router-link to="/configuracoes" class="text-blue-400 hover:underline">Configurações</router-link>)
            </p>
          </div>

          <!-- Recorrência -->
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input
                v-model="form.is_recurring"
                type="checkbox"
                class="w-4 h-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span class="text-[11px] text-gray-400">Tarefa recorrente</span>
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
                    ? 'bg-blue-500 text-white shadow shadow-blue-500/30'
                    : 'glass-light text-gray-400 hover:text-white hover:bg-white/10',
                ]"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- Dificuldade -->
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Dificuldade</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="d in difficultyOptions"
                :key="d.value"
                type="button"
                @click="form.difficulty = d.value"
                class="px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.difficulty === d.value
                  ? d.activeClass
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'"
              >
                {{ d.label }}
              </button>
            </div>
          </div>

          <!-- Prioridade -->
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Prioridade</label>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="p in priorityOptions"
                :key="p.value"
                type="button"
                @click="form.priority = p.value"
                class="px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors"
                :class="form.priority === p.value
                  ? p.activeClass
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Dependência -->
          <div v-if="availableDeps.length > 0 || form.dependency_id" class="space-y-1">
            <label class="text-[11px] text-gray-400">Depende de</label>
            <select
              v-model="form.dependency_id"
              class="w-full px-2.5 py-1.5 bg-slate-900/60 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option :value="null">Nenhuma</option>
              <option v-for="t in availableDeps" :key="t.id" :value="t.id">{{ t.title }}</option>
            </select>
          </div>
        </aside>
      </div>

      <!-- ===== Footer ===== -->
      <div class="flex items-center gap-3 px-5 py-3 md:px-6 border-t border-white/5 bg-slate-950/60">
        <button
          v-if="editing"
          type="button"
          @click="$emit('delete', editing)"
          class="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Excluir
        </button>
        <div class="flex-1"></div>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-5 py-2 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium"
        >
          {{ editing ? 'Salvar' : 'Criar tarefa' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { reactive, computed, watch, ref, nextTick } from 'vue'
import Modal from '../ui/Modal.vue'
import SubtaskList from './SubtaskList.vue'
import CommentList from './CommentList.vue'
import AttachmentList from './AttachmentList.vue'
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
  { value: 'todo',        label: 'A fazer',       activeClass: 'bg-gray-500/30 text-gray-200 ring-1 ring-gray-400/40' },
  { value: 'in_progress', label: 'Em andamento',  activeClass: 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/40' },
  { value: 'done',        label: 'Concluído',     activeClass: 'bg-green-500/30 text-green-200 ring-1 ring-green-400/40' },
]

const difficultyOptions = [
  { value: 'easy',   label: 'Fácil',  activeClass: 'bg-green-500/30 text-green-200 ring-1 ring-green-400/40' },
  { value: 'medium', label: 'Médio',  activeClass: 'bg-yellow-500/30 text-yellow-200 ring-1 ring-yellow-400/40' },
  { value: 'hard',   label: 'Difícil', activeClass: 'bg-red-500/30 text-red-200 ring-1 ring-red-400/40' },
]

const priorityOptions = [
  { value: 'low',    label: 'Baixa',  activeClass: 'bg-slate-500/30 text-slate-200 ring-1 ring-slate-400/40' },
  { value: 'medium', label: 'Média',  activeClass: 'bg-amber-500/30 text-amber-200 ring-1 ring-amber-400/40' },
  { value: 'high',   label: 'Alta',   activeClass: 'bg-red-500/30 text-red-200 ring-1 ring-red-400/40' },
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
  })
}
</script>
