import pool from '../database.js'
import { presignUpload, deleteObject, buildKey } from '../services/r2.js'

const ALLOWED_ENTITIES = ['task', 'project']
const TABLE_BY_ENTITY = { task: 'tasks', project: 'projects' }
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

async function ensureEntityBelongsToCompany(entityType, entityId, companyId) {
  const table = TABLE_BY_ENTITY[entityType]
  if (!table) return false
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE id = ? AND company_id = ?`, [entityId, companyId])
  return rows.length > 0
}

export async function list(req, res) {
  const { entityType, entityId } = req.params
  if (!ALLOWED_ENTITIES.includes(entityType)) {
    return res.status(400).json({ error: 'Tipo inválido' })
  }
  if (!(await ensureEntityBelongsToCompany(entityType, entityId, req.companyId))) {
    return res.status(404).json({ error: 'Não encontrado' })
  }
  const [rows] = await pool.query(
    `SELECT a.id, a.entity_type, a.entity_id, a.filename, a.mime_type, a.size_bytes,
            a.url, a.user_id, a.created_at, u.name AS user_name
     FROM attachments a LEFT JOIN users u ON u.id = a.user_id
     WHERE a.entity_type = ? AND a.entity_id = ? AND a.company_id = ?
     ORDER BY a.created_at DESC`,
    [entityType, entityId, req.companyId]
  )
  res.json(rows)
}

export async function presign(req, res) {
  const { entityType, entityId } = req.params
  const { filename, contentType, size } = req.body
  if (!filename || !contentType) {
    return res.status(400).json({ error: 'filename e contentType são obrigatórios' })
  }
  if (size && size > MAX_SIZE) {
    return res.status(400).json({ error: `Arquivo maior que ${MAX_SIZE / 1024 / 1024}MB` })
  }
  if (!ALLOWED_ENTITIES.includes(entityType)) {
    return res.status(400).json({ error: 'Tipo inválido' })
  }
  if (!(await ensureEntityBelongsToCompany(entityType, entityId, req.companyId))) {
    return res.status(404).json({ error: 'Não encontrado' })
  }
  const key = buildKey({ companyId: req.companyId, entityType, entityId, filename })
  const { uploadUrl, publicUrl } = await presignUpload(key, contentType)
  res.json({ uploadUrl, publicUrl, key, expiresIn: 600 })
}

export async function confirm(req, res) {
  const { entityType, entityId } = req.params
  const { filename, mimeType, size, storageKey, url } = req.body
  if (!filename || !storageKey || !url) {
    return res.status(400).json({ error: 'Dados incompletos' })
  }
  if (!ALLOWED_ENTITIES.includes(entityType)) {
    return res.status(400).json({ error: 'Tipo inválido' })
  }
  if (!(await ensureEntityBelongsToCompany(entityType, entityId, req.companyId))) {
    return res.status(404).json({ error: 'Não encontrado' })
  }
  const [result] = await pool.query(
    `INSERT INTO attachments (entity_type, entity_id, filename, mime_type, size_bytes, storage_key, url, user_id, company_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entityType, entityId, filename, mimeType || null, size || null, storageKey, url, req.userId, req.companyId]
  )
  const [rows] = await pool.query(
    `SELECT a.id, a.entity_type, a.entity_id, a.filename, a.mime_type, a.size_bytes,
            a.url, a.user_id, a.created_at, u.name AS user_name
     FROM attachments a LEFT JOIN users u ON u.id = a.user_id WHERE a.id = ?`,
    [result.insertId]
  )
  res.status(201).json(rows[0])
}

export async function remove(req, res) {
  const { id } = req.params
  const [own] = await pool.query(
    'SELECT id, storage_key FROM attachments WHERE id = ? AND company_id = ?',
    [id, req.companyId]
  )
  if (own.length === 0) return res.status(404).json({ error: 'Não encontrado' })
  await pool.query('DELETE FROM attachments WHERE id = ?', [id])
  if (own[0].storage_key) await deleteObject(own[0].storage_key)
  res.json({ success: true })
}
