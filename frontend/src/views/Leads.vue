<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-white">Leads</h1>
      <button @click="openCreate" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
        + Novo lead
      </button>
    </div>

    <!-- Pipeline - scroll horizontal no mobile -->
    <div class="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
      <div v-for="col in pipeline" :key="col.key" class="bg-gray-900 border border-gray-800 rounded-xl p-3 min-w-[200px] flex-shrink-0 flex-1">
        <div class="flex items-center justify-between mb-3 px-1">
          <h3 class="text-xs font-semibold" :class="col.color">{{ col.label }}</h3>
          <span class="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded-full text-gray-400">{{ leadStore.byStatus(col.key).length }}</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="lead in leadStore.byStatus(col.key)"
            :key="lead.id"
            class="bg-gray-800 p-3 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
            @click="editLead(lead)"
          >
            <p class="text-sm font-medium text-gray-200">{{ lead.name }}</p>
            <p v-if="lead.company" class="text-xs text-gray-500 mt-0.5">{{ lead.company }}</p>
            <p v-if="lead.value_estimate > 0" class="text-xs font-medium text-green-400 mt-1">{{ formatCurrency(lead.value_estimate) }}</p>
            <div class="flex mt-2">
              <button v-if="col.prev" @click.stop="moveLead(lead, col.prev)" class="text-gray-600 hover:text-gray-400 text-xs">◀</button>
              <button v-if="col.next" @click.stop="moveLead(lead, col.next)" class="text-gray-600 hover:text-blue-400 text-xs ml-auto">▶</button>
            </div>
          </div>
          <p v-if="leadStore.byStatus(col.key).length === 0" class="text-center text-xs text-gray-600 py-6">Vazio</p>
        </div>
      </div>
    </div>

    <!-- Modal criar/editar -->
    <Modal :show="showModal" :title="editing ? 'Editar lead' : 'Novo lead'" @close="closeModal">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
          <input v-model="form.name" type="text" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
            <input v-model="form.phone" type="text" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Empresa</label>
          <input v-model="form.company" type="text" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select v-model="form.status" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="novo">Novo</option>
              <option value="contato">Em contato</option>
              <option value="negociando">Negociando</option>
              <option value="ganho">Ganho</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Valor estimado</label>
            <input v-model="form.value_estimate" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tipo de pagamento</label>
          <select v-model="form.payment_type" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option value="pagamento_unico">Pagamento único</option>
            <option value="parcelado">Parcelado</option>
            <option value="recorrente">Mensalidade (recorrente)</option>
            <option value="implantacao_parcelas">Implantação + Parcelas</option>
            <option value="implantacao_recorrente">Implantação + Mensalidade</option>
          </select>
        </div>
        <div v-if="leadFormHasSetup || leadFormHasInstallments || leadFormHasMonthly" class="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-3">
          <div v-if="leadFormHasSetup">
            <label class="block text-xs font-medium text-gray-400 mb-1">Valor de implantação</label>
            <input v-model.number="form.setup_value" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div v-if="leadFormHasInstallments || leadFormHasSingle">
            <label class="block text-xs font-medium text-gray-400 mb-1">{{ leadFormHasSingle ? 'Valor total' : 'Valor das parcelas (total)' }}</label>
            <input v-model.number="form.value_estimate" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div v-if="leadFormHasMonthly">
            <label class="block text-xs font-medium text-gray-400 mb-1">Valor da mensalidade</label>
            <input v-model.number="form.monthly_fee" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Notas</label>
          <textarea v-model="form.notes" rows="2" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"></textarea>
        </div>

        <div class="flex gap-3 pt-2">
          <button v-if="editing && editing.status === 'ganho'" type="button" @click="createProjectFromLead" class="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg">Criar projeto</button>
          <button v-if="editing" type="button" @click="deleteLead" class="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">Excluir</button>
          <div class="flex-1"></div>
          <button type="button" @click="closeModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>

    <!-- Modal criar projeto -->
    <Modal :show="showProjectModal" title="Criar projeto" @close="showProjectModal = false">
      <form @submit.prevent="saveProject" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Nome do projeto *</label>
          <input v-model="projectForm.name" type="text" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tipo de pagamento</label>
          <select v-model="projectForm.payment_type" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option value="pagamento_unico">Pagamento único</option>
            <option value="parcelado">Parcelado</option>
            <option value="recorrente">Mensalidade (recorrente)</option>
            <option value="implantacao_parcelas">Implantação + Parcelas</option>
            <option value="implantacao_recorrente">Implantação + Mensalidade</option>
          </select>
        </div>
        <div v-if="leadHasSetup" class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
          <label class="block text-sm font-medium text-gray-300 mb-1">Valor de implantação</label>
          <input v-model.number="projectForm.setup_value" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div v-if="leadHasInstallments || leadHasSingle">
          <label class="block text-sm font-medium text-gray-300 mb-1">{{ leadHasSingle ? 'Valor total' : 'Valor das parcelas (total)' }}</label>
          <input v-model.number="projectForm.total_value" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div v-if="leadHasMonthly">
          <label class="block text-sm font-medium text-gray-300 mb-1">Valor da mensalidade</label>
          <input v-model.number="projectForm.monthly_fee" type="number" step="0.01" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Data início</label>
            <input v-model="projectForm.start_date" type="date" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Prazo final</label>
            <input v-model="projectForm.end_date" type="date" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <div class="flex-1"></div>
          <button type="button" @click="showProjectModal = false" class="px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Criar projeto</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useLeadStore } from '../stores/leads'
