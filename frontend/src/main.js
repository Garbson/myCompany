import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Detecta altura do teclado virtual via visualViewport e expoe como --kb
function setupViewport() {
  const root = document.documentElement
  const update = () => {
    const vv = window.visualViewport
    if (!vv) return
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
    root.style.setProperty('--kb', kb + 'px')
    root.style.setProperty('--vvh', vv.height + 'px')
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    update()
  } else {
    root.style.setProperty('--kb', '0px')
    root.style.setProperty('--vvh', window.innerHeight + 'px')
  }
}
setupViewport()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}
