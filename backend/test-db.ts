import { pool } from './src/services/db'

async function test() {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('Database connected:', result.rows[0])
    
    const users = await pool.query('SELECT COUNT(*) FROM users')
    console.log('Users count:', users.rows[0])
    
    await pool.end()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

test()
