import { Router } from 'express'
import { listByTask, create, update, remove } from '../controllers/subtaskController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/tasks/:taskId/subtasks', listByTask)
router.post('/tasks/:taskId/subtasks', create)
router.put('/subtasks/:id', update)
router.delete('/subtasks/:id', remove)

export default router
