import pg from "pg";
import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";

const { Pool } = pg;

const config = container.resolve<IConfig>("IConfig");

// Database connection pool
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
  process.exit(-1);
});

/**
 * Executes a database query and returns the full result.
 * Logs a warning for queries taking longer than 1 second.
 *
 * @param text - The SQL query string with $1, $2, etc. placeholders
 * @param params - Optional array of parameter values for the query
 * @returns The query result containing rows and metadata
 */
export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms): ${text}`);
  }

  return res;
}

/**
 * Executes a query and returns the first row, or null if no rows found.
 *
 * @param text - The SQL query string with $1, $2, etc. placeholders
 * @param params - Optional array of parameter values for the query
 * @returns The first row of the result, or null if no rows
 */
export async function queryOne<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Executes a query and returns all rows.
 *
 * @param text - The SQL query string with $1, $2, etc. placeholders
 * @param params - Optional array of parameter values for the query
 * @returns Array of all rows from the result
 */
export async function queryMany<T extends pg.QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

/**
 * Executes a callback within a database transaction.
 * Automatically commits on success or rolls back on error.
 *
 * @param callback - Function to execute within the transaction, receives a PoolClient
 * @returns The result of the callback function
 * @throws Rethrows any error from the callback after rolling back
 */
export async function withTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