import { useProjectStore } from '../stores/projects'
import Modal from '../components/ui/Modal.vue'

const leadStore = useLeadStore()
const projectStore = useProjectStore()

const pipeline = [
  { key: 'novo', label: 'Novos', color: 'text-gray-400', prev: null, next: 'contato', nextLabel: 'Contato' },
  { key: 'contato', label: 'Em contato', color: 'text-blue-400', prev: 'novo', next: 'negociando', nextLabel: 'Negociar' },
  { key: 'negociando', label: 'Negociando', color: 'text-yellow-400', prev: 'contato', next: 'ganho', nextLabel: 'Ganhar' },
  { key: 'ganho', label: 'Ganhos', color: 'text-green-400', prev: 'negociando', next: 'perdido', nextLabel: 'Perder' },
  { key: 'perdido', label: 'Perdidos', color: 'text-red-400', prev: 'ganho', next: null, nextLabel: '' }
]

const showModal = ref(false)
const editing = ref(null)
const form = reactive({ name: '', email: '', phone: '', company: '', status: 'novo', notes: '', value_estimate: 0, setup_value: 0, monthly_fee: 0, payment_type: 'pagamento_unico' })

const showProjectModal = ref(false)
const projectForm = reactive({ name: '', description: '', total_value: 0, setup_value: 0, setup_installments: 1, monthly_fee: 0, monthly_cycle: 'mensal', annual_installments: 1, payment_type: 'pagamento_unico', start_date: '', end_date: '' })

const leadHasSetup = computed(() => ['implantacao_parcelas', 'implantacao_recorrente'].includes(projectForm.payment_type))
const leadHasInstallments = computed(() => ['parcelado', 'implantacao_parcelas'].includes(projectForm.payment_type))
const leadHasSingle = computed(() => projectForm.payment_type === 'pagamento_unico')
const leadHasMonthly = computed(() => ['recorrente', 'implantacao_recorrente'].includes(projectForm.payment_type))

// Para o formulário de lead
const leadFormHasSetup = computed(() => ['implantacao_parcelas', 'implantacao_recorrente'].includes(form.payment_type))
const leadFormHasInstallments = computed(() => ['parcelado', 'implantacao_parcelas'].includes(form.payment_type))
const leadFormHasSingle = computed(() => form.payment_type === 'pagamento_unico')
const leadFormHasMonthly = computed(() => ['recorrente', 'implantacao_recorrente'].includes(form.payment_type))

function formatCurrency(val) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) }

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', email: '', phone: '', company: '', status: 'novo', notes: '', value_estimate: 0, setup_value: 0, monthly_fee: 0, payment_type: 'pagamento_unico' })
  showModal.value = true
}
function editLead(lead) { editing.value = lead; Object.assign(form, lead); showModal.value = true }
function closeModal() { showModal.value = false; editing.value = null }

async function save() {
  if (editing.value) await leadStore.update(editing.value.id, { ...form })
  else await leadStore.create({ ...form })
  closeModal()
}
async function deleteLead() { if (confirm('Excluir?')) { await leadStore.remove(editing.value.id); closeModal() } }
async function moveLead(lead, nextStatus) { await leadStore.update(lead.id, { status: nextStatus }) }

function createProjectFromLead() {
  const lead = editing.value
  projectForm.name = lead.company ? `${lead.name} - ${lead.company}` : lead.name
  projectForm.description = lead.notes || ''
  projectForm.total_value = lead.value_estimate || 0
  projectForm.setup_value = lead.setup_value || 0
  projectForm.monthly_fee = lead.monthly_fee || 0
  projectForm.payment_type = lead.payment_type || 'pagamento_unico'
  projectForm.start_date = new Date().toISOString().split('T')[0]
  projectForm.end_date = ''
  showProjectModal.value = true
}
async function saveProject() {
  await projectStore.create({ ...projectForm, lead_id: editing.value.id })
  showProjectModal.value = false
}

onMounted(() => leadStore.fetch())
</script>
