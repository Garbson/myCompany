import { Router } from 'express'
import { summary } from '../controllers/dashboardController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', summary)

export default router
