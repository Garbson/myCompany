import { Router } from 'express'
import { listFolders, createFolder, updateFolder, deleteFolder } from '../controllers/noteFolderController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/note-folders', listFolders)
router.post('/note-folders', createFolder)
router.put('/note-folders/:id', updateFolder)
router.delete('/note-folders/:id', deleteFolder)

export default router
