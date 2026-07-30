<template>
  <div class="today-page max-w-[1420px] mx-auto pb-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 md:py-6">
      <div>
        <p class="eyebrow">Sua mesa de hoje</p>
        <h1 class="text-3xl md:text-5xl font-semibold mt-1">Hoje</h1>
        <p class="text-sm text-ink-100 mt-2 capitalize">{{ longDate }}</p>
      </div>
      <div class="flex items-center gap-3 text-sm">
        <span class="today-counter"><strong>{{ focusTasks.length }}</strong> pendências</span>
        <span class="today-counter"><strong>{{ todayEvents.length }}</strong> compromissos</span>
      </div>
    </header>

    <section class="capture-strip">
      <svg class="w-5 h-5 text-terra-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"/>
      </svg>
      <input
        v-model="capture"
        placeholder="Capture algo sem sair do seu dia…"
        class="flex-1 min-w-0 bg-transparent outline-none text-sm text-ink-400 placeholder-ink-50"
        @keydown.enter.prevent="saveCapture"
      />
      <button
        :disabled="!capture.trim() || capturing"
        class="px-3 py-1.5 text-xs font-semibold bg-terra-500 text-white rounded-[3px] disabled:opacity-40"
        @click="saveCapture"
      >
        Guardar
      </button>
    </section>

    <div class="grid grid-cols-1 xl:grid-cols-[1.25fr_.75fr] gap-5 mt-5">
      <main class="space-y-5">
        <section class="today-postit bg-[#F3E5A9]">
          <div class="section-head">
            <div>
              <p class="eyebrow">Foco</p>
              <h2>Tarefas para resolver</h2>
            </div>
            <router-link to="/tarefas" class="section-link">Ver todas →</router-link>
          </div>
          <div v-if="focusTasks.length" class="divide-y divide-[rgba(94,79,45,.12)]">
            <article v-for="task in focusTasks" :key="task.id" class="task-row">
              <button
                class="task-check"
                :class="{ done: task.status === 'done' }"
                :aria-label="`Concluir ${task.title}`"
                @click="completeTask(task)"
              >
                <svg v-if="task.status === 'done'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </button>
              <button class="flex-1 min-w-0 text-left" @click="openTask(task)">
                <strong class="block text-sm text-ink-400 truncate">{{ task.title }}</strong>
                <span class="text-[11px]" :class="isOverdue(task) ? 'text-terra-600 font-semibold' : 'text-ink-50'">
                  {{ taskDateLabel(task) }}<template v-if="task.project_name"> · {{ task.project_name }}</template>
                </span>
              </button>
              <span class="priority-dot" :class="`priority-${task.priority}`"></span>
            </article>
          </div>
          <p v-else class="empty-copy">Nada urgente. Seu caderno está em dia.</p>
        </section>

        <section class="today-postit bg-[#CFDCB5]">
          <div class="section-head">
            <div>
              <p class="eyebrow">Projetos</p>
              <h2>Precisam de atenção</h2>
            </div>
            <router-link to="/projetos" class="section-link">Abrir projetos →</router-link>
          </div>
          <div class="grid sm:grid-cols-2 gap-3">
            <button
              v-for="project in priorityProjects"
              :key="project.id"
              class="project-note"
              @click="router.push({ path: '/projetos', query: { open: project.id } })"
            >
              <span class="priority-dot" :class="`priority-${project.priority}`"></span>
              <strong>{{ project.name }}</strong>
              <small>{{ project.status === 'ativo' ? 'Em andamento' : project.status }}</small>
            </button>
            <p v-if="!priorityProjects.length" class="empty-copy col-span-full">Nenhum projeto pedindo atenção.</p>
          </div>
        </section>
      </main>

      <aside class="space-y-5">
        <section class="today-postit bg-[#C9DADD]">
          <div class="section-head">
            <div>
              <p class="eyebrow">Agenda</p>
              <h2>Compromissos</h2>
            </div>
            <router-link to="/agenda" class="section-link">Agenda →</router-link>
          </div>
          <div v-if="todayEvents.length" class="space-y-2">
            <article v-for="event in todayEvents" :key="event.id" class="event-line">
              <time>{{ event.event_time || 'Dia todo' }}</time>
              <span :class="`event-color-${event.color}`"></span>
              <strong>{{ event.title }}</strong>
            </article>
          </div>
          <p v-else class="empty-copy">Nenhum compromisso marcado para hoje.</p>
        </section>

        <section class="today-postit bg-[#EDC9AE]">
          <div class="section-head">
            <div>
              <p class="eyebrow">Caixa de entrada</p>
              <h2>Para organizar</h2>
            </div>
            <router-link to="/inbox" class="section-link">{{ inbox.length }} itens →</router-link>
          </div>
          <button
            v-for="item in inbox.slice(0, 5)"
            :key="item.id"
            class="inbox-preview"
            @click="router.push('/inbox')"
          >
            <span>{{ item.content }}</span>
            <small>{{ kindLabel(item.kind) }}</small>
          </button>
          <p v-if="!inbox.length" class="empty-copy">Tudo organizado por aqui.</p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useTaskStore } from '../stores/tasks'
import { useToast } from '../composables/useToast'
import { hapticSuccess } from '../services/haptics'

const router = useRouter()
const taskStore = useTaskStore()
const toast = useToast()
const inbox = ref([])
const events = ref([])
const projects = ref([])
const capture = ref('')
const capturing = ref(false)

