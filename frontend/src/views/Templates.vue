<template>
  <div class="max-w-[1300px] mx-auto pb-8">
    <header class="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 md:py-6">
      <div>
        <p class="eyebrow">Comece com uma página pronta</p>
        <h1 class="text-3xl md:text-5xl font-semibold mt-1">Templates</h1>
        <p class="text-sm text-ink-100 mt-2">Modelos para tarefas, notas, projetos e fluxogramas.</p>
      </div>
      <button class="new-template-button" @click="openCreate">+ Criar template</button>
    </header>

    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        v-for="filterItem in filters"
        :key="filterItem.value"
        class="filter-button"
        :class="{ active: filter === filterItem.value }"
        @click="filter = filterItem.value"
      >
        {{ filterItem.label }}
      </button>
    </div>

    <div class="template-grid mt-4">
      <article
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        :class="`template-${template.target_type}`"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="type-pill">{{ typeLabel(template.target_type) }}</span>
          <button
            v-if="!template.system"
            class="delete-template"
            title="Excluir template"
            @click="remove(template)"
          >×</button>
        </div>
        <div class="flex-1">
          <h2>{{ template.name }}</h2>
          <p>{{ template.description || 'Seu modelo personalizado.' }}</p>
        </div>
        <button class="use-button" :disabled="applying === template.id" @click="apply(template)">
          {{ applying === template.id ? 'Criando…' : 'Usar template →' }}
        </button>
      </article>
    </div>

    <Modal :show="showCreate" title="Novo template" size="md" @close="showCreate = false">
      <form class="space-y-4" @submit.prevent="create">
        <div>
          <label class="field-label">Nome do template</label>
          <input v-model="form.name" required class="field-input" placeholder="Ex.: Relatório mensal"/>
        </div>
        <div>
          <label class="field-label">Descrição</label>
          <input v-model="form.description" class="field-input" placeholder="Quando usar este modelo?"/>
        </div>
        <div>
          <label class="field-label">Tipo de conteúdo</label>
          <select v-model="form.target_type" class="field-input">
            <option value="note">Anotação</option>
            <option value="task">Tarefa</option>
            <option value="project">Projeto</option>
            <option value="flowchart">Fluxograma</option>
          </select>
        </div>
        <div>
          <label class="field-label">{{ contentLabel }}</label>
          <input v-model="form.content_title" required class="field-input" :placeholder="contentPlaceholder"/>
        </div>
        <div v-if="form.target_type !== 'flowchart'">
          <label class="field-label">{{ form.target_type === 'note' ? 'Estrutura inicial' : 'Descrição inicial' }}</label>
          <textarea v-model="form.body" rows="5" class="field-input resize-none" placeholder="Escreva a estrutura que deverá aparecer ao usar o template…"></textarea>
        </div>
        <div v-if="form.target_type === 'task' || form.target_type === 'project'">
          <label class="field-label">Prioridade padrão</label>
          <select v-model="form.priority" class="field-input">
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" class="cancel-button" @click="showCreate = false">Cancelar</button>
          <button type="submit" class="save-button">Salvar template</button>
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
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()
const templates = ref([])
const filter = ref('all')
const applying = ref(null)
const showCreate = ref(false)
const filters = [
  { value: 'all', label: 'Todos' },
  { value: 'note', label: 'Anotações' },
  { value: 'task', label: 'Tarefas' },
  { value: 'project', label: 'Projetos' },
  { value: 'flowchart', label: 'Fluxogramas' },
]
const form = reactive({
  name: '',
  description: '',
  target_type: 'note',
  content_title: '',
  body: '',
  priority: 'medium',
})

const filteredTemplates = computed(() =>
  filter.value === 'all' ? templates.value : templates.value.filter((item) => item.target_type === filter.value)
)
const contentLabel = computed(() => ({
  note: 'Título da anotação',
  task: 'Título da tarefa',
  project: 'Nome do projeto',
  flowchart: 'Nome do fluxograma',
}[form.target_type]))
const contentPlaceholder = computed(() => ({
  note: 'Ex.: Revisão mensal',
  task: 'Ex.: Publicar nova versão',
  project: 'Ex.: Novo produto',
  flowchart: 'Ex.: Processo de atendimento',
}[form.target_type]))

