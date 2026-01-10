import "reflect-metadata";
import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "@/container";
import type { AuthController } from "@/features/auth/controllers/auth.controller";
import { errorHandler } from "./middleware/error.middleware";
import { corsMiddleware } from "./middleware/cors.middleware";
import { metricsMiddleware } from "./middleware/metrics.middleware";
import { MetricsService } from "@/infrastructure/metrics/metrics";
import { randomUUID } from "crypto";

type Variables = {
  requestId: string;
};

export function createHonoApp(): OpenAPIHono<{ Variables: Variables }> {
  const app = new OpenAPIHono<{ Variables: Variables }>();

  // Global middleware
  app.use("*", corsMiddleware());
  app.use("*", async (c, next) => {
    c.set("requestId", randomUUID());
    await next();
  });
  app.use("*", metricsMiddleware);

  // Health check
  app.get("/api/health", (c) => c.json({ status: "ok" }));

  // Metrics endpoint
  app.get("/metrics", async (c) => {
    const metrics = container.resolve(MetricsService);
    const metricsData = await metrics.getMetrics();
    return c.text(metricsData, 200, {
      "Content-Type": metrics.registry.contentType,
    });
  });

  // Auth routes (DI-based)
  const authController = container.resolve<AuthController>("AuthController");
  app.route("/api/auth", authController.router);

  // Legacy routes proxy (for gradual migration)
  // Forward unhandled /api/* routes to the old custom router
  app.all("/api/*", async (c) => {
    const legacyRouter = await import("@/lib/router");
    const match = legacyRouter.router.match(c.req.path, c.req.method);
    if (match) {
      return match.route.handler(c.req.raw, match.params);
    }
    return c.json({ error: "Not Found" }, 404);
  });

  // Error handler
  app.onError(errorHandler);

  return app;
}
