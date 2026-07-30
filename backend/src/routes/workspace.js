import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import {
  applyTemplate,
  convertInbox,
  createEvent,
  createInbox,
  createRelation,
  createTemplate,
  deleteEvent,
  deleteInbox,
  deleteRelation,
  deleteTemplate,
  listEvents,
  listInbox,
  listRelations,
  listTemplates,
  updateEvent,
  updateInbox,
} from '../controllers/workspaceController.js'

const router = Router()
router.use(authMiddleware)

router.get('/workspace/inbox', listInbox)
router.post('/workspace/inbox', createInbox)
router.put('/workspace/inbox/:id', updateInbox)
router.delete('/workspace/inbox/:id', deleteInbox)
router.post('/workspace/inbox/:id/convert', convertInbox)

router.get('/workspace/events', listEvents)
router.post('/workspace/events', createEvent)
router.put('/workspace/events/:id', updateEvent)
router.delete('/workspace/events/:id', deleteEvent)

router.get('/workspace/templates', listTemplates)
router.post('/workspace/templates', createTemplate)
router.delete('/workspace/templates/:id', deleteTemplate)
router.post('/workspace/templates/:id/apply', applyTemplate)

router.get('/workspace/relations/:entityType/:entityId', listRelations)
router.post('/workspace/relations', createRelation)
router.delete('/workspace/relations/:id', deleteRelation)

export default router
