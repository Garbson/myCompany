<template>
  <div class="max-w-6xl mx-auto pb-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 md:py-6">
      <div>
        <p class="eyebrow">Capture primeiro, organize depois</p>
        <h1 class="text-3xl md:text-5xl font-semibold mt-1">Caixa de entrada</h1>
        <p class="text-sm text-ink-100 mt-2">{{ items.length }} itens esperando uma decisão</p>
      </div>
      <button class="history-button" @click="showProcessed = !showProcessed; load()">
        {{ showProcessed ? 'Voltar às pendências' : 'Ver organizados' }}
      </button>
    </header>

    <form class="inbox-composer" @submit.prevent="add">
      <textarea
        v-model="content"
        rows="3"
        placeholder="Jogue aqui tudo que está na sua cabeça…"
        class="flex-1 bg-transparent outline-none resize-none text-ink-400 placeholder-ink-50"
      ></textarea>
      <div class="flex flex-col sm:flex-row gap-2 sm:items-end justify-between">
        <div class="flex gap-2">
          <button
            v-for="option in kinds"
            :key="option.value"
            type="button"
            class="kind-button"
            :class="{ active: kind === option.value }"
            @click="kind = option.value"
          >{{ option.label }}</button>
        </div>
        <button type="submit" :disabled="!content.trim()" class="save-button">Guardar</button>
      </div>
    </form>

    <div class="mt-5 space-y-3">
      <article v-for="item in items" :key="item.id" class="inbox-card" :class="`kind-${item.kind}`">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="kind-label">{{ kindLabel(item.kind) }}</span>
            <time>{{ formatDate(item.created_at) }}</time>
          </div>
          <p>{{ item.content }}</p>
          <span v-if="item.processed" class="processed-label">
            {{ processedLabel(item) }}
          </span>
        </div>
        <div v-if="!item.processed" class="card-actions">
          <button class="action-task" @click="convert(item, 'task')">Virar tarefa</button>
          <button class="action-note" @click="convert(item, 'note')">Virar nota</button>
          <button class="action-archive" title="Arquivar" @click="archive(item)">✓</button>
          <button class="action-delete" title="Excluir" @click="remove(item)">×</button>
        </div>
      </article>
      <div v-if="!items.length" class="empty-inbox">
        <div class="text-4xl mb-3">✓</div>
        <h2>{{ showProcessed ? 'Nenhum item organizado ainda' : 'Sua caixa está vazia' }}</h2>
        <p>{{ showProcessed ? 'As capturas convertidas aparecerão aqui.' : 'Tudo foi decidido. Aproveite o espaço mental.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useToast } from '../composables/useToast'
import { hapticSuccess } from '../services/haptics'
import { useRealtimeRefresh } from '../composables/useRealtimeRefresh'

const router = useRouter()
const toast = useToast()
const items = ref([])
const content = ref('')
const kind = ref('capture')
const showProcessed = ref(false)
const kinds = [
  { value: 'capture', label: 'Ideia' },
  { value: 'task', label: 'Tarefa' },
  { value: 'note', label: 'Nota' },
]

async function load() {
  const { data } = await api.get('/workspace/inbox', { params: { processed: showProcessed.value ? 1 : 0 } })
  items.value = data
}
async function add() {
  if (!content.value.trim()) return
  const { data } = await api.post('/workspace/inbox', { content: content.value, kind: kind.value })
  items.value.unshift(data)
  content.value = ''
  kind.value = 'capture'
  window.dispatchEvent(new CustomEvent('inbox:changed'))
}
async function convert(item, targetType) {
  try {
    const { data } = await api.post(`/workspace/inbox/${item.id}/convert`, { target_type: targetType })
    items.value = items.value.filter((row) => row.id !== item.id)
    window.dispatchEvent(new CustomEvent('inbox:changed'))
    hapticSuccess()
    toast.success(targetType === 'task' ? 'Transformado em tarefa' : 'Transformado em anotação')
    if (targetType === 'task') router.push({ path: '/tarefas', query: { open: data.id } })
    else router.push({ path: '/anotacoes', query: { open: data.id } })
  } catch (error) {
    toast.error(error.response?.data?.error || 'Não foi possível organizar')
  }
}
async function archive(item) {
  await api.put(`/workspace/inbox/${item.id}`, { processed: true })
  items.value = items.value.filter((row) => row.id !== item.id)
  window.dispatchEvent(new CustomEvent('inbox:changed'))
}
async function remove(item) {
  await api.delete(`/workspace/inbox/${item.id}`)
  items.value = items.value.filter((row) => row.id !== item.id)
  window.dispatchEvent(new CustomEvent('inbox:changed'))
}
function kindLabel(value) { return { capture: 'Ideia', task: 'Tarefa', note: 'Nota' }[value] || 'Captura' }
function processedLabel(item) {
  if (item.processed_type === 'task') return 'Organizado como tarefa'
  if (item.processed_type === 'note') return 'Organizado como anotação'
  return 'Arquivado'
}
function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function onChanged() { if (!showProcessed.value) load() }
useRealtimeRefresh(load, ['/api/workspace/inbox'])
onMounted(() => { load(); window.addEventListener('inbox:changed', onChanged) })
onBeforeUnmount(() => window.removeEventListener('inbox:changed', onChanged))
</script>

<style scoped>
.eyebrow{color:var(--accent-terra);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em}
.history-button{padding:.6rem .85rem;color:var(--accent-terra);background:rgba(253,251,245,.62);border:1px solid var(--paper-border);border-radius:3px;font-size:.75rem;font-weight:700}
.inbox-composer{display:flex;flex-direction:column;gap:1rem;padding:1rem;background:#fff4c2;border:1px solid rgba(112,91,48,.12);border-radius:3px;box-shadow:0 10px 24px rgba(74,57,29,.11)}
.kind-button{padding:.35rem .65rem;color:var(--ink-muted);background:rgba(253,251,245,.5);border:1px solid var(--paper-border);border-radius:3px;font-size:.68rem;font-weight:700}.kind-button.active{color:#674a0b;background:#f2d99b;border-color:#b88627}
.save-button{padding:.55rem 1rem;color:white;background:var(--accent-terra);border-radius:3px;font-size:.75rem;font-weight:700}.save-button:disabled{opacity:.4}
.inbox-card{display:flex;flex-direction:column;gap:1rem;padding:1rem 1.1rem;border:1px solid rgba(112,91,48,.1);border-radius:3px;box-shadow:0 8px 18px rgba(74,57,29,.09)}.kind-capture{background:#f3e5a9}.kind-task{background:#cfdcb5}.kind-note{background:#c9dadd}
.inbox-card p{white-space:pre-wrap;color:var(--ink-primary);font-size:.9rem}.inbox-card time{color:var(--ink-faint);font-size:.62rem}.kind-label,.processed-label{color:var(--accent-terra);font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em}.processed-label{display:block;margin-top:.65rem}
.card-actions{display:flex;gap:.45rem;flex-wrap:wrap}.card-actions button{padding:.45rem .65rem;border-radius:3px;font-size:.68rem;font-weight:700}.action-task{color:#2f5428;background:#c5dfc0}.action-note{color:#233f4d;background:#c7d8dc}.action-archive{color:#674a0b;background:#f2d99b}.action-delete{color:#722c20;background:#f0bdb2}
.empty-inbox{text-align:center;padding:4rem 1rem;color:var(--ink-faint)}.empty-inbox h2{font-size:1.35rem}.empty-inbox p{font-size:.82rem;margin-top:.4rem}
@media(min-width:768px){.inbox-card{flex-direction:row;align-items:center}.card-actions{flex:none}}
</style>
