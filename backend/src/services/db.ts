import pg from 'pg'
import { config } from '@/config'

const { Pool } = pg

// Database connection pool
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

// Helper function for queries
export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms): ${text}`);
  }
  
  return res;
}

// Helper to get a single row
export async function queryOne<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

// Helper to get multiple rows
export async function queryMany<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
