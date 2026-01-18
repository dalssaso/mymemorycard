import "reflect-metadata";
import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "@/container";
import type { IAdminController } from "@/features/admin/controllers/admin.controller.interface";
import type { IAuthController } from "@/features/auth/controllers/auth.controller.interface";
import type { ICredentialController } from "@/features/credentials/controllers/credential.controller.interface";
import type { IGamesController } from "@/features/games/controllers/games.controller.interface";
import type { IPlatformController } from "@/features/platforms/controllers/platform.controller.interface";
import type { IPreferencesController } from "@/features/preferences/controllers/preferences.controller.interface";
import type { IStoreController } from "@/features/stores/controllers/store.controller.interface";
import type { IUserPlatformsController } from "@/features/user-platforms/controllers/user-platforms.controller.interface";
import type { ISteamController } from "@/integrations/steam/steam.controller.interface";
import type { IRetroAchievementsController } from "@/integrations/retroachievements/retroachievements.controller.interface";
import {
  ADMIN_CONTROLLER_TOKEN,
  AUTH_CONTROLLER_TOKEN,
  CREDENTIAL_CONTROLLER_TOKEN,
  GAMES_CONTROLLER_TOKEN,
  PLATFORM_CONTROLLER_TOKEN,
  PREFERENCES_CONTROLLER_TOKEN,
  RETROACHIEVEMENTS_CONTROLLER_TOKEN,
  STEAM_CONTROLLER_TOKEN,
  STORE_CONTROLLER_TOKEN,
  USER_PLATFORMS_CONTROLLER_TOKEN,
} from "@/container/tokens";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import { createErrorHandler } from "./middleware/error.middleware";
import { corsMiddleware } from "./middleware/cors.middleware";
import { createMetricsMiddleware } from "./middleware/metrics.middleware";
import { MetricsService } from "@/infrastructure/metrics/metrics";
import { Logger } from "@/infrastructure/logging/logger";
import { router as legacyRouter } from "@/lib/router";
import { randomUUID } from "crypto";

type Variables = {
  requestId: string;
};

/**
 * Create and configure the OpenAPIHono application with middleware, health and metrics endpoints, DI-mounted feature routers, a legacy /api/* proxy, and global error handling.
 *
 * @returns An OpenAPIHono application instance configured with:
 * - global middleware: CORS, per-request `requestId`, and metrics collection
 * - GET /api/health health check endpoint
 * - GET /metrics metrics endpoint with the registry Content-Type
 * - DI-mounted routers for auth, platforms, user-platforms, preferences, admin, credentials, games, and user-games
 * - a catch-all /api/* handler that proxies to the legacy router or returns 404
 * - a registered global error handler
 */
export function createHonoApp(): OpenAPIHono<{ Variables: Variables }> {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // Resolve dependencies once at app creation time (avoid repeated resolution on each request)
  const logger = container.resolve(Logger);
  const metricsService = container.resolve(MetricsService);
  const metricsMiddleware = createMetricsMiddleware(metricsService);
  const errorHandler = createErrorHandler(logger);

  // Global middleware
  app.use("*", corsMiddleware(logger));
  app.use("*", async (c, next) => {
    c.set("requestId", randomUUID());
    await next();
  });
  app.use("*", metricsMiddleware);

  // Health check (resolves db connection only when requested)
  app.get("/api/health", async (c) => {
    const dbConnection = container.resolve(DatabaseConnection);
    const dbHealthy = await dbConnection.healthCheck();

    return c.json(
      {
        status: dbHealthy ? "ok" : "degraded",
        db: { healthy: dbHealthy },
      },
      dbHealthy ? 200 : 503
    );
  });

  // Metrics endpoint
  app.get("/metrics", async (c) => {
    const metricsData = await metricsService.getMetrics();
    return c.text(metricsData, 200, {
      "Content-Type": metricsService.registry.contentType,
    });
  });

  // Auth routes (DI-based)
  const authController = container.resolve<IAuthController>(AUTH_CONTROLLER_TOKEN);
  app.route("/api/v1/auth", authController.router);

  // Platforms routes (DI-based)
  const platformController = container.resolve<IPlatformController>(PLATFORM_CONTROLLER_TOKEN);
  app.route("/api/v1/platforms", platformController.router);

  // User-Platforms routes (DI-based)
  const userPlatformsController = container.resolve<IUserPlatformsController>(
    USER_PLATFORMS_CONTROLLER_TOKEN
  );
  app.route("/api/v1/user-platforms", userPlatformsController.router);

  // Preferences routes (DI-based)
  const preferencesController = container.resolve<IPreferencesController>(
    PREFERENCES_CONTROLLER_TOKEN
  );
  app.route("/api/v1/preferences", preferencesController.router);

  // Admin routes (DI-based)
  const adminController = container.resolve<IAdminController>(ADMIN_CONTROLLER_TOKEN);
  app.route("/api/v1/admin", adminController.router);

  // Credentials routes (DI-based)
  const credentialController = container.resolve<ICredentialController>(
    CREDENTIAL_CONTROLLER_TOKEN
  );
  app.route("/api/v1/credentials", credentialController.router);

  // Games routes (DI-based)
  const gamesController = container.resolve<IGamesController>(GAMES_CONTROLLER_TOKEN);
  app.route("/api/v1/games", gamesController.router);

  // User-Games routes (separate router mounted at /user-games)
  app.route("/api/v1/user-games", gamesController.userGamesRouter);

  // Stores routes (DI-based)
  const storeController = container.resolve<IStoreController>(STORE_CONTROLLER_TOKEN);
  app.route("/api/v1/stores", storeController.router);

  // Steam integration routes (DI-based)
  const steamController = container.resolve<ISteamController>(STEAM_CONTROLLER_TOKEN);
  app.route("/api/v1/steam", steamController.router);

  // RetroAchievements integration routes (DI-based)
  const raController = container.resolve<IRetroAchievementsController>(
    RETROACHIEVEMENTS_CONTROLLER_TOKEN
  );
  app.route("/api/v1/retroachievements", raController.router);

  // Legacy routes proxy (for gradual migration)
  // Forward unhandled /api/* routes to the old custom router (cached at module load)
  app.all("/api/*", (c) => {
    const match = legacyRouter.match(c.req.path, c.req.method);
    if (match) {
      return match.route.handler(c.req.raw, match.params);
    }
    return c.json({ error: "Not Found" }, 404);
  });

  // Error handler
  app.onError(errorHandler);

  return app;
}
