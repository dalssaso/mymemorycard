import type { Context, Next } from "hono";
import { container } from "tsyringe";
import { MetricsService } from "@/infrastructure/metrics/metrics";

// Cache metrics service at module load to avoid resolving on every request
const metrics = container.resolve(MetricsService);

export async function metricsMiddleware(c: Context, next: Next): Promise<void> {
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
}