async function load() {
  const { data } = await api.get('/workspace/templates')
  templates.value = data
}
function openCreate() {
  Object.assign(form, { name: '', description: '', target_type: 'note', content_title: '', body: '', priority: 'medium' })
  showCreate.value = true
}
function noteDocument(text) {
  const paragraphs = (text || '').split('\n').map((line) => ({
    type: 'paragraph',
    content: line ? [{ type: 'text', text: line }] : [],
  }))
  return JSON.stringify({ type: 'doc', content: paragraphs.length ? paragraphs : [{ type: 'paragraph' }] })
}
function payloadFromForm() {
  if (form.target_type === 'note') return { title: form.content_title, content: noteDocument(form.body) }
  if (form.target_type === 'task') return { title: form.content_title, description: form.body, priority: form.priority, difficulty: 'medium' }
  if (form.target_type === 'project') return { name: form.content_title, description: form.body, priority: form.priority }
  return { title: form.content_title, data: { nodes: [], edges: [] } }
}
async function create() {
  await api.post('/workspace/templates', {
    name: form.name,
    description: form.description,
    target_type: form.target_type,
    payload: payloadFromForm(),
  })
  showCreate.value = false
  await load()
  toast.success('Template salvo')
}
async function apply(template) {
  applying.value = template.id
  try {
    const { data } = await api.post(`/workspace/templates/${template.id}/apply`)
    toast.success('Conteúdo criado pelo template')
    const routes = {
      task: { path: '/tarefas', query: { open: data.id } },
      note: { path: '/anotacoes', query: { open: data.id } },
      project: { path: '/projetos', query: { open: data.id } },
      flowchart: { path: '/fluxogramas', query: { open: data.id } },
    }
    router.push(routes[data.type])
  } catch (error) {
    toast.error(error.response?.data?.error || 'Não foi possível usar o template')
  } finally {
    applying.value = null
  }
}
async function remove(template) {
  await api.delete(`/workspace/templates/${template.id}`)
  templates.value = templates.value.filter((item) => item.id !== template.id)
}
function typeLabel(type) { return { note: 'Anotação', task: 'Tarefa', project: 'Projeto', flowchart: 'Fluxograma' }[type] || type }
onMounted(load)
</script>

<style scoped>
.eyebrow{color:var(--accent-terra);font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em}.new-template-button{padding:.65rem .9rem;color:white;background:var(--accent-terra);border-radius:3px;font-size:.75rem;font-weight:800}
.filter-button{flex:none;padding:.45rem .75rem;color:var(--ink-muted);background:rgba(253,251,245,.58);border:1px solid var(--paper-border);border-radius:3px;font-size:.7rem;font-weight:700}.filter-button.active{color:#7a3927;background:#edc9ae;border-color:rgba(184,89,61,.25)}
.template-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.template-card{min-height:230px;display:flex;flex-direction:column;gap:1rem;padding:1.15rem;border:1px solid rgba(112,91,48,.1);border-radius:3px;box-shadow:0 12px 26px rgba(74,57,29,.11)}.template-note{background:#c9dadd}.template-task{background:#f3e5a9}.template-project{background:#cfdcb5}.template-flowchart{background:#edc9ae}
.type-pill{padding:.25rem .45rem;color:var(--ink-muted);background:rgba(253,251,245,.48);border:1px solid rgba(94,79,45,.1);border-radius:2px;font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}.delete-template{color:var(--accent-terra);font-size:1.2rem}.template-card h2{font-size:1.3rem;margin-top:.25rem}.template-card p{color:var(--ink-muted);font-size:.78rem;margin-top:.5rem}.use-button{width:100%;padding:.6rem;text-align:left;color:var(--ink-heading);background:rgba(253,251,245,.48);border:1px solid rgba(94,79,45,.1);border-radius:3px;font-size:.72rem;font-weight:800}
.field-label{display:block;margin-bottom:.3rem;color:var(--ink-muted);font-size:.7rem;font-weight:700}.field-input{width:100%;padding:.65rem .75rem;color:var(--ink-primary);background:var(--paper-surface);border:1px solid var(--paper-border);border-radius:3px;outline:none}.field-input:focus{border-color:var(--accent-terra)}.cancel-button,.save-button{padding:.55rem .8rem;border-radius:3px;font-size:.75rem;font-weight:700}.cancel-button{color:var(--ink-muted)}.save-button{color:white;background:var(--accent-terra)}
@media(max-width:1000px){.template-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.template-grid{grid-template-columns:1fr}.template-card{min-height:190px}}
</style>
