import { cors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

export function corsMiddleware(): MiddlewareHandler {
  return cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
    credentials: true,
  });
}
