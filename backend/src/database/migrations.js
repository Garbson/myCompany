import pool from '../database.js'
import bcrypt from 'bcryptjs'

// Migrações idempotentes — cada ALTER tenta executar e ignora se já existe.
// Ordem importa: rode na inicialização do servidor.
const migrations = [
  `ALTER TABLE tasks ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0`,
  `ALTER TABLE tasks ADD COLUMN recurrence_days VARCHAR(20) DEFAULT NULL`,
  `ALTER TABLE projects ADD COLUMN priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium'`,
  `ALTER TABLE companies ADD COLUMN work_mode TINYINT(1) NOT NULL DEFAULT 0`,
  `CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT,
    title VARCHAR(255) NOT NULL DEFAULT '',
    content MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notes_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS habits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    identity VARCHAR(255),
    frequency ENUM('daily','specific_days') NOT NULL DEFAULT 'daily',
    recurrence_days VARCHAR(20),
    cue_time TIME,
    cue_location VARCHAR(255),
    stack_after VARCHAR(255),
    temptation_bundle TEXT,
    two_minute_version VARCHAR(255),
    reward TEXT,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_habits_user (user_id, archived)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS task_flow_tabs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    title VARCHAR(100) NOT NULL DEFAULT 'Aba',
    position INT NOT NULL DEFAULT 0,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_tft_task (task_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS habit_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    user_id INT NOT NULL,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    UNIQUE KEY uq_habit_date (habit_id, completion_date),
    INDEX idx_completions_user_date (user_id, completion_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
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
  `CREATE TABLE IF NOT EXISTS note_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_nf_user (user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `ALTER TABLE notes ADD COLUMN folder_id INT DEFAULT NULL`,
  `ALTER TABLE notes ADD CONSTRAINT fk_notes_folder FOREIGN KEY (folder_id) REFERENCES note_folders(id) ON DELETE SET NULL`,
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
  // Garante que a company do Garbson está em work_mode=1 (sem leads/freelas)
  try {
    await pool.query(
      `UPDATE companies SET work_mode = 1
       WHERE id IN (SELECT company_id FROM users WHERE email = 'garbsonsouza@gmail.com' AND company_id IS NOT NULL)`
    )
  } catch (e) {
    console.warn('[migrations] falha ao atualizar work_mode do Garbson:', e.message)
  }

  // Seed do usuário Emanuel: cria company "Emanuel" (work_mode=1) + user emanuel@gmail.com
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', ['emanuel@gmail.com'])
    if (existing.length === 0) {
      const [comp] = await pool.query(
        `INSERT INTO companies (name, work_mode) VALUES (?, 1)`,
        ['Emanuel']
      )
      const hash = await bcrypt.hash('emanuel123', 10)
      await pool.query(
        `INSERT INTO users (name, email, password_hash, company_id) VALUES (?, ?, ?, ?)`,
        ['Emanuel', 'emanuel@gmail.com', hash, comp.insertId]
      )
      console.log(`[migrations] usuário Emanuel criado (company id=${comp.insertId})`)
    }
  } catch (e) {
    console.warn('[migrations] falha ao criar usuário Emanuel:', e.message)
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
