const { Pool } = require('pg')

const pgConfig = {
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false },
}
function fetchResultPg(query, { singleResult = false } = {}) {
  return async (...args) => {
    const pool = new Pool(pgConfig)
    const request = await pool.connect()
    try {
      const result = await query(...args, request)
      await request.release()
      const records = result.rows
      return singleResult ? records[0] : records
    } catch (error) {
      await request.release()
      throw error
    }
  }
}

module.exports = {
  fetchResultPg,
}
