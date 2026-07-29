<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="paper-strong gradient-border p-8 rounded-2xl w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-14 h-14 rounded-xl bg-terra-500 text-[#FDFBF5] flex items-center justify-center mx-auto mb-4 shadow-paper">
          <span class="font-serif font-semibold text-3xl leading-none">m</span>
        </div>
        <h1 class="font-serif text-3xl font-semibold text-ink-400 tracking-tight">myCompany</h1>
        <p class="text-ink-100 mt-2 text-sm">Documente. Diagrame. Entregue.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-ink-200 uppercase tracking-wider mb-1.5">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="input-paper w-full py-2.5"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-ink-200 uppercase tracking-wider mb-1.5">Senha</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="input-paper w-full py-2.5"
            placeholder="Sua senha"
          />
        </div>
        <p v-if="error" class="text-terra-600 text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full py-3 rounded-lg"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div v-if="showRegister" class="mt-6 pt-6 border-t border-[var(--paper-border)]">
        <h2 class="font-serif text-lg font-semibold text-ink-400 mb-3">Criar conta</h2>
        <form @submit.prevent="handleRegister" class="space-y-3">
          <input
            v-model="reg.name"
            type="text"
            required
            class="input-paper w-full py-2"
            placeholder="Nome"
          />
          <input
            v-model="reg.email"
            type="email"
            required
            class="input-paper w-full py-2"
            placeholder="Email"
          />
          <input
            v-model="reg.password"
            type="password"
            required
            class="input-paper w-full py-2"
            placeholder="Senha"
          />
          <p v-if="regError" class="text-terra-600 text-sm">{{ regError }}</p>
          <button
            type="submit"
            :disabled="regLoading"
            class="btn-secondary w-full py-2.5 rounded-lg"
          >
            {{ regLoading ? 'Criando...' : 'Criar conta' }}
          </button>
        </form>
      </div>

      <button
        @click="showRegister = !showRegister"
        class="mt-4 text-sm text-ink-100 hover:text-ink-300 w-full text-center transition-colors"
      >
        {{ showRegister ? 'Já tenho conta' : 'Criar uma conta' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

const showRegister = ref(false)
const reg = reactive({ name: '', email: '', password: '' })
const regError = ref('')
const regLoading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.email, form.password)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || 'Erro ao fazer login'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  regError.value = ''
  regLoading.value = true
  try {
    await auth.register(reg.name, reg.email, reg.password)
    router.push('/')
  } catch (e) {
    regError.value = e.response?.data?.error || 'Erro ao criar conta'
  } finally {
    regLoading.value = false
  }
}
</script>
