import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { presignUpload } from '../services/r2.js'

const router = Router()
router.use(authMiddleware)

const MAX_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/', 'application/zip', 'application/x-']

// POST /api/uploads/inline — presign pra upload inline no editor (imagens, PDFs, etc)
// body: { filename, contentType, size, scope? }  scope: 'note' (default) | 'flowchart'
router.post('/uploads/inline', async (req, res) => {
  const { filename, contentType, size, scope = 'note' } = req.body || {}
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename e contentType são obrigatórios' })
  }
  if (size && size > MAX_SIZE) {
    return res.status(400).json({ error: `Arquivo maior que ${MAX_SIZE / 1024 / 1024}MB` })
  }
  if (!ALLOWED_MIME_PREFIXES.some((p) => contentType.startsWith(p))) {
    return res.status(400).json({ error: 'Tipo de arquivo não permitido' })
  }
  const ext = (filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
  const rnd = Math.random().toString(36).slice(2, 8)
  const key = `mycompany/${req.userId}/${scope}/inline/${Date.now()}-${rnd}-${safe}`
  try {
    const { uploadUrl, publicUrl } = await presignUpload(key, contentType)
    res.json({ uploadUrl, publicUrl, key, expiresIn: 600 })
  } catch (e) {
    console.error('[uploads/inline] erro:', e.message)
    res.status(500).json({ error: 'Falha ao gerar upload' })
  }
})

export default router
