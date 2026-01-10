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

  constructor(@inject("IConfig") config: IConfig, @inject(Logger) logger: Logger) {
    this.queryClient = postgres(config.database.url);
    this.db = drizzle(this.queryClient, { schema });
    this.logger = logger;
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
