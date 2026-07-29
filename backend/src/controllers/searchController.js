import pool from '../database.js'

// GET /api/search?q=texto — busca em anotações, fluxogramas e projetos do usuário
export async function search(req, res) {
  const q = (req.query.q || '').trim()
  if (!q || q.length < 2) {
    return res.json({ notes: [], flowcharts: [], projects: [], query: q })
  }
  const like = `%${q}%`
  const userId = req.userId
  const companyId = req.companyId

  try {
    const [notes] = await pool.query(
      `SELECT id, title, folder_id,
              SUBSTRING(content, 1, 220) AS snippet
       FROM notes
       WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
       ORDER BY updated_at DESC
       LIMIT 8`,
      [userId, like, like]
    )

    const [flowcharts] = await pool.query(
      `SELECT id, title, folder_id
       FROM flowcharts
       WHERE user_id = ? AND title LIKE ?
       ORDER BY updated_at DESC
       LIMIT 8`,
      [userId, like]
    )

    let projects = []
    if (companyId) {
      const [rows] = await pool.query(
        `SELECT id, name
         FROM projects
         WHERE company_id = ? AND name LIKE ?
         ORDER BY updated_at DESC
         LIMIT 8`,
        [companyId, like]
      )
      projects = rows
    }

    // Sanitiza snippet das notas (tira JSON bruto se for Tiptap)
    const cleanedNotes = notes.map((n) => ({
      id: n.id,
      title: n.title || 'Sem título',
      folder_id: n.folder_id,
      snippet: extractText(n.snippet).slice(0, 140),
    }))

    res.json({
      query: q,
      notes: cleanedNotes,
      flowcharts,
      projects,
    })
  } catch (e) {
    console.error('[search] erro:', e.message)
    res.status(500).json({ error: 'Falha na busca' })
  }
}

function extractText(raw) {
  if (!raw) return ''
  // Tenta parsear JSON do Tiptap; senão retorna texto puro
  try {
    const parsed = JSON.parse(raw)
    return walkTiptap(parsed)
  } catch {
    return raw
  }
}

function walkTiptap(node) {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (node.type === 'text' && node.text) return node.text
  if (Array.isArray(node.content)) {
    return node.content.map(walkTiptap).join(' ')
  }
  return ''
}
