import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID || 'aa8fd0671b3bdd1508e15038c8d0cbce'
const bucket = process.env.R2_BUCKET || 'pizzagest-images'
const publicBase = process.env.R2_PUBLIC_URL || 'https://pub-aa8fd0671b3bdd1508e15038c8d0cbce.r2.dev'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || '892e73e181ac0802c849a3880ceaec8f',
    secretAccessKey:
      process.env.R2_SECRET_KEY || '51688dd90af7e5eb95d8dd83815ed2633d30e112d5192e66fa1bf30be3cda752',
  },
})

export async function presignUpload(key, contentType, expiresIn = 600) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  const url = await getSignedUrl(s3, cmd, { expiresIn })
  return { uploadUrl: url, publicUrl: `${publicBase}/${key}` }
}

export async function deleteObject(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export function buildKey({ companyId, entityType, entityId, filename }) {
  const ext = filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  const safe = filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 60)
  const rnd = Math.random().toString(36).slice(2, 8)
  return `mycompany/${companyId}/${entityType}/${entityId}/${Date.now()}-${rnd}-${safe}`
}
