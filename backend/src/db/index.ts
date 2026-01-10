import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

// Legacy database connection using environment variables directly
// This is used for migrations before DI container is initialized
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

const migrationClient = postgres(connectionString, { max: 1 });

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

export async function runMigrations(): Promise<void> {
  console.log("Running database migrations...");
  const migrationDb = drizzle(migrationClient);
  await migrate(migrationDb, { migrationsFolder: "./drizzle" });
  console.log("Migrations completed successfully");
}

export async function closeMigrationConnection(): Promise<void> {
  await migrationClient.end();
}

export { schema };
