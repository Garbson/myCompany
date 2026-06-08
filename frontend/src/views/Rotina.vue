<template>
  <div>
    <div class="flex items-center justify-between mb-6 md-sticky-title">
      <div>
        <h1 class="text-xl md:text-2xl font-bold text-white tracking-tight">Rotina</h1>
        <p class="text-xs text-gray-500 mt-0.5">{{ pendingToday.length }} pra hoje · {{ doneToday.length }} concluído{{ doneToday.length === 1 ? '' : 's' }}</p>
      </div>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Novo hábito
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && habits.length === 0" class="text-center py-16">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 mb-4">
        <svg class="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <p class="text-sm text-gray-300 font-medium">Comece pelo "quem você quer ser"</p>
      <p class="text-xs text-gray-500 mt-1 max-w-md mx-auto">Cada hábito vota numa identidade. Não foque no resultado — foque em virar a pessoa que faz isso.</p>
      <button
        @click="openCreate"
        class="mt-4 px-4 py-2 text-sm bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
      >Criar meu primeiro hábito</button>
    </div>

    <!-- Pra hoje -->
    <section v-if="pendingToday.length" class="mb-6">
      <h2 class="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Pra hoje</h2>
      <div class="space-y-2">
        <HabitCard
          v-for="h in pendingToday"
          :key="h.id"
          :habit="h"
          @complete="onComplete"
          @edit="openEdit"
        />
      </div>
    </section>

    <!-- Concluídos hoje -->
    <section v-if="doneToday.length" class="mb-6">
      <h2 class="text-[11px] uppercase tracking-wider text-green-500 font-semibold mb-3">✓ Concluídos hoje</h2>
      <div class="space-y-2">
        <HabitCard
          v-for="h in doneToday"
          :key="h.id"
          :habit="h"
          @uncomplete="onUncomplete"
          @edit="openEdit"
        />
      </div>
    </section>

    <!-- Folga hoje -->
    <section v-if="restToday.length" class="mb-6">
      <h2 class="text-[11px] uppercase tracking-wider text-gray-600 font-semibold mb-3">Folga hoje</h2>
      <div class="space-y-2">
        <HabitCard
          v-for="h in restToday"
          :key="h.id"
          :habit="h"
          rest
          @edit="openEdit"
        />
      </div>
    </section>

    <HabitFormModal
      :show="showModal"
      :editing="editing"
      @close="closeModal"
      @save="save"
    />

    <ConfirmDialog
      :show="!!toDelete"
      title="Excluir hábito?"
      :message="toDelete ? `“${toDelete.name}” será removido e perderá o histórico.` : ''"
      confirm-label="Excluir"
      danger
      @confirm="doDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import HabitFormModal from '../components/habits/HabitFormModal.vue'
import HabitCard from '../components/habits/HabitCard.vue'
import ConfirmDialog from '../components/ui/ConfirmDialog.vue'
import { useToast } from '../composables/useToast'
import { hapticLight, hapticSuccess } from '../services/haptics'

const toast = useToast()
const habits = ref([])
const loading = ref(false)
const showModal = ref(false)
const editing = ref(null)
const toDelete = ref(null)

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/habits')
    habits.value = data
  } catch {
    toast.error('Falha ao carregar hábitos')
  } finally {
    loading.value = false
  }
}

const pendingToday = computed(() => habits.value.filter((h) => h.show_today && !h.completed_today))
const doneToday = computed(() => habits.value.filter((h) => h.show_today && h.completed_today))
const restToday = computed(() => habits.value.filter((h) => !h.show_today))

function openCreate() { editing.value = null; showModal.value = true }
function openEdit(h) { editing.value = h; showModal.value = true }
function closeModal() { showModal.value = false; editing.value = null }

async function save(payload) {
  try {
    if (editing.value) {
      const { data } = await api.put(`/habits/${editing.value.id}`, payload)
      const i = habits.value.findIndex((h) => h.id === data.id)
      if (i !== -1) habits.value[i] = data
      toast.success('Hábito atualizado')
    } else {
      const { data } = await api.post('/habits', payload)
      habits.value.unshift(data)
      toast.success('Hábito criado')
    }
    hapticSuccess()
    closeModal()
  } catch {
    toast.error('Falha ao salvar')
  }
}

async function onComplete(h) {
  try {
    const { data } = await api.post(`/habits/${h.id}/complete`)
    const i = habits.value.findIndex((x) => x.id === data.id)
    if (i !== -1) habits.value[i] = data
    hapticSuccess()
    toast.success(`+1 pra "${h.identity ? 'quem ' + h.identity : h.name}" 🔥`)
  } catch {
    toast.error('Falha ao marcar')
  }
}

async function onUncomplete(h) {
  try {
    const { data } = await api.delete(`/habits/${h.id}/complete`)
    const i = habits.value.findIndex((x) => x.id === data.id)
    if (i !== -1) habits.value[i] = data
    hapticLight()
  } catch {
    toast.error('Falha ao desfazer')
  }
}

async function doDelete() {
  if (!toDelete.value) return
  const id = toDelete.value.id
  toDelete.value = null
  try {
    await api.delete(`/habits/${id}`)
    habits.value = habits.value.filter((h) => h.id !== id)
    toast.success('Hábito excluído')
  } catch {
    toast.error('Falha ao excluir')
  }
}

onMounted(load)
</script>
