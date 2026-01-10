import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/db/schema";
import { injectable, inject } from "tsyringe";
import { sql } from "drizzle-orm";
import { Logger } from "@/infrastructure/logging/logger";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// Default to local Docker postgres for development/testing
const DEFAULT_DATABASE_URL = "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard";

/**
 * DatabaseConnection manages the PostgreSQL connection and Drizzle ORM instance.
 * Accepts configuration via constructor parameters for testing and flexibility.
 */
@injectable()
export class DatabaseConnection {
  public readonly db: DrizzleDB;
  private readonly queryClient: Sql;
  private readonly logger: Logger;

  constructor(connectionString?: string, postgresClient?: Sql, @inject(Logger) logger?: Logger) {
    // Priority: provided postgres client > connection string > environment > default
    if (postgresClient) {
      this.queryClient = postgresClient;
    } else {
      const url = connectionString || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
      this.queryClient = postgres(url);
    }

    this.db = drizzle(this.queryClient, { schema });
    this.logger = logger ?? new Logger("DatabaseConnection");
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
    await this.queryClient.end();
  }
}
