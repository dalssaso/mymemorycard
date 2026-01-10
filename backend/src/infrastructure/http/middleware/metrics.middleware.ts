import type { Context, Next } from 'hono'
import { container } from 'tsyringe'
import { MetricsService } from '@/infrastructure/metrics/metrics'

export async function metricsMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now()
  const metrics = container.resolve(MetricsService)

  await next()

  const duration = (Date.now() - start) / 1000
  const status = c.res.status.toString()
  const method = c.req.method
  const route = c.req.routePath || c.req.path

  metrics.httpRequestsTotal.inc({ method, route, status })
  metrics.httpRequestDuration.observe({ method, route, status }, duration)
}
