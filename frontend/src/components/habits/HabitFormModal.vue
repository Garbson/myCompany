<template>
  <Modal :show="show" :title="editing ? 'Editar hábito' : 'Novo hábito'" size="lg" @close="$emit('close')">
    <form @submit.prevent="next" class="-m-4">
      <!-- Progress steps -->
      <div class="flex items-center gap-2 px-5 pt-5 md:px-6">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="flex items-center gap-2 flex-1"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0"
            :class="i + 1 === step
              ? s.color + ' text-white ring-2 ring-offset-2 ring-offset-slate-900'
              : i + 1 < step
              ? 'bg-green-500/80 text-white'
              : 'bg-white/10 text-gray-500'"
          >
            <svg v-if="i + 1 < step" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="flex-1 h-px bg-white/10"></div>
        </div>
      </div>

      <div class="px-5 md:px-6 pt-3">
        <p class="text-[11px] uppercase tracking-wider font-semibold" :class="currentStep.colorText">{{ currentStep.label }}</p>
        <h3 class="text-lg md:text-xl font-bold text-white">{{ currentStep.title }}</h3>
        <p class="text-xs text-gray-400 mt-0.5">{{ currentStep.subtitle }}</p>
      </div>

      <!-- ===== Step 1: Quem você quer ser ===== -->
      <div v-if="step === 1" class="px-5 md:px-6 py-5 space-y-4">
        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Identidade *</label>
          <div class="flex items-center bg-slate-900/40 border border-white/5 rounded-lg overflow-hidden focus-within:border-purple-500/60">
            <span class="text-sm text-gray-400 pl-3 shrink-0">Eu sou alguém que</span>
            <input
              v-model="form.identity"
              type="text"
              required
              placeholder="lê todos os dias"
              class="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
          </div>
          <p class="text-[10px] text-gray-500 mt-1">Cada vez que praticar o hábito, você vota nessa identidade.</p>
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Hábito *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Ex: Ler 30 minutos"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/60"
          />
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Frequência</label>
          <div class="flex gap-2">
            <button
              type="button"
              @click="form.frequency = 'daily'"
              class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
              :class="form.frequency === 'daily' ? 'bg-purple-500/90 text-white' : 'glass-light text-gray-400 hover:text-white'"
            >Todo dia</button>
            <button
              type="button"
              @click="form.frequency = 'specific_days'"
              class="flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-colors"
              :class="form.frequency === 'specific_days' ? 'bg-purple-500/90 text-white' : 'glass-light text-gray-400 hover:text-white'"
            >Dias específicos</button>
          </div>
          <div v-if="form.frequency === 'specific_days'" class="mt-3 flex gap-1.5 flex-wrap">
            <button
              v-for="d in weekDays"
              :key="d.idx"
              type="button"
              @click="toggleDay(d.idx)"
              :class="[
                'w-9 h-9 rounded-lg text-xs font-semibold transition-colors',
                form.recurrence_days.includes(d.idx)
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'glass-light text-gray-400 hover:text-white',
              ]"
            >{{ d.label }}</button>
          </div>
        </div>
      </div>

      <!-- ===== Step 2: Torne ÓBVIO ===== -->
      <div v-if="step === 2" class="px-5 md:px-6 py-5 space-y-4">
        <div class="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-[11px] text-blue-200/80 leading-relaxed">
          💡 Cérebros gostam de gatilhos previsíveis. Defina <b>quando</b>, <b>onde</b> e/ou <b>depois de qual hábito</b> você vai praticar. Pelo menos um é obrigatório.
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Horário</label>
          <input
            v-model="form.cue_time"
            type="time"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/60"
          />
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Local</label>
          <input
            v-model="form.cue_location"
            type="text"
            placeholder="Ex: Mesa do café"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60"
          />
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Empilhar depois de</label>
          <div class="flex items-center bg-slate-900/40 border border-white/5 rounded-lg overflow-hidden focus-within:border-blue-500/60">
            <span class="text-sm text-gray-400 pl-3 shrink-0">Depois de</span>
            <input
              v-model="form.stack_after"
              type="text"
              placeholder="escovar os dentes"
              class="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
            />
            <span class="text-sm text-gray-400 pr-3 shrink-0">eu vou…</span>
          </div>
          <p class="text-[10px] text-gray-500 mt-1">Pegue um hábito que você já faz no automático e empilhe o novo logo em seguida.</p>

          <!-- Sugestões de hábitos âncora -->
          <div class="mt-3 space-y-2.5">
            <div v-for="group in anchorHabits" :key="group.label">
              <p class="text-[10px] text-gray-600 mb-1 flex items-center gap-1">
                <span>{{ group.icon }}</span>
                <span class="uppercase tracking-wider font-semibold">{{ group.label }}</span>
              </p>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in group.options"
                  :key="opt"
                  type="button"
                  @click="form.stack_after = opt"
                  class="px-2 py-1 text-[11px] rounded-md transition-colors"
                  :class="form.stack_after === opt
                    ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/50'
                    : 'glass-light text-gray-400 hover:text-white hover:bg-white/10'"
                >{{ opt }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Step 3: Atraente + Fácil ===== -->
      <div v-if="step === 3" class="px-5 md:px-6 py-5 space-y-5">
        <!-- 2ª Lei -->
        <div>
          <p class="text-[11px] uppercase tracking-wider text-pink-300 font-semibold mb-1">2ª Lei — Atraente</p>
          <div class="rounded-lg bg-pink-500/5 border border-pink-500/20 p-3 text-[11px] text-pink-200/80 leading-relaxed mb-2">
            🍫 Empacotamento de tentação: junte algo que você <b>precisa</b> fazer com algo que você <b>quer</b>.
          </div>
          <textarea
            v-model="form.temptation_bundle"
            rows="2"
            placeholder="Ex: Só ouço meu podcast favorito enquanto estou correndo"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/60 resize-none"
          ></textarea>
        </div>

        <!-- 3ª Lei -->
        <div>
          <p class="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold mb-1">3ª Lei — Fácil *</p>
          <div class="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-[11px] text-emerald-200/80 leading-relaxed mb-2">
            ⚡ Versão de 2 minutos: a forma <b>mais ridiculamente fácil</b> de começar. Não pode falhar.
          </div>
          <input
            v-model="form.two_minute_version"
            type="text"
            required
            placeholder="Ex: Ler 1 página"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60"
          />
          <p class="text-[10px] text-gray-500 mt-1">Em dias preguiçosos, faça só isso. O importante é não quebrar a sequência.</p>
        </div>
      </div>

      <!-- ===== Step 4: Satisfatório ===== -->
      <div v-if="step === 4" class="px-5 md:px-6 py-5 space-y-4">
        <div class="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3 text-[11px] text-amber-200/80 leading-relaxed">
          🎉 O cérebro repete o que sente bom. Defina uma <b>recompensa imediata</b> pra fechar o ciclo logo após a prática.
        </div>

        <div>
          <label class="block text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5">Recompensa imediata *</label>
          <textarea
            v-model="form.reward"
            rows="3"
            required
            placeholder="Ex: Café especial / marcar no app + ouvir 1 música / banho longo"
            class="w-full px-3 py-2 bg-slate-900/40 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/60 resize-none"
          ></textarea>
        </div>

        <!-- Resumo -->
        <div class="rounded-xl glass-light p-4 mt-4 space-y-2">
          <p class="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Resumo</p>
          <p class="text-sm text-white"><b>{{ form.name }}</b></p>
          <p v-if="form.identity" class="text-xs text-purple-300">Eu sou alguém que {{ form.identity }}</p>
          <p v-if="cueText" class="text-xs text-blue-300">📌 {{ cueText }}</p>
          <p v-if="form.two_minute_version" class="text-xs text-emerald-300">⚡ Mín: {{ form.two_minute_version }}</p>
          <p v-if="form.reward" class="text-xs text-amber-300">🎉 {{ form.reward }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center gap-3 px-5 py-3 md:px-6 border-t border-white/5 bg-slate-950/60">
        <button
          v-if="step > 1"
          type="button"
          @click="step--"
          class="px-3 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
        >← Voltar</button>
        <div class="flex-1"></div>
        <button
          type="button"
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
        >Cancelar</button>
        <button
          type="submit"
          :disabled="!canAdvance"
          class="px-5 py-2 text-sm bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ step < 4 ? 'Próximo →' : (editing ? 'Salvar' : 'Criar hábito') }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Modal from '../ui/Modal.vue'

const props = defineProps({
  show: Boolean,
  editing: { type: Object, default: null },
})
const emit = defineEmits(['close', 'save'])

const step = ref(1)
const form = reactive({
  name: '',
  identity: '',
  frequency: 'daily',
  recurrence_days: [],
  cue_time: '',
  cue_location: '',
  stack_after: '',
  temptation_bundle: '',
  two_minute_version: '',
  reward: '',
})

const weekDays = [
  { idx: 0, label: 'D' }, { idx: 1, label: 'S' }, { idx: 2, label: 'T' },
  { idx: 3, label: 'Q' }, { idx: 4, label: 'Q' }, { idx: 5, label: 'S' }, { idx: 6, label: 'S' },
]

// Hábitos âncora — coisas que quase todo mundo já faz no automático.
// Servem de gatilho pra empilhar hábitos novos (Habit Stacking).
const anchorHabits = [
  {
    icon: '☀️',
    label: 'Manhã',
    options: ['acordar', 'sair da cama', 'ir ao banheiro', 'escovar os dentes', 'lavar o rosto', 'tomar banho', 'tomar café da manhã', 'beber o primeiro copo de água'],
  },
  {
    icon: '💻',
    label: 'Início do trabalho',
    options: ['ligar o computador', 'abrir o email', 'tomar o primeiro café', 'fazer o primeiro standup', 'sentar na mesa'],
  },
  {
    icon: '🍴',
    label: 'Almoço',
    options: ['almoçar', 'voltar do almoço', 'fechar o notebook pro almoço'],
  },
  {
    icon: '🏁',
    label: 'Fim do trabalho',
    options: ['fechar o notebook', 'sair do trabalho', 'chegar em casa'],
  },
  {
    icon: '🌙',
    label: 'Noite',
    options: ['jantar', 'tomar banho à noite', 'escovar os dentes à noite', 'deitar na cama', 'tirar a roupa do trabalho'],
  },
]

const steps = [
  { label: 'Passo 1', title: 'Quem você quer se tornar', subtitle: 'Hábitos viram identidade. Comece pelo "quem", não pelo "o quê".', color: 'bg-purple-500', colorText: 'text-purple-300' },
  { label: 'Passo 2 — 1ª Lei', title: 'Torne óbvio', subtitle: 'Defina o gatilho: quando, onde e/ou após qual hábito.', color: 'bg-blue-500', colorText: 'text-blue-300' },
  { label: 'Passo 3 — 2ª + 3ª Lei', title: 'Torne atraente e fácil', subtitle: 'Empacote a tentação e crie uma versão mínima impossível de falhar.', color: 'bg-emerald-500', colorText: 'text-emerald-300' },
  { label: 'Passo 4 — 4ª Lei', title: 'Torne satisfatório', subtitle: 'Recompensa imediata fecha o ciclo. Sem ela, o cérebro não repete.', color: 'bg-amber-500', colorText: 'text-amber-300' },
]
const currentStep = computed(() => steps[step.value - 1])

function toggleDay(idx) {
  const i = form.recurrence_days.indexOf(idx)
  if (i >= 0) form.recurrence_days.splice(i, 1)
  else form.recurrence_days.push(idx)
}

const cueText = computed(() => {
  const parts = []
  if (form.stack_after) parts.push(`Após ${form.stack_after}`)
  if (form.cue_time) parts.push(`às ${form.cue_time}`)
  if (form.cue_location) parts.push(`em ${form.cue_location}`)
  return parts.join(' · ')
})

const canAdvance = computed(() => {
  if (step.value === 1) {
    if (!form.name?.trim() || !form.identity?.trim()) return false
    if (form.frequency === 'specific_days' && form.recurrence_days.length === 0) return false
    return true
  }
  if (step.value === 2) {
    return !!(form.cue_time || form.cue_location?.trim() || form.stack_after?.trim())
  }
  if (step.value === 3) {
    return !!form.two_minute_version?.trim()
  }
  if (step.value === 4) {
    return !!form.reward?.trim()
  }
  return false
})

function next() {
  if (!canAdvance.value) return
  if (step.value < 4) {
    step.value += 1
  } else {
    emit('save', {
      ...form,
      recurrence_days: form.frequency === 'specific_days' && form.recurrence_days.length
        ? form.recurrence_days.join(',')
        : null,
    })
  }
}

function parseDays(s) {
  if (!s) return []
  return String(s).split(',').map((x) => parseInt(x, 10)).filter((x) => x >= 0 && x <= 6)
}

watch(
  () => props.show,
  (v) => {
    if (!v) return
    step.value = 1
    if (props.editing) {
      Object.assign(form, {
        name: props.editing.name || '',
        identity: props.editing.identity || '',
        frequency: props.editing.frequency || 'daily',
        recurrence_days: parseDays(props.editing.recurrence_days),
        cue_time: props.editing.cue_time ? props.editing.cue_time.slice(0, 5) : '',
        cue_location: props.editing.cue_location || '',
        stack_after: props.editing.stack_after || '',
        temptation_bundle: props.editing.temptation_bundle || '',
        two_minute_version: props.editing.two_minute_version || '',
        reward: props.editing.reward || '',
      })
    } else {
      Object.assign(form, {
        name: '', identity: '', frequency: 'daily', recurrence_days: [],
        cue_time: '', cue_location: '', stack_after: '',
        temptation_bundle: '', two_minute_version: '', reward: '',
      })
    }
  },
  { immediate: true }
)
</script>
