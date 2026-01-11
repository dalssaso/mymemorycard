import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/db/schema";
import { injectable, inject } from "tsyringe";
import { sql } from "drizzle-orm";
import { Logger } from "@/infrastructure/logging/logger";
import type { IConfig } from "@/infrastructure/config/config.interface";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * DatabaseConnection manages the PostgreSQL connection and Drizzle ORM instance.
 * Receives configuration via DI injection.
 */
@injectable()
export class DatabaseConnection {
  public readonly db: DrizzleDB;
  private readonly queryClient: Sql;
  private readonly logger: Logger;

  /**
   * Initializes PostgreSQL connection pool via Drizzle ORM.
   *
   * **Default Pool Configuration:**
   * - `max`: 10 connections - Balances resource usage and concurrency for
   *   typical single-machine deployments
   * - `idle_timeout`: 30 seconds - Recycles idle connections to prevent
   *   resource leaks and stale connections
   * - `connect_timeout`: 10 seconds - Fail-fast on connection failures,
   *   useful for detecting network issues and misconfigured databases
   *
   * **Why These Defaults:**
   * - Suitable for development and low-to-medium traffic services
   * - Conservative resource usage to prevent exhausting system limits
   * - Fast failure detection without being aggressive
   *
   * **Production Tuning:**
   * - High-traffic services: Increase `max` to 20–50 based on concurrent
   *   request load (monitor Prometheus metrics: `pg_pool_available_connections`)
   * - Latency-critical services: Lower `connect_timeout` (e.g., 5 seconds) to
   *   fail faster in degraded networks
   * - Long-running queries: Keep `idle_timeout` high (e.g., 60s) to avoid
   *   closing connections during slow operations
   *
   * **Override defaults via environment variables:**
   * - `DB_POOL_MAX` (e.g., 30)
   * - `DB_POOL_IDLE_TIMEOUT` (seconds, e.g., 60)
   * - `DB_POOL_CONNECT_TIMEOUT` (seconds, e.g., 5)
   *
   * **Monitor pool health via Prometheus metrics:**
   * - `pg_pool_available_connections` - Free connections in pool
   * - `pg_pool_total_connections` - Total active connections
   * - `db_query_duration_seconds` - Query execution time (detect slow queries)
   * - Adjust `max` when available connections approach 0
   * - Watch for connection timeouts in application logs
   *
   * @param config - Injected configuration with optional database.pool overrides
   * @param logger - Injected logger instance for connection diagnostics
   */
  constructor(@inject("IConfig") config: IConfig, @inject(Logger) logger: Logger) {
    const poolConfig = config.database.pool || {};

    this.queryClient = postgres(config.database.url, {
      max: poolConfig.max ?? 10,
      idle_timeout: poolConfig.idleTimeout ?? 30,
      connect_timeout: poolConfig.connectTimeout ?? 10,
    });
    this.db = drizzle(this.queryClient, { schema });
    this.logger = logger.child("DatabaseConnection");
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error("Database health check failed", message, stack);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.queryClient.end();
      this.logger.info("Database connection closed successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to close database connection", message);
      throw error;
    }
  }
}
