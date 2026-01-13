import { writeFile } from "node:fs/promises"
import { buildOpenApiDocument } from "@/infrastructure/http/openapi"

const doc = buildOpenApiDocument()
await writeFile("openapi.json", JSON.stringify(doc, null, 2))
