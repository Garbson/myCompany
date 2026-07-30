<template>
  <div class="agenda-page max-w-[1500px] mx-auto pb-8">
    <header class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-4 md:py-6">
      <div>
        <p class="eyebrow">Prazos e compromissos</p>
        <h1 class="text-3xl md:text-5xl font-semibold mt-1">Agenda</h1>
        <p class="text-sm text-ink-100 mt-2">{{ periodLabel }}</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="mode-picker">
          <button v-for="mode in modes" :key="mode.value" :class="{ active: viewMode === mode.value }" @click="setMode(mode.value)">
            {{ mode.label }}
          </button>
        </div>
        <button class="today-button" @click="goToday">Hoje</button>
        <button class="event-button" @click="openNewEvent(selectedDate)">+ Compromisso</button>
      </div>
    </header>

    <div class="agenda-layout">
      <aside class="unscheduled-postit">
        <div class="flex items-start justify-between gap-2 mb-3">
          <div>
            <p class="eyebrow">Sem data</p>
            <h2 class="text-lg font-semibold">Tarefas soltas</h2>
          </div>
          <span class="count">{{ unscheduledTasks.length }}</span>
        </div>
        <p class="text-xs text-ink-50 mb-3">Arraste uma tarefa para o dia desejado.</p>
        <div class="space-y-2 max-h-[65vh] overflow-y-auto scrollbar-slim pr-1">
          <article
            v-for="task in unscheduledTasks"
            :key="task.id"
            draggable="true"
            class="unscheduled-task"
            @dragstart="startDrag($event, 'task', task.id)"
            @click="openTask(task)"
          >
            <span class="priority-dot" :class="`priority-${task.priority}`"></span>
            <div class="min-w-0">
              <strong>{{ task.title }}</strong>
              <small>{{ task.project_name || 'Sem projeto' }}</small>
            </div>
          </article>
          <p v-if="!unscheduledTasks.length" class="empty-copy">Todas as tarefas já têm data.</p>
        </div>
      </aside>

      <main class="calendar-postit">
        <div class="calendar-toolbar">
          <button aria-label="Período anterior" @click="navigate(-1)">←</button>
          <h2>{{ periodLabel }}</h2>
          <button aria-label="Próximo período" @click="navigate(1)">→</button>
        </div>

        <div v-if="viewMode !== 'day'" class="weekday-row" :style="gridStyle">
          <span v-for="weekday in visibleWeekdays" :key="weekday">{{ weekday }}</span>
        </div>

        <div class="calendar-days" :class="`mode-${viewMode}`" :style="gridStyle">
          <section
            v-for="day in visibleDays"
            :key="day.key"
            class="calendar-cell"
            :class="{ muted: !day.currentMonth && viewMode === 'month', today: day.key === todayKey, selected: day.key === selectedDate }"
            @click.self="selectDay(day.key)"
            @dragover.prevent
            @drop.prevent="dropOnDate($event, day.key)"
          >
            <button class="day-number" @click="selectDay(day.key)">
              <span v-if="viewMode === 'day'">{{ fullDayLabel(day.date) }}</span>
              <span v-else>{{ day.date.getDate() }}</span>
            </button>
            <div class="day-items">
              <button
                v-for="task in tasksFor(day.key)"
                :key="`task-${task.id}`"
                draggable="true"
                class="calendar-item task-item"
                :class="`priority-border-${task.priority}`"
                @dragstart="startDrag($event, 'task', task.id)"
                @click.stop="openTask(task)"
              >
                <span>✓</span><strong>{{ task.title }}</strong>
              </button>
              <button
                v-for="event in eventsFor(day.key)"
                :key="`event-${event.id}`"
                draggable="true"
                class="calendar-item event-item"
                :class="`event-${event.color}`"
                @dragstart="startDrag($event, 'event', event.id)"
                @click.stop="editEvent(event)"
              >
                <time v-if="event.event_time">{{ event.event_time }}</time>
                <strong>{{ event.title }}</strong>
              </button>
            </div>
            <button class="add-on-day" title="Novo compromisso" @click.stop="openNewEvent(day.key)">+</button>
          </section>
        </div>
      </main>
    </div>

    <Modal :show="showEventModal" :title="eventForm.id ? 'Editar compromisso' : 'Novo compromisso'" size="md" @close="closeEventModal">
      <form class="space-y-4" @submit.prevent="saveEvent">
        <div>
          <label class="field-label">Título</label>
          <input v-model="eventForm.title" required class="field-input" placeholder="Ex.: Reunião de alinhamento"/>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Data</label>
            <input v-model="eventForm.event_date" type="date" required class="field-input"/>
          </div>
          <div>
            <label class="field-label">Horário</label>
            <input v-model="eventForm.event_time" type="time" class="field-input"/>
          </div>
        </div>
        <div>
          <label class="field-label">Detalhes</label>
          <textarea v-model="eventForm.description" rows="3" class="field-input resize-none" placeholder="Contexto, endereço ou link…"></textarea>
        </div>
        <div>
          <label class="field-label">Cor</label>
          <div class="flex gap-2">
            <button
              v-for="color in colors"
              :key="color"
              type="button"
              class="color-choice"
              :class="[`color-${color}`, { active: eventForm.color === color }]"
              :aria-label="color"
              @click="eventForm.color = color"
            ></button>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-2">
          <button v-if="eventForm.id" type="button" class="delete-button" @click="deleteEvent">Excluir</button>
          <div class="flex-1"></div>
          <button type="button" class="cancel-button" @click="closeEventModal">Cancelar</button>
          <button type="submit" class="save-button">Salvar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import Modal from '../components/ui/Modal.vue'
