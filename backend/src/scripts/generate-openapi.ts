import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildOpenApiDocument } from "@/infrastructure/http/openapi";

const outputPath = path.resolve(process.cwd(), "openapi.json");

try {
  const doc = buildOpenApiDocument();
  await writeFile(outputPath, JSON.stringify(doc, null, 2));
  process.exit(0);
} catch (error) {
  console.error("Failed to generate OpenAPI document", error);
  process.exit(1);
}
