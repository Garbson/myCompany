import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Safe area bottom inset for Android (iOS uses env() natively)
function applySafeBottom() {
  const style = document.documentElement.style
  // Try to read the CSS env value first (works on iOS)
  const el = document.createElement('div')
  el.style.paddingBottom = 'env(safe-area-inset-bottom)'
  document.body.appendChild(el)
  const envBottom = getComputedStyle(el).paddingBottom
  document.body.removeChild(el)

  const envVal = parseFloat(envBottom) || 0
  if (envVal > 0) {
    // iOS - env() works, use it via CSS
    return
  }
  // Android - env() returns 0, calculate manually
  // In Capacitor edge-to-edge mode, window.innerHeight > visualViewport.height
  if (window.visualViewport) {
    const calc = () => {
      const inset = window.innerHeight - window.visualViewport.height
      style.setProperty('--safe-bottom', Math.round(inset) + 'px')
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
