import { Router } from 'express'
import { list, get, create, update, remove } from '../controllers/noteController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/notes', list)
router.post('/notes', create)
router.get('/notes/:id', get)
router.put('/notes/:id', update)
router.delete('/notes/:id', remove)

export default router
