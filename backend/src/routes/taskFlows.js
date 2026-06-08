import { Router } from 'express'
import {
  listTabs,
  getTab,
  createTab,
  updateTab,
  deleteTab,
} from '../controllers/taskFlowController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/tasks/:taskId/flow-tabs', listTabs)
router.post('/tasks/:taskId/flow-tabs', createTab)
router.get('/tasks/:taskId/flow-tabs/:tabId', getTab)
router.put('/tasks/:taskId/flow-tabs/:tabId', updateTab)
router.delete('/tasks/:taskId/flow-tabs/:tabId', deleteTab)

export default router
