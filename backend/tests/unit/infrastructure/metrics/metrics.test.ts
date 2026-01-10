import "reflect-metadata";
import { describe, it, expect } from "bun:test";
import { MetricsService } from "@/infrastructure/metrics/metrics";

describe("MetricsService", () => {
  it("should create metrics service with registry", () => {
    const metrics = new MetricsService();

    expect(metrics.registry).toBeDefined();
    expect(metrics.httpRequestsTotal).toBeDefined();
    expect(metrics.httpRequestDuration).toBeDefined();
    expect(metrics.authAttemptsTotal).toBeDefined();
  });

  it("should get metrics as string", async () => {
    const metrics = new MetricsService();

    const metricsString = await metrics.getMetrics();

    expect(typeof metricsString).toBe("string");
    expect(metricsString).toContain("mymemorycard_http_requests_total");
  });
});
