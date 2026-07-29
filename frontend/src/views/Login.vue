<template>
  <div class="login-notebook min-h-screen flex items-center justify-center p-4">
    <div class="login-sheet paper-strong p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <PageLogo size="lg" class="mx-auto mb-5" />
        <h1 class="font-serif text-3xl font-semibold text-ink-400 tracking-tight">myPaper</h1>
        <p class="text-ink-100 mt-2 text-sm">Ideias, planos e trabalho no mesmo caderno.</p>
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
import PageLogo from '../components/brand/PageLogo.vue'

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

<style scoped>
.login-notebook {
  background-color: #e9dfca;
  background-image:
    linear-gradient(rgba(245, 239, 223, .2), rgba(245, 239, 223, .2)),
    url('/mypaper-workspace.webp'),
    linear-gradient(90deg, transparent 0, transparent 12%, rgba(184, 89, 61, .12) 12%, rgba(184, 89, 61, .12) calc(12% + 1px), transparent calc(12% + 1px)),
    repeating-linear-gradient(0deg, transparent 0, transparent 35px, rgba(44, 74, 92, .06) 35px, rgba(44, 74, 92, .06) 36px);
  background-size: cover, cover, 100% 100%, 100% 100%;
  background-position: center;
}
.login-sheet {
  position: relative;
  border-radius: 5px 15px 8px 12px;
  clip-path: polygon(1% 0, 98% 1%, 100% 97%, 96% 100%, 0 99%);
  transform: rotate(-.2deg);
}
.login-sheet::before {
  content: '';
  position: absolute;
  width: 105px;
  height: 25px;
  top: -10px;
  left: 50%;
  transform: translateX(-50%) rotate(2deg);
  background: rgba(211, 176, 139, .48);
}
</style>
