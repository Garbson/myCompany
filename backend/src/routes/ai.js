import { Router } from 'express'
import { extractTask, createFromText } from '../controllers/aiController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// Só extrai e retorna o JSON (dry-run, útil pra testar prompt)
router.post('/ai/extract-task', extractTask)

// Extrai + cria a tarefa
router.post('/ai/create-task', createFromText)

export default router
