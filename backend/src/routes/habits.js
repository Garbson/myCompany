import { Router } from 'express'
import { list, create, update, remove, complete, uncomplete } from '../controllers/habitController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/habits', list)
router.post('/habits', create)
router.put('/habits/:id', update)
router.delete('/habits/:id', remove)
router.post('/habits/:id/complete', complete)
router.delete('/habits/:id/complete', uncomplete)

export default router
