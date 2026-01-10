import { injectable } from 'tsyringe'
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

@injectable()
export class MetricsService {
  public readonly registry: Registry
  public readonly httpRequestsTotal: Counter
  public readonly httpRequestDuration: Histogram
  public readonly authAttemptsTotal: Counter

  constructor() {
    this.registry = new Registry()
    collectDefaultMetrics({ register: this.registry })

    this.httpRequestsTotal = new Counter({
      name: 'mymemorycard_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    })

    this.httpRequestDuration = new Histogram({
      name: 'mymemorycard_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    })

    this.authAttemptsTotal = new Counter({
      name: 'mymemorycard_auth_attempts_total',
      help: 'Total authentication attempts',
      labelNames: ['type', 'success'],
      registers: [this.registry],
    })
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }
}