const todayKey = localDateKey(new Date())
const longDate = computed(() =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
)
const focusTasks = computed(() =>
  taskStore.tasks
    .filter((task) => task.status !== 'done' && task.due_date && task.due_date <= todayKey)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
)
const todayEvents = computed(() => events.value.filter((event) => event.event_date === todayKey))
const projectPriorityRank = { high: 0, medium: 1, low: 2 }
const priorityProjects = computed(() =>
  projects.value
    .filter((project) => project.status === 'ativo')
    .sort((a, b) => projectPriorityRank[a.priority] - projectPriorityRank[b.priority])
    .slice(0, 4)
)

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function isOverdue(task) {
  return task.due_date < todayKey
}
function taskDateLabel(task) {
  return isOverdue(task) ? `Atrasada desde ${formatShort(task.due_date)}` : 'Para hoje'
}
function formatShort(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
function kindLabel(kind) {
  return { capture: 'Ideia', task: 'Tarefa', note: 'Nota' }[kind] || 'Captura'
}
function openTask(task) {
  router.push({ path: '/tarefas', query: { open: task.id } })
}
async function completeTask(task) {
  await taskStore.update(task.id, { status: 'done' })
  hapticSuccess()
  toast.success('Tarefa concluída')
}
async function loadInbox() {
  const { data } = await api.get('/workspace/inbox')
  inbox.value = data
}
async function saveCapture() {
  if (!capture.value.trim() || capturing.value) return
  capturing.value = true
  try {
    await api.post('/workspace/inbox', { content: capture.value, kind: 'capture' })
    capture.value = ''
    await loadInbox()
    window.dispatchEvent(new CustomEvent('inbox:changed'))
  } finally {
    capturing.value = false
  }
}
function onInboxChanged() { loadInbox() }

onMounted(async () => {
  window.addEventListener('inbox:changed', onInboxChanged)
  const [, inboxRes, eventsRes, projectsRes] = await Promise.all([
    taskStore.fetch(),
    api.get('/workspace/inbox'),
    api.get('/workspace/events', { params: { from: todayKey, to: todayKey } }),
    api.get('/projects'),
  ])
  inbox.value = inboxRes.data
  events.value = eventsRes.data
  projects.value = projectsRes.data
})
onBeforeUnmount(() => window.removeEventListener('inbox:changed', onInboxChanged))
</script>

<style scoped>
.eyebrow { color:var(--accent-terra);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em }
.today-counter { padding:.55rem .8rem;background:rgba(253,251,245,.6);border:1px solid var(--paper-border);border-radius:3px;color:var(--ink-muted) }
.today-counter strong { color:var(--ink-heading);font:600 1.2rem 'Fraunces',serif;margin-right:.25rem }
.capture-strip { display:flex;align-items:center;gap:.75rem;padding:.8rem 1rem;background:#fff4c2;border:1px solid rgba(112,91,48,.12);border-radius:3px;box-shadow:0 8px 18px rgba(74,57,29,.09) }
.today-postit { padding:1.25rem;border:1px solid rgba(112,91,48,.1);border-radius:3px;box-shadow:0 12px 28px rgba(74,57,29,.11) }
.section-head { display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem }
.section-head h2 { font-size:1.35rem;font-weight:600 }
.section-link { color:var(--accent-terra);font-size:.72rem;font-weight:700 }
.task-row { min-height:58px;display:flex;align-items:center;gap:.75rem;padding:.45rem .1rem }
.task-check { width:19px;height:19px;display:grid;place-items:center;border:1.5px solid var(--ink-faint);border-radius:50%;color:white;flex:none }
.task-check.done { background:var(--accent-olive);border-color:var(--accent-olive) }
.priority-dot { width:8px;height:8px;border-radius:50%;flex:none }
.priority-high { background:#b8593d }.priority-medium { background:#c89a3f }.priority-low { background:#8a8172 }
.project-note { display:grid;grid-template-columns:auto 1fr;gap:.15rem .55rem;text-align:left;padding:.75rem;background:rgba(253,251,245,.52);border:1px solid rgba(94,79,45,.1);border-radius:3px }
.project-note .priority-dot { grid-row:1/3;margin-top:.35rem }.project-note strong{font-size:.82rem}.project-note small{font-size:.65rem;color:var(--ink-faint)}
.event-line { display:grid;grid-template-columns:58px 7px 1fr;align-items:center;gap:.55rem;padding:.45rem 0;border-bottom:1px solid rgba(94,79,45,.1) }
.event-line time { font:500 .65rem 'JetBrains Mono',monospace;color:var(--ink-muted) }.event-line span{width:7px;height:7px;border-radius:50%}.event-line strong{font-size:.8rem}
.event-color-terra{background:#b8593d}.event-color-olive{background:#6b7a3f}.event-color-blue{background:#2c4a5c}.event-color-amber{background:#c89a3f}
.inbox-preview { width:100%;display:flex;align-items:center;gap:.65rem;text-align:left;padding:.5rem 0;border-bottom:1px solid rgba(94,79,45,.1) }
.inbox-preview span { flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.78rem }.inbox-preview small{font-size:.6rem;color:var(--ink-faint);text-transform:uppercase}
.empty-copy { padding:1.2rem 0;color:var(--ink-faint);font-family:'Fraunces',serif;font-style:italic;font-size:.85rem }
</style>
