import { Router } from 'express'
import { list, presign, confirm, remove } from '../controllers/attachmentController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/:entityType/:entityId/attachments', list)
router.post('/:entityType/:entityId/attachments/presign', presign)
router.post('/:entityType/:entityId/attachments', confirm)
router.delete('/attachments/:id', remove)

export default router
