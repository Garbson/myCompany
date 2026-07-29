import pool from '../database.js'

// GET /api/backlinks/flowchart/:id — quais notas embedam este fluxograma
export async function backlinksToFlowchart(req, res) {
  const flowId = Number(req.params.id)
  if (!flowId) return res.status(400).json({ error: 'id inválido' })
  try {
    // Confere ownership
    const [own] = await pool.query('SELECT id FROM flowcharts WHERE id = ? AND user_id = ?', [flowId, req.userId])
    if (own.length === 0) return res.status(404).json({ error: 'Fluxograma não encontrado' })
    // Nota contém `flowEmbed` com esse flowchartId em qualquer nível do JSON.
    // Sem FULLTEXT: busca substring "flowchartId":N no content (funciona pra Tiptap JSON stringificado).
    const pattern = `%"flowchartId":${flowId}%`
    const [rows] = await pool.query(
      `SELECT id, title, folder_id, updated_at
       FROM notes
       WHERE user_id = ? AND content LIKE ?
       ORDER BY updated_at DESC
       LIMIT 20`,
      [req.userId, pattern]
    )
    res.json({ notes: rows })
  } catch (e) {
    console.error('[backlinks flowchart]', e.message)
    res.status(500).json({ error: 'Falha ao buscar backlinks' })
  }
}

// GET /api/backlinks/note/:id — quais fluxogramas têm nó linkando esta nota
export async function backlinksToNote(req, res) {
  const noteId = Number(req.params.id)
  if (!noteId) return res.status(400).json({ error: 'id inválido' })
  try {
    const [own] = await pool.query('SELECT id FROM notes WHERE id = ? AND user_id = ?', [noteId, req.userId])
    if (own.length === 0) return res.status(404).json({ error: 'Nota não encontrada' })
    const pattern = `%"linkedNoteId":${noteId}%`
    const [rows] = await pool.query(
      `SELECT id, title, folder_id, updated_at
       FROM flowcharts
       WHERE user_id = ? AND JSON_EXTRACT(data, '$') LIKE ?
       ORDER BY updated_at DESC
       LIMIT 20`,
      [req.userId, pattern]
    )
    res.json({ flowcharts: rows })
  } catch (e) {
    console.error('[backlinks note]', e.message)
    res.status(500).json({ error: 'Falha ao buscar backlinks' })
  }
}
