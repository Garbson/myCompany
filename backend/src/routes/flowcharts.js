import { Router } from 'express'
import { list, get, create, update, remove } from '../controllers/flowchartController.js'
import {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/flowchartFolderController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

// Pastas
router.get('/flowchart-folders', listFolders)
router.post('/flowchart-folders', createFolder)
router.put('/flowchart-folders/:id', updateFolder)
router.delete('/flowchart-folders/:id', deleteFolder)

// Fluxogramas
router.get('/flowcharts', list)
router.post('/flowcharts', create)
router.get('/flowcharts/:id', get)
router.put('/flowcharts/:id', update)
router.delete('/flowcharts/:id', remove)

export default router
