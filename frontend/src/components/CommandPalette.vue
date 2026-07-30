<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[500] flex items-start justify-center pt-24 px-4"
        @click.self="close"
        @keydown.esc.stop="close"
      >
        <div class="absolute inset-0 bg-ink-400/40 backdrop-blur-sm"></div>
        <div class="relative paper-strong rounded-2xl w-full max-w-xl overflow-hidden shadow-paper-lg">
          <!-- Input -->
          <div class="p-3 border-b border-[var(--paper-border)]">
            <div class="relative">
              <svg class="w-4 h-4 text-ink-50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
              </svg>
              <input
                ref="inputRef"
                v-model="query"
                type="text"
                placeholder="Buscar anotações, fluxogramas, projetos… ou digitar um comando"
                class="w-full pl-9 pr-3 py-2.5 bg-[var(--paper-surface-2)] border border-[var(--paper-border)] rounded-lg text-sm text-ink-300 placeholder-ink-50 outline-none focus:border-terra-500"
                @keydown.down.prevent="moveSel(1)"
                @keydown.up.prevent="moveSel(-1)"
                @keydown.enter.prevent="pickCurrent"
                @keydown.esc.prevent.stop="close"
              />
              <kbd class="hidden md:inline-flex items-center gap-1 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-ink-50 bg-[var(--paper-surface-3)] border border-[var(--paper-border)] rounded px-1.5 py-0.5">ESC</kbd>
            </div>
          </div>

          <!-- Resultados -->
          <div ref="listRef" class="max-h-[60vh] overflow-y-auto scrollbar-slim py-1">
            <p v-if="loading" class="px-4 py-6 text-center text-xs text-ink-50">Buscando…</p>

            <template v-else>
              <!-- Comandos -->
              <template v-if="commandGroup.length">
                <p class="px-4 pt-2 pb-1 text-[10px] font-semibold text-ink-50 uppercase tracking-widest">Comandos</p>
                <button
                  v-for="(item, i) in commandGroup"
                  :key="item.key"
                  @click="pick(item)"
                  @mouseenter="selectedIndex = flatIndexOf(item)"
                  class="w-full flex items-center gap-3 px-4 py-2 transition-colors"
                  :class="isSelected(item) ? 'bg-[var(--paper-surface-3)]' : 'hover:bg-[var(--paper-surface-2)]'"
                >
                  <div class="w-7 h-7 rounded-lg bg-terra-500/12 text-terra-600 flex items-center justify-center shrink-0" v-html="item.icon"></div>
                  <div class="flex-1 min-w-0 text-left">
                    <p class="text-sm font-medium text-ink-300 truncate">{{ item.label }}</p>
                    <p v-if="item.hint" class="text-[10px] text-ink-50 truncate">{{ item.hint }}</p>
                  </div>
                </button>
              </template>

              <!-- Anotações -->
              <template v-if="results.notes?.length">
                <p class="px-4 pt-2 pb-1 text-[10px] font-semibold text-ink-50 uppercase tracking-widest">Anotações</p>
                <button
                  v-for="n in results.notes"
                  :key="'n' + n.id"
                  @click="pickNote(n)"
                  @mouseenter="selectedIndex = flatIndexOf({ key: 'note-' + n.id })"
                  class="w-full flex items-start gap-3 px-4 py-2 transition-colors"
                  :class="isSelected({ key: 'note-' + n.id }) ? 'bg-[var(--paper-surface-3)]' : 'hover:bg-[var(--paper-surface-2)]'"
                >
                  <svg class="w-4 h-4 text-ink-50 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div class="flex-1 min-w-0 text-left">
                    <p class="text-sm font-medium text-ink-300 truncate">{{ n.title || 'Sem título' }}</p>
                    <p v-if="n.snippet" class="text-[11px] text-ink-50 truncate">{{ n.snippet }}</p>
                  </div>
                </button>
              </template>

              <!-- Fluxogramas -->
              <template v-if="results.flowcharts?.length">
                <p class="px-4 pt-2 pb-1 text-[10px] font-semibold text-ink-50 uppercase tracking-widest">Fluxogramas</p>
                <button
                  v-for="f in results.flowcharts"
                  :key="'f' + f.id"
                  @click="pickFlow(f)"
                  @mouseenter="selectedIndex = flatIndexOf({ key: 'flow-' + f.id })"
                  class="w-full flex items-center gap-3 px-4 py-2 transition-colors"
                  :class="isSelected({ key: 'flow-' + f.id }) ? 'bg-[var(--paper-surface-3)]' : 'hover:bg-[var(--paper-surface-2)]'"
                >
                  <svg class="w-4 h-4 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v4M4 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V4zM14 14a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <p class="flex-1 text-sm text-ink-300 truncate">{{ f.title || 'Sem título' }}</p>
                </button>
              </template>

              <!-- Projetos -->
              <template v-if="results.projects?.length">
                <p class="px-4 pt-2 pb-1 text-[10px] font-semibold text-ink-50 uppercase tracking-widest">Projetos</p>
                <button
                  v-for="p in results.projects"
                  :key="'p' + p.id"
                  @click="pickProject(p)"
                  @mouseenter="selectedIndex = flatIndexOf({ key: 'project-' + p.id })"
                  class="w-full flex items-center gap-3 px-4 py-2 transition-colors"
                  :class="isSelected({ key: 'project-' + p.id }) ? 'bg-[var(--paper-surface-3)]' : 'hover:bg-[var(--paper-surface-2)]'"
                >
                  <svg class="w-4 h-4 text-ink-50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="flex-1 text-sm text-ink-300 truncate">{{ p.name }}</p>
                </button>
              </template>

              <p v-if="!hasAnyResult && query.length >= 2" class="px-4 py-6 text-center text-xs text-ink-50">
                Nenhum resultado pra “{{ query }}”
              </p>
              <p v-else-if="!hasAnyResult" class="px-4 py-6 text-center text-xs text-ink-50">
                Digite pra buscar ou escolha um comando acima
              </p>
            </template>
          </div>

          <!-- Rodapé com hints -->
          <div class="px-4 py-2 border-t border-[var(--paper-border)] flex items-center gap-4 text-[10px] text-ink-50">
            <span class="flex items-center gap-1">
              <kbd class="font-mono bg-[var(--paper-surface-3)] border border-[var(--paper-border)] rounded px-1.5 py-0.5">↑↓</kbd>
              navegar
            </span>
            <span class="flex items-center gap-1">
              <kbd class="font-mono bg-[var(--paper-surface-3)] border border-[var(--paper-border)] rounded px-1.5 py-0.5">↵</kbd>
              abrir
            </span>
            <span class="flex items-center gap-1 ml-auto">
              <kbd class="font-mono bg-[var(--paper-surface-3)] border border-[var(--paper-border)] rounded px-1.5 py-0.5">⌘K</kbd>
              alternar
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useCommandPalette } from '../composables/useCommandPalette'

