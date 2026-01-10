import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "@/db/schema";
import { injectable } from "tsyringe";
import { sql } from "drizzle-orm";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// Default to local Docker postgres for development/testing
const DEFAULT_DATABASE_URL =
  "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard";

/**
 * DatabaseConnection manages the PostgreSQL connection and Drizzle ORM instance.
 * Accepts configuration via constructor parameters for testing and flexibility.
 */
@injectable()
export class DatabaseConnection {
  public readonly db: DrizzleDB;
  private readonly queryClient: Sql;

  constructor(connectionString?: string, postgresClient?: Sql) {
    // Priority: provided postgres client > connection string > environment > default
    if (postgresClient) {
      this.queryClient = postgresClient;
    } else {
      const url = connectionString || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
      this.queryClient = postgres(url);
    }

    this.db = drizzle(this.queryClient, { schema });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.queryClient.end();
  }
}
