<template>
  <div class="max-w-2xl mx-auto">
    <div class="hidden md:block mb-6 md-sticky-title">
      <h1 class="text-2xl font-bold text-ink-400 tracking-tight">Configurações</h1>
      <p class="text-sm text-ink-50 mt-0.5">Perfil, notificações e segurança</p>
    </div>

    <!-- Perfil -->
    <section class="glass rounded-xl p-5 mb-4">
      <h2 class="text-sm font-semibold text-ink-400 mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-terra-500 rounded-full"></span>
        Perfil
      </h2>

      <div class="flex items-center gap-4 mb-5">
        <div class="relative">
          <div class="w-16 h-16 rounded-full overflow-hidden bg-terra-500 flex items-center justify-center text-xl font-bold text-ink-400 ring-2 ring-[var(--paper-border)]">
            <img v-if="form.avatar_url" :src="form.avatar_url" alt="" class="w-full h-full object-cover" />
            <span v-else>{{ initial }}</span>
          </div>
          <label
            class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 hover:bg-blue-400 flex items-center justify-center cursor-pointer shadow-lg shadow-paper-lg transition-colors"
            :class="{ 'opacity-50 cursor-wait': uploadingAvatar }"
          >
            <svg v-if="!uploadingAvatar" class="w-3.5 h-3.5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <svg v-else class="w-3.5 h-3.5 text-ink-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="40" stroke-linecap="round" />
            </svg>
            <input type="file" accept="image/*" class="hidden" @change="onAvatar" :disabled="uploadingAvatar" />
          </label>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-ink-400 truncate">{{ form.name || '—' }}</p>
          <p class="text-xs text-ink-50 truncate">{{ form.email }}</p>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-ink-100 mb-1">Nome</label>
          <input v-model="form.name" type="text" class="w-full px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500" />
        </div>
      </div>

      <button
        @click="saveProfile"
        :disabled="savingProfile"
        class="mt-4 px-4 py-2 text-sm font-medium bg-terra-500 text-ink-400 rounded-lg shadow-lg shadow-paper hover:shadow-paper-lg disabled:opacity-50 transition-all"
      >
        {{ savingProfile ? 'Salvando…' : 'Salvar perfil' }}
      </button>
    </section>

    <!-- Lembrete WhatsApp -->
    <section class="glass rounded-xl p-5 mb-4">
      <h2 class="text-sm font-semibold text-ink-400 mb-1 flex items-center gap-2">
        <span class="w-1 h-4 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full"></span>
        Lembrete via WhatsApp
      </h2>
      <p class="text-xs text-ink-50 mb-4">
        Receba uma mensagem no dia em que tem tarefas com data de entrega.
      </p>

      <div class="space-y-3">
        <label class="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p class="text-sm text-ink-300">Receber lembretes</p>
            <p class="text-[11px] text-ink-50">Manda só se você tiver tarefa(s) com prazo hoje</p>
          </div>
          <button
            type="button"
            @click="form.notif_whatsapp = form.notif_whatsapp ? 0 : 1"
            class="relative w-11 h-6 rounded-full transition-colors shrink-0"
            :class="form.notif_whatsapp ? 'bg-terra-500' : 'bg-[var(--paper-surface-3)]'"
          >
            <span
              class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all"
              :class="form.notif_whatsapp ? 'left-5' : 'left-0.5'"
            ></span>
          </button>
        </label>

        <div>
          <label class="block text-xs font-medium text-ink-100 mb-1">Telefone WhatsApp</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="(68) 99249-0198"
            class="w-full px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500"
          />
          <p class="text-[10px] text-ink-50 mt-1">Pode incluir DDD + 9. Brasil é padrão.</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-ink-100 mb-1">Horário do lembrete</label>
          <select v-model.number="form.reminder_hour" class="w-full px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500">
            <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
          </select>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button
          @click="saveProfile"
          :disabled="savingProfile"
          class="flex-1 px-4 py-2 text-sm font-medium bg-olive-500 text-ink-400 rounded-lg shadow-lg shadow-paper hover:shadow-paper-lg disabled:opacity-50 transition-all"
        >
          {{ savingProfile ? 'Salvando…' : 'Salvar' }}
        </button>
        <button
          @click="testWhatsApp"
          :disabled="testingWA || !form.phone"
          class="px-4 py-2 text-sm font-medium glass-light text-ink-300 hover:bg-[var(--paper-surface-3)] disabled:opacity-40 rounded-lg transition-colors"
        >
          {{ testingWA ? 'Enviando…' : 'Enviar teste' }}
        </button>
      </div>
    </section>

    <!-- Senha -->
    <section class="glass rounded-xl p-5 mb-4">
      <h2 class="text-sm font-semibold text-ink-400 mb-4 flex items-center gap-2">
        <span class="w-1 h-4 bg-gradient-to-b from-orange-400 to-red-500 rounded-full"></span>
        Segurança
      </h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-ink-100 mb-1">Senha atual</label>
          <input v-model="passwords.current" type="password" autocomplete="current-password" class="w-full px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-100 mb-1">Nova senha</label>
          <input v-model="passwords.next" type="password" autocomplete="new-password" class="w-full px-3 py-2 text-sm bg-[var(--paper-surface)] border border-[var(--paper-border)] rounded-lg text-ink-400 focus:outline-none focus:border-indigo_ink-500" />
          <p class="text-[10px] text-ink-50 mt-1">Mínimo 6 caracteres</p>
        </div>
      </div>
      <button
        @click="changePassword"
        :disabled="changingPwd || !passwords.current || !passwords.next"
        class="mt-4 px-4 py-2 text-sm font-medium bg-terra-500 text-ink-400 rounded-lg shadow-lg shadow-paper hover:shadow-paper-lg disabled:opacity-40 transition-all"
      >
        {{ changingPwd ? 'Alterando…' : 'Alterar senha' }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { hapticLight, hapticSuccess } from '../services/haptics'
import { useRealtimeRefresh } from '../composables/useRealtimeRefresh'

const auth = useAuthStore()
const toast = useToast()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  avatar_url: '',
  notif_whatsapp: 0,
  reminder_hour: 8,
})

