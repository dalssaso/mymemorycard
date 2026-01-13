import { registerDependencies } from "@/container";
import { createHonoApp } from "@/infrastructure/http/app";

export function buildOpenApiDocument() {
  registerDependencies();
  const app = createHonoApp();

  return app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: { title: "MyMemoryCard API", version: "v1" },
  });
}
