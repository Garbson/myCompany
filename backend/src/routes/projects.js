import { Router } from 'express'
import { list, create, update, remove, getPayments, addPayment, payInstallment } from '../controllers/projectController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', list)
router.post('/', create)
router.put('/:id', update)
router.delete('/:id', remove)

router.get('/:id/payments', getPayments)
router.post('/:id/payments', addPayment)

router.put('/payments/:id/pay', payInstallment)

export default router
