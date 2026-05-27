import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { auth: true }
  },
  {
    path: '/tarefas',
    name: 'Tarefas',
    component: () => import('../views/Tarefas.vue'),
    meta: { auth: true }
  },
  {
    path: '/leads',
    name: 'Leads',
    component: () => import('../views/Leads.vue'),
    meta: { auth: true }
  },
  {
    path: '/freelas',
    name: 'Freelas',
    component: () => import('../views/Freelas.vue'),
    meta: { auth: true }
  },
  {
    path: '/projetos',
    name: 'Projetos',
    component: () => import('../views/Projetos.vue'),
    meta: { auth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.auth && !token) {
    return next('/login')
  }

  if (to.meta.guest && token) {
    return next('/')
  }

  next()
})

export default router
