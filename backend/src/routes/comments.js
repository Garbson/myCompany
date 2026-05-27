import { Router } from 'express'
import { listByTask, create, remove } from '../controllers/commentController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/tasks/:taskId/comments', listByTask)
router.post('/tasks/:taskId/comments', create)
router.delete('/comments/:id', remove)

export default router