const router = useRouter()
const { open, hide } = useCommandPalette()

const inputRef = ref(null)
const listRef = ref(null)
const query = ref('')
const loading = ref(false)
const results = ref({ notes: [], flowcharts: [], projects: [] })
const selectedIndex = ref(0)

let searchTimer = null

// Comandos fixos — só aparecem quando não tem query específica ou casam
const allCommands = [
  { key: 'cmd-new-note', label: 'Nova anotação', hint: 'Cria e abre imediatamente', icon: iconAdd(), match: ['nova nota', 'new note', 'anotação', 'criar nota'], run: async () => {
      close()
      try {
        const { data } = await api.post('/notes', { title: '', content: '' })
        router.push({ path: '/anotacoes', query: { open: data.id } })
      } catch {}
    } },
  { key: 'cmd-new-flow', label: 'Novo fluxograma', hint: 'Cria e abre imediatamente', icon: iconAdd(), match: ['novo flow', 'novo fluxograma', 'new flow', 'criar fluxo'], run: async () => {
      close()
      try {
        const { data } = await api.post('/flowcharts', {})
        router.push({ path: '/fluxogramas', query: { open: data.id } })
      } catch {}
    } },
  { key: 'nav-dash', label: 'Ir para Dashboard', icon: iconArrow(), match: ['dashboard', 'inicio', 'home'], run: () => { close(); router.push('/') } },
  { key: 'nav-hoje', label: 'Ir para Hoje', icon: iconArrow(), match: ['hoje', 'today', 'foco'], run: () => { close(); router.push('/hoje') } },
  { key: 'nav-agenda', label: 'Ir para Agenda', icon: iconArrow(), match: ['agenda', 'calendário', 'calendar'], run: () => { close(); router.push('/agenda') } },
  { key: 'nav-inbox', label: 'Ir para Caixa de entrada', icon: iconArrow(), match: ['inbox', 'capturas', 'caixa de entrada'], run: () => { close(); router.push('/inbox') } },
  { key: 'nav-templates', label: 'Ir para Templates', icon: iconArrow(), match: ['templates', 'modelos'], run: () => { close(); router.push('/templates') } },
  { key: 'nav-tarefas', label: 'Ir para Tarefas', icon: iconArrow(), match: ['tarefas', 'tasks'], run: () => { close(); router.push('/tarefas') } },
  { key: 'nav-projetos', label: 'Ir para Projetos', icon: iconArrow(), match: ['projetos', 'projects'], run: () => { close(); router.push('/projetos') } },
  { key: 'nav-anotacoes', label: 'Ir para Anotações', icon: iconArrow(), match: ['anotações', 'notas', 'notes'], run: () => { close(); router.push('/anotacoes') } },
  { key: 'nav-fluxogramas', label: 'Ir para Fluxogramas', icon: iconArrow(), match: ['fluxogramas', 'flows', 'diagramas'], run: () => { close(); router.push('/fluxogramas') } },
  { key: 'nav-config', label: 'Ir para Configurações', icon: iconArrow(), match: ['configurações', 'settings', 'config'], run: () => { close(); router.push('/configuracoes') } },
]

