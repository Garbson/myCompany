import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'mycompany',
  password: process.env.DB_PASSWORD || 'mycompany123',
  database: process.env.DB_NAME || 'mycompany',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true
})

export default pool
