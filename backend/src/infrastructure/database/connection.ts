import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { injectable } from "tsyringe";
import { sql } from "drizzle-orm";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// Default to local Docker postgres for development/testing
const DEFAULT_DATABASE_URL =
  "postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard";

const queryClient = postgres(process.env.DATABASE_URL || DEFAULT_DATABASE_URL);

export const db = drizzle(queryClient, { schema });

@injectable()
export class DatabaseConnection {
  public readonly db: DrizzleDB;

  constructor() {
    this.db = db;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }
}
