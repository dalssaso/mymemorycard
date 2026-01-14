import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";
import { CONFIG_TOKEN } from "@/container/tokens";

export function corsHeaders(origin?: string): Record<string, string> {
  const config = container.resolve<IConfig>(CONFIG_TOKEN);
  const allowedOrigins = config.cors.allowedOrigins;

  const requestOrigin = origin || "";
  const allowOrigin =
    allowedOrigins.length === 0
      ? "*"
      : allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": allowOrigin === "*" ? "false" : "true",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("Origin") || undefined),
    });
  }
  return null;
}
