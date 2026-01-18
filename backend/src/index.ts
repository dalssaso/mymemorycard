import "reflect-metadata";
import { registerDependencies, container } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";
import { runMigrations, closeMigrationConnection } from "@/db";
import { seedPlatforms } from "@/db/seed";
import { initializeEncryptionKey } from "@/lib/encryption";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type { IRedisConnection } from "@/infrastructure/redis/connection.interface";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { CONFIG_TOKEN, REDIS_CONNECTION_TOKEN } from "@/container/tokens";

// Import legacy routes (registers them with the old router)
import "@/routes/import";
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

async function startServer(): Promise<void> {
  // Run migrations and seed data
  await runMigrations();
  await seedPlatforms();
  await closeMigrationConnection();

  // Register DI dependencies
  registerDependencies();

  // Initialize encryption key (must be after registerDependencies)
  initializeEncryptionKey();

  // Create Hono app (includes legacy routes proxy)
  const app = createHonoApp();

  // Start server
  const config = container.resolve<IConfig>(CONFIG_TOKEN);
  const server = Bun.serve({
    port: config.port,
    fetch: app.fetch,
  });

  console.log(`Server running on http://localhost:${server.port}`);

  // Graceful shutdown handlers with timeout
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received, shutting down gracefully...`);

    const SHUTDOWN_TIMEOUT = 10000; // 10 seconds
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      // Create shutdown operations promise
      const shutdownPromise = (async () => {
        // Stop accepting new connections
        server.stop();

        // Close database connection
        const dbConnection = container.resolve(DatabaseConnection);
        await dbConnection.close();

        // Close Redis connection
        const redisConnection = container.resolve<IRedisConnection>(REDIS_CONNECTION_TOKEN);
        await redisConnection.close();
      })();

      // Create timeout promise that rejects after SHUTDOWN_TIMEOUT
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Shutdown timeout exceeded (${SHUTDOWN_TIMEOUT}ms)`));
        }, SHUTDOWN_TIMEOUT);
      });

      // Race shutdown operations against timeout
      await Promise.race([shutdownPromise, timeoutPromise]);

      // Clear timeout on success
      if (timeoutId) clearTimeout(timeoutId);

      console.log("Shutdown complete");
      process.exit(0);
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);

      console.error("Error during shutdown:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
