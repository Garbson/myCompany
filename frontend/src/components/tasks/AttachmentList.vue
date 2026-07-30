<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <h4 class="text-xs font-semibold text-ink-100 uppercase tracking-wide">
        Anexos
        <span v-if="items.length" class="ml-1 text-ink-50 normal-case font-normal">{{ items.length }}</span>
      </h4>
      <label
        class="text-xs px-2.5 py-1 rounded-lg bg-terra-500/15 hover:bg-blue-500/25 text-terra-500 cursor-pointer transition-colors inline-flex items-center gap-1"
        :class="{ 'opacity-50 cursor-wait': uploading }"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        {{ uploading ? 'Enviando…' : 'Adicionar' }}
        <input type="file" class="hidden" :disabled="uploading" multiple @change="onFiles" />
      </label>
    </div>

    <ul v-if="items.length" class="space-y-1.5">
      <li
        v-for="a in items"
        :key="a.id"
        class="flex items-center gap-3 px-3 py-2 glass-light rounded-lg group"
      >
        <div class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" :class="iconBg(a.mime_type)">
          <svg v-if="isImage(a.mime_type)" class="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        </div>
        <a
          :href="a.url"
          target="_blank"
          rel="noopener"
          class="flex-1 min-w-0 group/link"
        >
          <p class="text-sm text-ink-300 group-hover/link:text-terra-500 truncate transition-colors">{{ a.filename }}</p>
          <p class="text-[10px] text-ink-50">{{ formatSize(a.size_bytes) }} · {{ a.user_name || 'Usuário' }}</p>
        </a>
        <button
          @click="remove(a)"
          class="opacity-0 group-hover:opacity-100 text-ink-50 hover:text-terra-600 transition-opacity"
          aria-label="Apagar"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </li>
    </ul>
    <p v-else-if="!uploading" class="text-xs text-ink-50 text-center py-2">Nenhum anexo</p>

    <div v-if="uploading" class="mt-2 text-xs text-ink-100 flex items-center gap-2">
      <div class="flex-1 h-1 bg-[var(--paper-surface-2)] rounded-full overflow-hidden">
        <div class="h-full bg-terra-500 transition-all" :style="{ width: progress + '%' }"></div>
      </div>
      <span class="tabular-nums">{{ progress }}%</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import api from '../../api'
import { useToast } from '../../composables/useToast'
import { hapticLight, hapticSuccess } from '../../services/haptics'
import { useRealtimeRefresh } from '../../composables/useRealtimeRefresh'

const props = defineProps({
  entityType: { type: String, default: 'task' },
  entityId: { type: [Number, String], required: true },
})
const toast = useToast()

const items = ref([])
const uploading = ref(false)
const progress = ref(0)

async function load() {
  if (!props.entityId) return
  try {
    const { data } = await api.get(`/${props.entityType}/${props.entityId}/attachments`)
    items.value = data
  } catch {
    items.value = []
  }
}

async function onFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  uploading.value = true
  for (const file of files) {
    progress.value = 0
    await uploadOne(file)
  }
  uploading.value = false
}

async function uploadOne(file) {
  try {
    const { data: signed } = await api.post(
      `/${props.entityType}/${props.entityId}/attachments/presign`,
      { filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size }
    )

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', signed.uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) progress.value = Math.round((ev.loaded / ev.total) * 100)
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
      xhr.onerror = () => reject(new Error('upload failed'))
      xhr.send(file)
    })

    const { data } = await api.post(`/${props.entityType}/${props.entityId}/attachments`, {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      storageKey: signed.key,
      url: signed.publicUrl,
    })
    items.value.unshift(data)
    hapticSuccess()
  } catch (err) {
    toast.error(`Falha no upload: ${file.name}`)
  }
}

async function remove(a) {
  items.value = items.value.filter((x) => x.id !== a.id)
  try {
    await api.delete(`/attachments/${a.id}`)
    hapticLight()
  } catch {
    items.value.push(a)
    toast.error('Falha ao remover')
  }
}

function isImage(mime) {
  return !!mime && mime.startsWith('image/')
}
function iconBg(mime) {
  if (isImage(mime)) return 'bg-gradient-to-br from-pink-500 to-fuchsia-600'
  if (mime?.includes('pdf')) return 'bg-gradient-to-br from-red-500 to-orange-600'
  if (mime?.includes('zip') || mime?.includes('rar')) return 'bg-gradient-to-br from-yellow-500 to-amber-600'
  return 'bg-terra-500'
}
function formatSize(b) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' KB'
  return (b / 1024 / 1024).toFixed(1) + ' MB'
}

useRealtimeRefresh(load, ['/api/task/', '/api/project/', '/api/attachments/'])
watch(() => props.entityId, load, { immediate: true })
</script>
