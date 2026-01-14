import "reflect-metadata";
import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "@/container";
import type { IAuthController } from "@/features/auth/controllers/auth.controller.interface";
import type { IPlatformController } from "@/features/platforms/controllers/platform.controller.interface";
import { AUTH_CONTROLLER_TOKEN, PLATFORM_CONTROLLER_TOKEN } from "@/container/tokens";
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