function iconAdd() { return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>' }
function iconArrow() { return '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7-7 7M3 12h18"/></svg>' }

const commandGroup = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) {
    // Sem query: mostra só criar nota/flow (os "úteis")
    return allCommands.slice(0, 2)
  }
  return allCommands.filter((c) =>
    c.label.toLowerCase().includes(q) ||
    c.match.some((m) => m.includes(q) || q.includes(m))
  ).slice(0, 5)
})

const hasAnyResult = computed(() =>
  commandGroup.value.length +
  (results.value.notes?.length || 0) +
  (results.value.flowcharts?.length || 0) +
  (results.value.projects?.length || 0) > 0
)

// Lista plana pra keyboard nav
const flatItems = computed(() => {
  const items = []
  commandGroup.value.forEach((c) => items.push({ kind: 'cmd', key: c.key, ref: c }))
  ;(results.value.notes || []).forEach((n) => items.push({ kind: 'note', key: 'note-' + n.id, ref: n }))
  ;(results.value.flowcharts || []).forEach((f) => items.push({ kind: 'flow', key: 'flow-' + f.id, ref: f }))
  ;(results.value.projects || []).forEach((p) => items.push({ kind: 'project', key: 'project-' + p.id, ref: p }))
  return items
})

function flatIndexOf(item) {
  return flatItems.value.findIndex((i) => i.key === item.key)
}
function isSelected(item) {
  const idx = flatIndexOf(item)
  return idx === selectedIndex.value
}

function moveSel(delta) {
  const n = flatItems.value.length
  if (n === 0) return
  selectedIndex.value = (selectedIndex.value + delta + n) % n
  nextTick(scrollToSelected)
}

function scrollToSelected() {
  const el = listRef.value?.querySelector('.bg-\\[var\\(--paper-surface-3\\)\\]')
  el?.scrollIntoView({ block: 'nearest' })
}

function pickCurrent() {
  const item = flatItems.value[selectedIndex.value]
  if (!item) return
  if (item.kind === 'cmd') item.ref.run()
  else if (item.kind === 'note') pickNote(item.ref)
  else if (item.kind === 'flow') pickFlow(item.ref)
  else if (item.kind === 'project') pickProject(item.ref)
}

function pick(cmd) { cmd.run() }
function pickNote(n) { close(); router.push({ path: '/anotacoes', query: { open: n.id } }) }
function pickFlow(f) { close(); router.push({ path: '/fluxogramas', query: { open: f.id } }) }
function pickProject(p) { close(); router.push('/projetos') }

function close() {
  hide()
  query.value = ''
  results.value = { notes: [], flowcharts: [], projects: [] }
  selectedIndex.value = 0
}

// Debounced search
watch(query, (val) => {
  selectedIndex.value = 0
  if (searchTimer) clearTimeout(searchTimer)
  const q = (val || '').trim()
  if (q.length < 2) {
    results.value = { notes: [], flowcharts: [], projects: [] }
    loading.value = false
    return
  }
  loading.value = true
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/search', { params: { q } })
      results.value = data
    } catch {
      results.value = { notes: [], flowcharts: [], projects: [] }
    } finally {
      loading.value = false
    }
  }, 180)
})

// Global keyboard: Cmd/Ctrl+K abre; Esc fecha (redundância pra garantir)
function onGlobalKey(e) {
  const key = e.key?.toLowerCase()
  const mod = e.metaKey || e.ctrlKey
  if (mod && key === 'k') {
    e.preventDefault()
    if (open.value) close()
    else openAndFocus()
  }
}

async function openAndFocus() {
  const { show } = useCommandPalette()
  show()
  await nextTick()
  inputRef.value?.focus()
}

// Foca quando abre por qualquer via
watch(open, async (v) => {
  if (v) {
    await nextTick()
    inputRef.value?.focus()
  }
})

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>
