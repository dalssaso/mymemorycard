import "reflect-metadata";
import { registerDependencies, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { runMigrations, closeMigrationConnection } from "@/db";
import { seedPlatforms } from "@/db/seed";
import type { IConfig } from "@/infrastructure/config/config.interface";

// Import legacy routes (registers them with the old router)
import "@/routes/auth";
import "@/routes/import";
import "@/routes/platforms";
import "@/routes/games";
import "@/routes/collections";
import "@/routes/api-stats";
import "@/routes/admin";
import "@/routes/preferences";
import "@/routes/achievements";
import "@/routes/sessions";
import "@/routes/completion-logs";
import "@/routes/additions";
import "@/routes/ownership";
import "@/routes/stats";
import "@/routes/editions";
import "@/routes/franchises";
import "@/routes/user-platforms";
import "@/routes/ai";

async function startServer(): Promise<void> {
  // Run migrations and seed data
  await runMigrations();
  await seedPlatforms();
  await closeMigrationConnection();

  // Register DI dependencies
  registerDependencies();

  // Create Hono app (includes legacy routes proxy)
  const app = createHonoApp();

  // Start server
  const config = container.resolve<IConfig>("IConfig");
  const server = Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });

  console.log(`Server running on http://localhost:${server.port}`);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
