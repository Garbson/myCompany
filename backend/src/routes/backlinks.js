import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { backlinksToFlowchart, backlinksToNote } from '../controllers/backlinkController.js'

const router = Router()
router.use(authMiddleware)

router.get('/backlinks/flowchart/:id', backlinksToFlowchart)
router.get('/backlinks/note/:id', backlinksToNote)

export default router
