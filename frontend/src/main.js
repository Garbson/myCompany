import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Safe area bottom inset for Android (iOS uses env() natively)
function applySafeBottom() {
  const style = document.documentElement.style

  // 1. Check if Capacitor injected --safe-area-inset-bottom (API 36+)
  const capVar = getComputedStyle(document.documentElement)
    .getPropertyValue('--safe-area-inset-bottom').trim()
  if (capVar && parseFloat(capVar) > 0) {
    return // Capacitor handles it via CSS variable
  }

  // 2. Check if env() works (iOS or Android WebView 140+)
  const el = document.createElement('div')
  el.style.paddingBottom = 'env(safe-area-inset-bottom)'
  document.body.appendChild(el)
  const envBottom = getComputedStyle(el).paddingBottom
  document.body.removeChild(el)

  if (parseFloat(envBottom) > 0) {
    return // env() works natively, no JS fallback needed
  }

  // 3. Fallback for Android: measure system bars via screen dimensions
  if (window.visualViewport) {
    const calc = () => {
      // screen.height is the full physical screen, innerHeight is the visible area
      const dpr = window.devicePixelRatio || 1
      const screenH = window.screen.height / dpr
      const estatusBar = 24 // Android status bar ~24dp
      const navBar = Math.max(0, screenH - window.innerHeight - estatusBar)
      style.setProperty('--safe-bottom', Math.round(navBar) + 'px')
    }
    calc()
    window.visualViewport.addEventListener('resize', calc)
  }
}
applySafeBottom()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
