import "reflect-metadata";
import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "@/container";
import type { IAuthController } from "@/features/auth/controllers/auth.controller.interface";
import type { IAiController } from "@/features/ai/controllers/ai.controller.interface";
import type { User } from "@/features/auth/types";
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
  user?: User;
};

export function createHonoApp(): OpenAPIHono<{ Variables: Variables }> {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // Resolve dependencies once at app creation time (avoid repeated resolution on each request)
  const logger = container.resolve(Logger);
  const metricsService = container.resolve(MetricsService);
  const dbConnection = container.resolve(DatabaseConnection);
  const metricsMiddleware = createMetricsMiddleware(metricsService);
  const errorHandler = createErrorHandler(logger);

  // Global middleware
  app.use("*", corsMiddleware(logger));
  app.use("*", async (c, next) => {
    c.set("requestId", randomUUID());
    await next();
  });
  app.use("*", metricsMiddleware);

  // Health check (reuses resolved dbConnection instance)
  app.get("/api/health", async (c) => {
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
  const authController = container.resolve<IAuthController>("IAuthController");
  app.route("/api/auth", authController.router);

  // AI routes (DI-based)
  const aiController = container.resolve<IAiController>("IAiController");
  app.route("/api/ai", aiController.router);

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
