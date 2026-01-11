import type { Context, Next } from "hono";
import type { MetricsService } from "@/infrastructure/metrics/metrics";

/**
 * Creates metrics middleware with the provided MetricsService instance.
 * This factory pattern avoids resolving from the container at module load time.
 */
export function createMetricsMiddleware(
  metrics: MetricsService
): (c: Context, next: Next) => Promise<void> {
  return async (c: Context, next: Next): Promise<void> => {
    const start = Date.now();

    try {
      await next();
    } finally {
      // Record metrics in finally block to ensure they're recorded even if next() throws
      const duration = (Date.now() - start) / 1000;
      const status = c.res.status.toString();
      const method = c.req.method;
      // Use only parameterized route pattern, never fall back to concrete path to avoid high cardinality
      const route = c.req.routePath ?? "unknown_route";

      metrics.httpRequestsTotal.inc({ method, route, status });
      metrics.httpRequestDuration.observe({ method, route, status }, duration);
    }
  };
}
