import { Router } from 'express'
import {
  get,
  save,
  listTabs,
  getTab,
  createTab,
  updateTab,
  deleteTab,
} from '../controllers/projectFlowController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// Legado (compat com versões anteriores): primeira aba do projeto
router.get('/projects/:projectId/flow', get)
router.put('/projects/:projectId/flow', save)

// Múltiplas abas
router.get('/projects/:projectId/flow-tabs', listTabs)
router.post('/projects/:projectId/flow-tabs', createTab)
router.get('/projects/:projectId/flow-tabs/:tabId', getTab)
router.put('/projects/:projectId/flow-tabs/:tabId', updateTab)
router.delete('/projects/:projectId/flow-tabs/:tabId', deleteTab)

export default router
