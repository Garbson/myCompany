import { Router } from 'express'
import { search } from '../controllers/searchController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)
router.get('/search', search)

export default router
