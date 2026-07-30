<template>
  <section class="relations-panel">
    <div class="flex items-center justify-between gap-3 mb-2">
      <div>
        <p class="text-[10px] uppercase tracking-[.14em] font-bold text-terra-600">Conexões</p>
        <p class="text-xs text-ink-50">Conteúdos relacionados a este item</p>
      </div>
      <button
        type="button"
        class="px-2.5 py-1.5 text-xs font-semibold text-terra-600 border border-terra-500/25 bg-white/40 rounded-[3px]"
        @click="showAdd = !showAdd"
      >
        {{ showAdd ? 'Fechar' : '+ Relacionar' }}
      </button>
    </div>

    <div v-if="showAdd" class="grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] gap-2 mb-3">
      <select v-model="targetType" class="relation-input" @change="loadTargets">
        <option value="task">Tarefa</option>
        <option value="note">Anotação</option>
        <option value="project">Projeto</option>
        <option value="flowchart">Fluxograma</option>
      </select>
      <select v-model="targetId" class="relation-input">
        <option value="">Selecione o conteúdo</option>
        <option v-for="item in availableTargets" :key="item.id" :value="item.id">
          {{ item.title }}
        </option>
      </select>
      <button
        type="button"
        :disabled="!targetId || saving"
        class="px-3 py-2 bg-terra-500 text-white text-xs font-semibold rounded-[3px] disabled:opacity-40"
        @click="createRelation"
      >
        Conectar
      </button>
    </div>

    <div v-if="relations.length" class="flex flex-wrap gap-2">
      <div
        v-for="relation in relations"
        :key="relation.id"
        class="relation-chip group"
      >
        <button type="button" class="min-w-0 text-left" @click="openRelation(relation)">
          <span class="block text-[9px] uppercase tracking-wider opacity-60">{{ typeLabel(relation.type) }}</span>
          <span class="block text-xs font-semibold truncate max-w-[190px]">{{ relation.title }}</span>
        </button>
        <button
          type="button"
          class="opacity-50 group-hover:opacity-100 text-terra-600 p-1"
          aria-label="Remover relação"
          @click="removeRelation(relation.id)"
        >
          ×
        </button>
      </div>
    </div>
    <p v-else-if="!loading" class="text-xs text-ink-50 italic">Nenhuma conexão adicionada.</p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useToast } from '../composables/useToast'
import { useRealtimeRefresh } from '../composables/useRealtimeRefresh'

const props = defineProps({
  entityType: { type: String, required: true },
  entityId: { type: [Number, String], required: true },
})

const router = useRouter()
const toast = useToast()
const relations = ref([])
const targets = ref([])
const targetType = ref('task')
const targetId = ref('')
const showAdd = ref(false)
const loading = ref(false)
const saving = ref(false)

const availableTargets = computed(() =>
  targets.value.filter((item) =>
    !(targetType.value === props.entityType && Number(item.id) === Number(props.entityId)) &&
    !relations.value.some((relation) => relation.type === targetType.value && Number(relation.entity_id) === Number(item.id))
  )
)

async function load() {
  if (!props.entityId) return
  loading.value = true
  try {
    const { data } = await api.get(`/workspace/relations/${props.entityType}/${props.entityId}`)
    relations.value = data
  } finally {
    loading.value = false
  }
}

async function loadTargets() {
  targetId.value = ''
  const endpoints = {
    task: '/tasks',
    note: '/notes',
    project: '/projects',
    flowchart: '/flowcharts',
  }
  const { data } = await api.get(endpoints[targetType.value])
  targets.value = data.map((item) => ({
    id: item.id,
    title: item.title || item.name || 'Sem título',
  }))
}

async function createRelation() {
  if (!targetId.value) return
  saving.value = true
  try {
    await api.post('/workspace/relations', {
      source_type: props.entityType,
      source_id: props.entityId,
      target_type: targetType.value,
      target_id: Number(targetId.value),
    })
    await load()
    targetId.value = ''
    showAdd.value = false
    toast.success('Conteúdos conectados')
  } catch (error) {
    toast.error(error.response?.data?.error || 'Não foi possível criar a conexão')
  } finally {
    saving.value = false
  }
}

async function removeRelation(id) {
  await api.delete(`/workspace/relations/${id}`)
  relations.value = relations.value.filter((item) => item.id !== id)
}

function openRelation(relation) {
  const routes = {
    task: { path: '/tarefas', query: { open: relation.entity_id } },
    note: { path: '/anotacoes', query: { open: relation.entity_id } },
    project: { path: '/projetos', query: { open: relation.entity_id } },
    flowchart: { path: '/fluxogramas', query: { open: relation.entity_id } },
  }
  router.push(routes[relation.type])
}
function typeLabel(type) {
  return { task: 'Tarefa', note: 'Anotação', project: 'Projeto', flowchart: 'Fluxograma' }[type] || type
}

useRealtimeRefresh(load, ['/api/workspace/relations'])
watch(() => [props.entityType, props.entityId], load)
onMounted(async () => {
  await Promise.all([load(), loadTargets()])
})
</script>

<style scoped>
.relations-panel {
  padding: .9rem;
  background: rgba(199, 216, 220, .72);
  border: 1px solid rgba(44, 74, 92, .12);
  border-radius: 3px;
}
.relation-input {
  min-width: 0;
  padding: .5rem .65rem;
  color: var(--ink-primary);
  background: rgba(253, 251, 245, .9);
  border: 1px solid var(--paper-border);
  border-radius: 3px;
  font-size: .75rem;
  outline: none;
}
.relation-chip {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .4rem .55rem .4rem .7rem;
  color: #2c4a5c;
  background: rgba(253, 251, 245, .72);
  border: 1px solid rgba(44, 74, 92, .13);
  border-radius: 3px;
}
</style>
