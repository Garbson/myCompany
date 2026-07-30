import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { subscribeToRealtime } from '../services/realtime.js'

const router = Router()

router.get('/realtime/events', authMiddleware, subscribeToRealtime)

export default router
