<template>
  <Modal :show="show" :title="editing ? 'Editar tarefa' : 'Nova tarefa'" @close="$emit('close')">
    <form @submit.prevent="save" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Título *</label>
        <input
          v-model="form.title"
          type="text"
          required
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        ></textarea>
      </div>

      <!-- Projeto (oculto se fixo via prop) -->
      <div v-if="!fixedProjectId">
        <label class="block text-sm font-medium text-gray-300 mb-1">Projeto</label>
        <select
          v-model="form.project_id"
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option :value="null">Nenhum</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- Responsável: oculta se a empresa só tem 1 usuário -->
      <div v-if="users.length > 1">
        <label class="block text-sm font-medium text-gray-300 mb-1">Responsável</label>
        <select
          v-model="form.user_id"
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option :value="null">Não atribuído</option>
          <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Depende de</label>
        <select
          v-model="form.dependency_id"
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option :value="null">Nenhuma</option>
          <option v-for="t in availableDeps" :key="t.id" :value="t.id">{{ t.title }}</option>
        </select>
      </div>

      <!-- Recorrência -->
      <div class="space-y-2">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="form.is_recurring"
            type="checkbox"
            class="w-4 h-4 rounded border-white/20 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span class="text-sm font-medium text-gray-300">Tarefa recorrente</span>
        </label>
        <div v-if="form.is_recurring" class="pl-6 pt-1">
          <p class="text-xs text-gray-500 mb-2">Dias da semana em que se repete</p>
          <div class="flex gap-1.5 flex-wrap">
            <button
              v-for="d in weekDays"
              :key="d.idx"
              type="button"
              @click="toggleDay(d.idx)"
              :class="[
                'w-9 h-9 rounded-lg text-xs font-semibold transition-colors',
                form.recurrence_days.includes(d.idx)
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'glass-light text-gray-400 hover:text-white hover:bg-white/10',
              ]"
            >
              {{ d.label }}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">
          {{ form.is_recurring ? 'Próxima entrega' : 'Data de entrega' }}
        </label>
        <input
          v-model="form.due_date"
          type="date"
          class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
        />
        <p v-if="form.due_date" class="text-[10px] text-gray-500 mt-1">
          Você recebe lembrete no WhatsApp no dia da entrega (configure em
          <router-link to="/configuracoes" class="text-blue-400 hover:underline">Configurações</router-link>)
        </p>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Dificuldade</label>
          <select
            v-model="form.difficulty"
            class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
            class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
            class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="todo">A fazer</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluído</option>
          </select>
        </div>
      </div>

      <!-- Subtarefas, comentários e anexos (só ao editar) -->
      <div v-if="editing" class="space-y-5 pt-4 border-t border-white/5">
        <SubtaskList :task-id="editing.id" />
        <AttachmentList entity-type="task" :entity-id="editing.id" />
        <CommentList :task-id="editing.id" />
      </div>

      <div class="flex gap-3 pt-2">
        <button v-if="editing" type="button" @click="$emit('delete', editing)" class="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
          Excluir
        </button>
        <div class="flex-1"></div>
        <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors">Cancelar</button>
        <button type="submit" class="px-4 py-2 text-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium">Salvar</button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
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

const weekDays = [
  { idx: 0, label: 'D' },
  { idx: 1, label: 'S' },
  { idx: 2, label: 'T' },
  { idx: 3, label: 'Q' },
  { idx: 4, label: 'Q' },
  { idx: 5, label: 'S' },
  { idx: 6, label: 'S' },
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
  () => props.show,
  (v) => {
    if (!v) return
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
