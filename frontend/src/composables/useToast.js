import { ref } from 'vue'

const toasts = ref([])
let nextId = 0

function push(message, type = 'info', duration = 3000) {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (m, d) => push(m, 'success', d),
    error: (m, d) => push(m, 'error', d ?? 5000),
    info: (m, d) => push(m, 'info', d),
    warning: (m, d) => push(m, 'warning', d ?? 4000),
  }
}
