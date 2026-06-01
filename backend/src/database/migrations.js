import pool from '../database.js'

// Migrações idempotentes — cada ALTER tenta executar e ignora se já existe.
// Ordem importa: rode na inicialização do servidor.
const migrations = [
  `ALTER TABLE tasks ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE tasks ADD COLUMN recurrence_days VARCHAR(20) DEFAULT NULL`,
  `ALTER TABLE projects ADD COLUMN priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium'`,
  `CREATE TABLE IF NOT EXISTS project_flow_tabs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(100) NOT NULL DEFAULT 'Aba',
    position INT NOT NULL DEFAULT 0,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_pft_project (project_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

const IGNORABLE_CODES = new Set([
  'ER_DUP_FIELDNAME',
  'ER_DUP_KEYNAME',
  'ER_DUP_ENTRY',
  'ER_TABLE_EXISTS_ERROR',
])

export async function runMigrations() {
  for (const sql of migrations) {
    try {
      await pool.query(sql)
      console.log('[migrations] applied:', sql.slice(0, 80))
    } catch (e) {
      if (!IGNORABLE_CODES.has(e.code)) {
        console.warn('[migrations] failed:', e.message)
      }
    }
  }
  // Migração de dados: traz o flow antigo (project_flows) pra primeira aba "Principal"
  try {
    const [old] = await pool.query(
      `SELECT pf.project_id, pf.data
       FROM project_flows pf
       LEFT JOIN project_flow_tabs pt ON pt.project_id = pf.project_id
       WHERE pt.id IS NULL`
    )
    for (const row of old) {
      await pool.query(
        `INSERT INTO project_flow_tabs (project_id, title, position, data) VALUES (?, ?, ?, ?)`,
        [row.project_id, 'Principal', 0, typeof row.data === 'string' ? row.data : JSON.stringify(row.data || { nodes: [], edges: [] })]
      )
    }
    if (old.length) {
      console.log(`[migrations] migrou ${old.length} flow(s) antigo(s) pra project_flow_tabs`)
    }
  } catch (e) {
    if (e.code !== 'ER_NO_SUCH_TABLE') {
      console.warn('[migrations] falha ao migrar dados de project_flows:', e.message)
    }
  }
}
