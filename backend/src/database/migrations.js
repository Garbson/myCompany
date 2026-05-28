import pool from '../database.js'

// Migrações idempotentes — cada ALTER tenta executar e ignora se já existe.
// Ordem importa: rode na inicialização do servidor.
const migrations = [
  `ALTER TABLE tasks ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE tasks ADD COLUMN recurrence_days VARCHAR(20) DEFAULT NULL`,
]

const IGNORABLE_CODES = new Set([
  'ER_DUP_FIELDNAME',
  'ER_DUP_KEYNAME',
  'ER_DUP_ENTRY',
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
}
