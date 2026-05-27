import { Router } from 'express'
import { login, register, me, listUsers } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authMiddleware, me)
router.get('/users', authMiddleware, listUsers)

export default router
