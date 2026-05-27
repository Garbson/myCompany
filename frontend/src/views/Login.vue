<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="glass-strong gradient-border p-8 rounded-2xl w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-white">myCompany</h1>
        <p class="text-gray-400 mt-2">Entre para gerenciar seu negócio</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-300 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-300 mb-1">Senha</label>
          <input
            v-model="form.password"
            type="password"
            required
            class="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Sua senha"
          />
        </div>
        <p v-if="error" class="text-red-400 text-sm">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div v-if="showRegister" class="mt-6 pt-6 border-t border-gray-700">
        <h2 class="text-lg font-medium text-white mb-3">Criar conta</h2>
        <form @submit.prevent="handleRegister" class="space-y-3">
          <input
            v-model="reg.name"
            type="text"
            required
            class="w-full px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Nome"
          />
          <input
            v-model="reg.email"
            type="email"
            required
            class="w-full px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Email"
          />
          <input
            v-model="reg.password"
            type="password"
            required
            class="w-full px-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            placeholder="Senha"
          />
          <p v-if="regError" class="text-red-400 text-sm">{{ regError }}</p>
          <button
            type="submit"
            :disabled="regLoading"
            class="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {{ regLoading ? 'Criando...' : 'Criar conta' }}
          </button>
        </form>
      </div>

      <button
        @click="showRegister = !showRegister"
        class="mt-4 text-sm text-gray-400 hover:text-gray-300 w-full text-center"
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
