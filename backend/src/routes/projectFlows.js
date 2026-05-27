import { Router } from 'express'
import { get, save } from '../controllers/projectFlowController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/projects/:projectId/flow', get)
router.put('/projects/:projectId/flow', save)

export default router