const passwords = reactive({ current: '', next: '' })
const savingProfile = ref(false)
const uploadingAvatar = ref(false)
const testingWA = ref(false)
const changingPwd = ref(false)

const initial = computed(() => form.name?.charAt(0)?.toUpperCase() || '?')

async function load() {
  try {
    const { data } = await api.get('/auth/profile')
    Object.assign(form, {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || '',
      notif_whatsapp: data.notif_whatsapp || 0,
      reminder_hour: data.reminder_hour ?? 8,
    })
  } catch {
    toast.error('Falha ao carregar perfil')
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const { data } = await api.put('/auth/profile', {
      name: form.name,
      phone: form.phone,
      avatar_url: form.avatar_url || null,
      notif_whatsapp: form.notif_whatsapp ? 1 : 0,
      reminder_hour: form.reminder_hour,
    })
    auth.user = { ...auth.user, name: data.name }
    localStorage.setItem('user', JSON.stringify(auth.user))
    hapticSuccess()
    toast.success('Configurações salvas')
  } catch {
    toast.error('Falha ao salvar')
  } finally {
    savingProfile.value = false
  }
}

async function onAvatar(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Imagem muito grande (máx 5MB)')
    return
  }
  uploadingAvatar.value = true
  try {
    const { data: signed } = await api.post('/auth/profile/avatar/presign', {
      contentType: file.type || 'image/jpeg',
    })
    const putRes = await fetch(signed.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: file,
    })
    if (!putRes.ok) throw new Error('upload failed')
    form.avatar_url = signed.publicUrl
    await api.put('/auth/profile', { avatar_url: signed.publicUrl })
    auth.user = { ...auth.user, avatar_url: signed.publicUrl }
    localStorage.setItem('user', JSON.stringify(auth.user))
    hapticSuccess()
    toast.success('Foto atualizada')
  } catch {
    toast.error('Falha no upload da foto')
  } finally {
    uploadingAvatar.value = false
  }
}

async function testWhatsApp() {
  testingWA.value = true
  hapticLight()
  try {
    // garante que telefone está salvo antes de testar
    await api.put('/auth/profile', { phone: form.phone })
    const { data } = await api.post('/auth/profile/test-whatsapp')
    if (data.ok) {
      toast.success('Mensagem enviada! Confira o WhatsApp 📱')
      hapticSuccess()
    } else {
      toast.error(data.error || 'Falha no envio')
    }
  } catch (e) {
    const msg = e.response?.data?.error || 'Falha no envio'
    toast.error(msg)
  } finally {
    testingWA.value = false
  }
}

async function changePassword() {
  changingPwd.value = true
  try {
    await api.put('/auth/profile/password', { current: passwords.current, next: passwords.next })
    passwords.current = ''
    passwords.next = ''
    hapticSuccess()
    toast.success('Senha alterada')
  } catch (e) {
    toast.error(e.response?.data?.error || 'Falha ao alterar')
  } finally {
    changingPwd.value = false
  }
}

useRealtimeRefresh(load, ['/api/auth/profile'])
onMounted(load)
</script>