import { useTaskStore } from '../stores/tasks'
import { useToast } from '../composables/useToast'

const router = useRouter()
const taskStore = useTaskStore()
const toast = useToast()
const viewMode = ref('month')
const cursor = ref(startOfDay(new Date()))
const selectedDate = ref(dateKey(new Date()))
const events = ref([])
const showEventModal = ref(false)
const eventForm = reactive({ id: null, title: '', description: '', event_date: '', event_time: '', color: 'terra' })
const modes = [{ value: 'month', label: 'Mês' }, { value: 'week', label: 'Semana' }, { value: 'day', label: 'Dia' }]
const colors = ['terra', 'olive', 'blue', 'amber']
const weekdays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const todayKey = dateKey(new Date())

const visibleDays = computed(() => {
  if (viewMode.value === 'day') return [dayObject(cursor.value, true)]
  if (viewMode.value === 'week') {
    const start = startOfWeek(cursor.value)
    return Array.from({ length: 7 }, (_, index) => dayObject(addDays(start, index), true))
  }
  const first = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const gridStart = startOfWeek(first)
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    return dayObject(date, date.getMonth() === cursor.value.getMonth())
  })
})
const visibleWeekdays = computed(() => viewMode.value === 'week'
  ? visibleDays.value.map((day) => day.date.toLocaleDateString('pt-BR', { weekday: 'short' }))
  : weekdays
)
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${viewMode.value === 'day' ? 1 : 7}, minmax(0, 1fr))` }))
const periodLabel = computed(() => {
  if (viewMode.value === 'day') return fullDayLabel(cursor.value)
  if (viewMode.value === 'week') {
    const start = startOfWeek(cursor.value)
    const end = addDays(start, 6)
    return `${shortDate(start)} — ${shortDate(end)}`
  }
  return cursor.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})
const unscheduledTasks = computed(() => taskStore.tasks.filter((task) => task.status !== 'done' && !task.due_date))

function startOfDay(value) { const date = new Date(value); date.setHours(0, 0, 0, 0); return date }
function startOfWeek(value) { const date = startOfDay(value); date.setDate(date.getDate() - date.getDay()); return date }
function addDays(value, amount) { const date = new Date(value); date.setDate(date.getDate() + amount); return date }
function dateKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function dayObject(date, currentMonth) { return { date, key: dateKey(date), currentMonth } }
function shortDate(date) { return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) }
function fullDayLabel(date) { return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) }
function tasksFor(key) { return taskStore.tasks.filter((task) => task.status !== 'done' && task.due_date === key) }
function eventsFor(key) { return events.value.filter((event) => event.event_date === key) }
function setMode(mode) { viewMode.value = mode; loadEvents() }
function selectDay(key) { selectedDate.value = key; cursor.value = new Date(`${key}T12:00:00`) }
function goToday() { cursor.value = startOfDay(new Date()); selectedDate.value = todayKey; loadEvents() }
function navigate(direction) {
  const date = new Date(cursor.value)
  if (viewMode.value === 'month') {
    date.setDate(1)
    date.setMonth(date.getMonth() + direction)
  }
  else if (viewMode.value === 'week') date.setDate(date.getDate() + direction * 7)
  else date.setDate(date.getDate() + direction)
  cursor.value = date
  loadEvents()
}
function range() {
  const days = visibleDays.value
  return { from: days[0].key, to: days[days.length - 1].key }
}
async function loadEvents() {
  const { from, to } = range()
  const { data } = await api.get('/workspace/events', { params: { from, to } })
  events.value = data
}
function startDrag(event, type, id) {
  event.dataTransfer.setData('application/x-mypaper-item', JSON.stringify({ type, id }))
  event.dataTransfer.effectAllowed = 'move'
}
async function dropOnDate(event, key) {
  const raw = event.dataTransfer.getData('application/x-mypaper-item')
  if (!raw) return
  const item = JSON.parse(raw)
  if (item.type === 'task') {
    await taskStore.update(item.id, { due_date: key })
    toast.success('Tarefa reagendada')
  } else {
    const { data } = await api.put(`/workspace/events/${item.id}`, { event_date: key })
    const index = events.value.findIndex((row) => row.id === item.id)
    if (index !== -1) events.value[index] = data
  }
}
function openTask(task) { router.push({ path: '/tarefas', query: { open: task.id } }) }
function openNewEvent(date) {
  Object.assign(eventForm, { id: null, title: '', description: '', event_date: date || todayKey, event_time: '', color: 'terra' })
  showEventModal.value = true
}
function editEvent(event) {
  Object.assign(eventForm, { ...event, event_time: event.event_time || '' })
  showEventModal.value = true
}
function closeEventModal() { showEventModal.value = false }
async function saveEvent() {
  if (eventForm.id) {
    const { data } = await api.put(`/workspace/events/${eventForm.id}`, eventForm)
    const index = events.value.findIndex((item) => item.id === eventForm.id)
    if (index !== -1) events.value[index] = data
  } else {
    const { data } = await api.post('/workspace/events', eventForm)
    events.value.push(data)
  }
  closeEventModal()
  toast.success('Agenda atualizada')
}
async function deleteEvent() {
  await api.delete(`/workspace/events/${eventForm.id}`)
  events.value = events.value.filter((item) => item.id !== eventForm.id)
  closeEventModal()
}
onMounted(async () => {
  await Promise.all([taskStore.fetch(), loadEvents()])
})
</script>

<style scoped>
.eyebrow{color:var(--accent-terra);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em}.agenda-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:1rem;align-items:start}
.mode-picker{display:flex;padding:.2rem;background:rgba(253,251,245,.58);border:1px solid var(--paper-border);border-radius:3px}.mode-picker button{padding:.42rem .7rem;color:var(--ink-muted);font-size:.68rem;font-weight:700;border-radius:2px}.mode-picker button.active{color:#7a3927;background:#edc9ae}
.today-button,.event-button{padding:.55rem .8rem;border-radius:3px;font-size:.72rem;font-weight:700}.today-button{color:var(--ink-primary);background:rgba(253,251,245,.65);border:1px solid var(--paper-border)}.event-button{color:white;background:var(--accent-terra)}
.unscheduled-postit{padding:1rem;background:#f3e5a9;border:1px solid rgba(112,91,48,.1);border-radius:3px;box-shadow:0 10px 24px rgba(74,57,29,.1);position:sticky;top:1rem}.count{display:grid;place-items:center;min-width:26px;height:26px;color:#674a0b;background:#f2d99b;border-radius:50%;font-size:.7rem;font-weight:800}
.unscheduled-task{display:flex;align-items:flex-start;gap:.6rem;width:100%;padding:.6rem;text-align:left;background:rgba(253,251,245,.55);border:1px solid rgba(94,79,45,.1);border-radius:3px;cursor:grab}.unscheduled-task strong{display:block;font-size:.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.unscheduled-task small{display:block;color:var(--ink-faint);font-size:.6rem;margin-top:.1rem}
.priority-dot{width:7px;height:7px;margin-top:.32rem;border-radius:50%;flex:none}.priority-high{background:#b8593d}.priority-medium{background:#c89a3f}.priority-low{background:#8a8172}
.calendar-postit{padding:.75rem;background:#c9dadd;border:1px solid rgba(44,74,92,.12);border-radius:3px;box-shadow:0 12px 28px rgba(74,57,29,.11);overflow:hidden}.calendar-toolbar{display:flex;align-items:center;justify-content:center;gap:1rem;padding:.35rem .2rem .85rem}.calendar-toolbar h2{min-width:220px;text-align:center;text-transform:capitalize;font-size:1.15rem}.calendar-toolbar button{padding:.3rem .55rem;color:var(--ink-muted);font-size:1rem}
.weekday-row,.calendar-days{display:grid}.weekday-row span{text-align:center;padding:.35rem;color:var(--ink-faint);font-size:.58rem;font-weight:800;text-transform:uppercase}
.calendar-cell{position:relative;min-height:118px;padding:.35rem;border-top:1px solid rgba(44,74,92,.12);border-right:1px solid rgba(44,74,92,.08);background:rgba(253,251,245,.28);overflow:hidden}.calendar-cell.muted{opacity:.45}.calendar-cell.today{box-shadow:inset 0 0 0 2px rgba(184,89,61,.5)}.calendar-cell.selected{background:rgba(253,251,245,.48)}.mode-week .calendar-cell{min-height:520px}.mode-day .calendar-cell{min-height:620px}.day-number{display:block;color:var(--ink-muted);font:600 .68rem 'JetBrains Mono',monospace;text-transform:capitalize}.mode-day .day-number{font-family:'Fraunces',serif;font-size:1.25rem;color:var(--ink-heading);margin:.5rem}
.day-items{display:flex;flex-direction:column;gap:.25rem;margin-top:.35rem}.calendar-item{display:flex;align-items:center;gap:.25rem;min-width:0;width:100%;padding:.25rem .35rem;text-align:left;border-left:3px solid;border-radius:2px;background:rgba(253,251,245,.72);font-size:.62rem}.calendar-item strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.calendar-item time{font:500 .55rem 'JetBrains Mono',monospace}.task-item span{opacity:.55}.priority-border-high{border-color:#b8593d}.priority-border-medium{border-color:#c89a3f}.priority-border-low{border-color:#8a8172}.event-terra{border-color:#b8593d}.event-olive{border-color:#6b7a3f}.event-blue{border-color:#2c4a5c}.event-amber{border-color:#c89a3f}
.add-on-day{position:absolute;right:.25rem;top:.2rem;opacity:0;color:var(--accent-terra);font-size:1rem}.calendar-cell:hover .add-on-day{opacity:1}
.empty-copy{padding:1rem 0;color:var(--ink-faint);font-family:'Fraunces',serif;font-size:.78rem;font-style:italic}.field-label{display:block;margin-bottom:.3rem;color:var(--ink-muted);font-size:.7rem;font-weight:700}.field-input{width:100%;padding:.65rem .75rem;color:var(--ink-primary);background:var(--paper-surface);border:1px solid var(--paper-border);border-radius:3px;outline:none}.field-input:focus{border-color:var(--accent-terra)}
.color-choice{width:25px;height:25px;border-radius:50%;border:3px solid transparent}.color-choice.active{box-shadow:0 0 0 2px var(--ink-primary)}.color-terra{background:#b8593d}.color-olive{background:#6b7a3f}.color-blue{background:#2c4a5c}.color-amber{background:#c89a3f}
.delete-button,.cancel-button,.save-button{padding:.55rem .8rem;border-radius:3px;font-size:.75rem;font-weight:700}.delete-button{color:#722c20;background:#f0bdb2}.cancel-button{color:var(--ink-muted)}.save-button{color:white;background:var(--accent-terra)}
@media(max-width:900px){.agenda-layout{grid-template-columns:1fr}.unscheduled-postit{position:relative;top:auto}.calendar-postit{overflow-x:auto}.calendar-days,.weekday-row{min-width:780px}.mode-day.calendar-days{min-width:0}.mode-week .calendar-cell{min-height:360px}}
</style>
