import { Router } from 'express'
import { list, create, update, remove } from '../controllers/leadController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', list)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)

export default router
