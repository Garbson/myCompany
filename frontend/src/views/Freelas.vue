<template>
  <div>
    <div class="flex items-center justify-between mb-6 md-sticky-title">
      <h1 class="text-xl font-bold text-white">Freelas</h1>
      <button @click="openCreateProject" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
        + Novo projeto
      </button>
    </div>

    <div class="space-y-3">
      <div v-for="project in freelasProjects" :key="project.id" class="glass rounded-xl glow-hover overflow-hidden">
        <div class="p-4 cursor-pointer hover:bg-white/5 transition-colors" @click="toggleProject(project)">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <span class="text-lg shrink-0">{{ project.status === 'ativo' ? '📋' : project.status === 'concluido' ? '✅' : '❌' }}</span>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-200 truncate">{{ project.name }}</p>
                <p class="text-xs text-gray-500">{{ project.lead_name || 'Sem lead vinculado' }}</p>
              </div>
            </div>
            <div class="hidden md:flex items-center gap-3 shrink-0">
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-200">
                  {{ formatCurrency(project.total_value) }}
                  <span v-if="project.monthly_fee > 0" class="text-xs text-purple-400">+ {{ formatCurrency(project.monthly_fee) }}/mês</span>
                </p>
                <div class="flex items-center gap-1.5 text-[10px]">
                  <span class="px-1.5 py-0.5 rounded text-white font-medium" :class="paymentTypeBadge(project.payment_type)">{{ paymentTypeLabel(project.payment_type) }}</span>
                  <span class="text-green-400">Pago: {{ formatCurrency(project.total_paid || 0) }}</span>
                </div>
              </div>
              <span class="text-[10px] px-2 py-1 rounded-full font-medium" :class="statusBadge(project.status)">{{ statusLabel(project.status) }}</span>
              <button
                @click.stop="editProject(project)"
                class="text-gray-600 hover:text-blue-400 transition-colors p-1"
                title="Editar projeto"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <svg class="w-4 h-4 text-gray-600 shrink-0 transition-transform" :class="{ 'rotate-180': expanded === project.id }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div class="md:hidden flex items-center gap-2 mt-2 text-xs">
            <span class="px-1.5 py-0.5 rounded text-white font-medium text-[10px]" :class="paymentTypeBadge(project.payment_type)">{{ paymentTypeLabel(project.payment_type) }}</span>
            <span class="text-gray-400">{{ formatCurrency(project.total_value) }}</span>
            <span v-if="project.monthly_fee > 0" class="text-purple-400">+{{ formatCurrency(project.monthly_fee) }}/mês</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto" :class="statusBadge(project.status)">{{ statusLabel(project.status) }}</span>
          </div>
        </div>

        <div v-if="expanded === project.id" class="border-t border-white/5 p-4 bg-slate-950/40">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-semibold text-gray-400">{{ isMonthlyProject(project) ? 'Mensalidades' : 'Parcelas' }}</h4>
            <button @click="openAddPayment(project)" class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + {{ isMonthlyProject(project) ? 'Mensalidade' : 'Parcela' }}
            </button>
          </div>

          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 border-b border-gray-800">
                  <th class="pb-2 font-medium">#</th>
                  <th class="pb-2 font-medium">Vencimento</th>
                  <th class="pb-2 font-medium">Valor</th>
                  <th class="pb-2 font-medium">Status</th>
                  <th class="pb-2 font-medium">Notas</th>
                  <th class="pb-2 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in payments[project.id]" :key="p.id" class="border-b border-gray-800/50" :class="{ 'opacity-50': p.status === 'pago' }">
                  <td class="py-2 text-gray-300">{{ p.installment_number }}</td>
                  <td class="py-2 text-gray-300">{{ formatDate(p.due_date) }}</td>
                  <td class="py-2 text-gray-200 font-medium">{{ formatCurrency(p.amount) }}</td>
                  <td class="py-2"><span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="paymentBadge(p.status)">{{ paymentLabel(p.status) }}</span></td>
                  <td class="py-2 text-gray-500 max-w-[120px] truncate">{{ p.notes || '-' }}</td>
                  <td class="py-2 text-right">
                    <button v-if="p.status !== 'pago'" @click="markAsPaid(p)" class="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30">Marcar pago</button>
                    <span v-else class="text-xs text-green-500">Pago {{ formatDate(p.paid_at) }}</span>
                  </td>
                </tr>
                <tr v-if="!payments[project.id]?.length"><td colspan="6" class="py-4 text-center text-gray-600">Nenhum registro</td></tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden space-y-2">
            <div v-for="p in payments[project.id]" :key="p.id" class="glass-light rounded-lg glow-hover p-3 flex items-center justify-between" :class="{ 'opacity-50': p.status === 'pago' }">
              <div>
                <p class="text-sm text-gray-200">#{{ p.installment_number }} — {{ formatCurrency(p.amount) }}</p>
                <p class="text-xs text-gray-500">Venc: {{ formatDate(p.due_date) }}</p>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium" :class="paymentBadge(p.status)">{{ paymentLabel(p.status) }}</span>
              </div>
              <button v-if="p.status !== 'pago'" @click="markAsPaid(p)" class="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Pagar</button>
              <span v-else class="text-xs text-green-500">Pago</span>
            </div>
            <p v-if="!payments[project.id]?.length" class="text-center text-gray-600 text-sm py-4">Nenhum registro</p>
          </div>

          <div v-if="payments[project.id]?.length" class="mt-3 pt-3 border-t border-gray-800 flex justify-end gap-4 text-xs">
            <span class="text-gray-500">Pendente: <strong class="text-yellow-400">{{ formatCurrency(sumPending(project.id)) }}</strong></span>
            <span class="text-gray-500">Pago: <strong class="text-green-400">{{ formatCurrency(sumPaid(project.id)) }}</strong></span>
            <span class="text-gray-500">Faltam: <strong class="text-blue-400">{{ formatCurrency(pendingAmount(project)) }}</strong></span>
          </div>
        </div>
      </div>

      <p v-if="freelasProjects.length === 0 && !projectStore.loading" class="text-center text-gray-600 py-12 text-sm">Nenhum freela cadastrado</p>
    </div>

    <Modal :show="showProjectModal" :title="editingProject ? 'Editar projeto' : 'Novo projeto'" @close="closeProjectModal">
      <form @submit.prevent="saveProject" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
          <input v-model="projectForm.name" type="text" required class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
          <textarea v-model="projectForm.description" rows="2" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Tipo de pagamento</label>
          <select v-model="projectForm.payment_type" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option value="pagamento_unico">Pagamento único</option>
            <option value="parcelado">Parcelado</option>
            <option value="recorrente">Mensalidade (recorrente)</option>
            <option value="implantacao_recorrente">Implantação + Mensalidade</option>
          </select>
        </div>
        <div v-if="hasSetup" class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
          <label class="block text-sm font-medium text-gray-300 mb-1">Valor do projeto</label>
          <input v-model.number="projectForm.setup_value" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div v-if="hasInstallments" class="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg space-y-3">
          <div v-if="!hasSetup">
            <label class="block text-sm font-medium text-gray-300 mb-1">Valor total do projeto</label>
            <input v-model.number="projectForm.total_value" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Entrada</label>
            <input v-model.number="projectForm.entry_value" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Data da entrada</label>
            <input v-model="projectForm.entry_date" type="date" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Parcelar o restante em</label>
            <select v-model.number="projectForm.installments" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="3">3x</option>
              <option :value="4">4x</option>
              <option :value="6">6x</option>
              <option :value="12">12x</option>
            </select>
            <p v-if="projectTotal > 0 && projectForm.entry_value >= 0 && projectForm.installments > 0" class="text-[10px] text-orange-400 mt-1">
              Restante: {{ formatCurrency(Math.max(0, projectTotal - projectForm.entry_value)) }}
              ({{ projectForm.installments }}x de {{ formatCurrency(Math.max(0, projectTotal - projectForm.entry_value) / projectForm.installments) }})
            </p>
          </div>
        </div>
        <div v-if="hasSingle" class="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
          <label class="block text-sm font-medium text-gray-300 mb-1">Valor total</label>
          <input v-model.number="projectForm.total_value" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div v-if="hasMonthly" class="bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Valor da mensalidade</label>
            <input v-model.number="projectForm.monthly_fee" type="number" step="0.01" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1">Ciclo</label>
            <select v-model="projectForm.monthly_cycle" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="mensal">Mensal (todo mês)</option>
              <option value="anual">Anual (1x por ano)</option>
            </select>
          </div>
          <div v-if="projectForm.monthly_cycle === 'anual'">
            <label class="block text-xs font-medium text-gray-400 mb-1">Parcelar anuidade em</label>
            <select v-model.number="projectForm.annual_installments" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option :value="1">1x (à vista)</option>
              <option :value="2">2x</option>
              <option :value="3">3x</option>
              <option :value="4">4x</option>
              <option :value="6">6x</option>
              <option :value="12">12x</option>
            </select>
            <p v-if="projectForm.monthly_fee > 0 && projectForm.annual_installments > 1" class="text-[10px] text-purple-400 mt-1">
              {{ projectForm.annual_installments }}x de {{ formatCurrency(projectForm.monthly_fee / projectForm.annual_installments) }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Data início</label>
            <input v-model="projectForm.start_date" type="date" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Prazo final</label>
            <input v-model="projectForm.end_date" type="date" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select v-model="projectForm.status" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500">
            <option value="ativo">Ativo</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div class="flex gap-3 pt-2">
          <button v-if="editingProject" type="button" @click="deleteProject" class="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">Excluir</button>
          <div class="flex-1"></div>
          <button type="button" @click="closeProjectModal" class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
        </div>
      </form>
    </Modal>

    <Modal :show="showPaymentModal" :title="activeProjectMonthly ? 'Nova mensalidade' : 'Nova parcela'" @close="showPaymentModal = false">
      <form @submit.prevent="savePayment" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Valor *</label>
            <input v-model="paymentForm.amount" type="number" step="0.01" required class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Nº {{ activeProjectMonthly ? 'mês' : 'parcela' }}</label>
            <input v-model="paymentForm.installment_number" type="number" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Vencimento *</label>
          <input v-model="paymentForm.due_date" type="date" required class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Notas</label>
          <input v-model="paymentForm.notes" type="text" class="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500" placeholder="Ex: Pix, boleto..." />
        </div>
        <div class="flex gap-3 pt-2">
          <div class="flex-1"></div>
          <button type="button" @click="showPaymentModal = false" class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg">Cancelar</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useProjectStore } from '../stores/projects'
import Modal from '../components/ui/Modal.vue'

const projectStore = useProjectStore()
const expanded = ref(null)
const payments = reactive({})

const showProjectModal = ref(false)
const editingProject = ref(null)
const projectForm = reactive({ name: '', description: '', total_value: 0, setup_value: 0, entry_value: 0, entry_date: '', installments: 1, monthly_fee: 0, monthly_cycle: 'mensal', annual_installments: 1, payment_type: 'pagamento_unico', start_date: '', end_date: '', status: 'ativo' })

const showPaymentModal = ref(false)
const activeProjectId = ref(null)
const activeProjectMonthly = ref(false)
const paymentForm = reactive({ amount: 0, due_date: '', installment_number: 1, notes: '' })

const freelasProjects = computed(() => projectStore.projects.filter(p => p.is_freela))
const hasSetup = computed(() => projectForm.payment_type === 'implantacao_recorrente')
const hasInstallments = computed(() => ['parcelado', 'implantacao_recorrente'].includes(projectForm.payment_type))
const hasSingle = computed(() => projectForm.payment_type === 'pagamento_unico')
const hasMonthly = computed(() => ['recorrente', 'implantacao_recorrente'].includes(projectForm.payment_type))
const projectTotal = computed(() => hasSetup.value ? (Number(projectForm.setup_value) || 0) : (Number(projectForm.total_value) || 0))

function isMonthlyProject(p) { return p.payment_type === 'implantacao_recorrente' || p.payment_type === 'recorrente' }

function formatCurrency(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0) }
function formatDate(d) { if (!d) return '-'; return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') }

function statusBadge(s) { return { ativo: 'bg-blue-500/20 text-blue-400', concluido: 'bg-green-500/20 text-green-400', cancelado: 'bg-red-500/20 text-red-400' }[s] || '' }
function statusLabel(s) { return { ativo: 'Ativo', concluido: 'Concluído', cancelado: 'Cancelado' }[s] || s }

function paymentTypeBadge(t) { return { pagamento_unico: 'bg-green-600', parcelado: 'bg-orange-600', recorrente: 'bg-purple-600', implantacao_recorrente: 'bg-indigo-600' }[t] || 'bg-gray-600' }
function paymentTypeLabel(t) { return { pagamento_unico: 'Único', parcelado: 'Parcelado', recorrente: 'Recorrente', implantacao_recorrente: 'Impl+Mensal' }[t] || t }

function paymentBadge(s) { return { pendente: 'bg-yellow-500/20 text-yellow-400', pago: 'bg-green-500/20 text-green-400', atrasado: 'bg-red-500/20 text-red-400' }[s] || '' }
function paymentLabel(s) { return { pendente: 'Pendente', pago: 'Pago', atrasado: 'Atrasado' }[s] || s }

async function toggleProject(project) {
  expanded.value = expanded.value === project.id ? null : project.id
  if (expanded.value && !payments[project.id]) payments[project.id] = await projectStore.getPayments(project.id)
}

function openCreateProject() {
  editingProject.value = null
  Object.assign(projectForm, { name: '', description: '', total_value: 0, setup_value: 0, entry_value: 0, entry_date: '', installments: 1, monthly_fee: 0, monthly_cycle: 'mensal', annual_installments: 1, payment_type: 'pagamento_unico', start_date: '', end_date: '', status: 'ativo' })
  showProjectModal.value = true
}

function editProject(project) { editingProject.value = project; Object.assign(projectForm, project); showProjectModal.value = true }
function closeProjectModal() { showProjectModal.value = false; editingProject.value = null }

async function saveProject() {
  const d = { ...projectForm }
  if (hasSetup.value) { d.total_value = d.setup_value || 0 }
  if (!hasSetup.value) { d.setup_value = 0 }
  if (!hasInstallments.value) { d.entry_value = 0; d.entry_date = null; d.installments = 1 }
  if (!hasMonthly.value) { d.monthly_fee = 0; d.monthly_cycle = 'mensal'; d.annual_installments = 1 }
  if (d.monthly_cycle === 'mensal') d.annual_installments = 1
  d.is_freela = true
  if (editingProject.value) await projectStore.update(editingProject.value.id, d)
  else await projectStore.create(d)
  closeProjectModal()
}

async function deleteProject() { if (confirm('Excluir projeto e parcelas?')) { await projectStore.remove(editingProject.value.id); closeProjectModal() } }

function openAddPayment(project) {
  activeProjectId.value = project.id
  activeProjectMonthly.value = isMonthlyProject(project)
  const c = payments[project.id]?.length || 0
  let suggestedAmount = 0
  let suggestedNotes = ''

  if (project.payment_type === 'parcelado') {
    const total = Number(project.total_value) || 0
    const entry = Number(project.entry_value) || 0
    const installments = Number(project.installments) || 1
    if (c === 0 && entry > 0) {
      suggestedAmount = entry
      suggestedNotes = 'Entrada'
    } else {
      const remaining = total - entry
      const remainingInstallments = Math.max(1, installments - (entry > 0 ? 1 : 0))
      suggestedAmount = remaining / remainingInstallments
    }
  } else if (project.payment_type === 'implantacao_recorrente') {
    const setup = Number(project.setup_value) || 0
    const entry = Number(project.entry_value) || 0
    const total = setup
    const installments = Number(project.installments) || 1
    const setupOffset = setup > 0 ? 1 : 0
    const entryOffset = entry > 0 ? 1 : 0
    const parcelasEnd = setupOffset + entryOffset + installments

    if (setup > 0 && c === 0) {
      suggestedAmount = setup
      suggestedNotes = 'Implantação'
    } else if (entry > 0 && c === setupOffset) {
      suggestedAmount = entry
      suggestedNotes = 'Entrada'
    } else if (c < parcelasEnd) {
      const remaining = total - entry
      const parcelIdx = c - setupOffset - entryOffset
      suggestedAmount = remaining / Math.max(1, installments)
    } else if (project.monthly_cycle === 'anual' && project.annual_installments > 0) {
      suggestedAmount = project.monthly_fee / project.annual_installments
    } else if (project.monthly_fee > 0) {
      suggestedAmount = project.monthly_fee
    }
  } else if (project.monthly_cycle === 'anual' && project.annual_installments > 0) {
    suggestedAmount = project.monthly_fee / project.annual_installments
  } else if (project.monthly_fee > 0) {
    suggestedAmount = project.monthly_fee
  }

  let suggestedDate = ''
  if (project.entry_date && c === 0) {
    suggestedDate = project.entry_date
  } else if (project.entry_date) {
    const base = new Date(project.entry_date + 'T00:00:00')
    base.setDate(base.getDate() + (c * 30))
    suggestedDate = base.toISOString().split('T')[0]
  }

  Object.assign(paymentForm, { amount: Math.round(suggestedAmount * 100) / 100, due_date: suggestedDate, installment_number: c + 1, notes: suggestedNotes })
  showPaymentModal.value = true
}

async function savePayment() {
  await projectStore.addPayment(activeProjectId.value, { ...paymentForm })
  payments[activeProjectId.value] = await projectStore.getPayments(activeProjectId.value)
  await projectStore.fetch()
  showPaymentModal.value = false
}

async function markAsPaid(payment) {
  await projectStore.payInstallment(payment.id)
  payments[payment.project_id] = await projectStore.getPayments(payment.project_id)
  await projectStore.fetch()
}

function sumPending(id) { return (payments[id] || []).filter(p => p.status !== 'pago').reduce((a, p) => a + Number(p.amount), 0) }
function sumPaid(id) { return (payments[id] || []).filter(p => p.status === 'pago').reduce((a, p) => a + Number(p.amount), 0) }
function pendingAmount(project) { return Number(project.total_value || 0) - Number(project.total_paid || 0) }

onMounted(() => projectStore.fetch())
</script>
