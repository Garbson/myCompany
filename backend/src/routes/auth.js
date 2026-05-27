import { Router } from 'express'
import { login, register, me, listUsers } from '../controllers/authController.js'
import { me as profileMe, update as updateProfile, changePassword, testWhatsApp, presignAvatar } from '../controllers/profileController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authMiddleware, me)
router.get('/users', authMiddleware, listUsers)

// Profile
router.get('/profile', authMiddleware, profileMe)
router.put('/profile', authMiddleware, updateProfile)
router.put('/profile/password', authMiddleware, changePassword)
router.post('/profile/test-whatsapp', authMiddleware, testWhatsApp)
router.post('/profile/avatar/presign', authMiddleware, presignAvatar)

export default router
