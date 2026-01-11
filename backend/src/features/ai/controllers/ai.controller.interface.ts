import type { OpenAPIHono } from "@hono/zod-openapi"

export interface IAiController {
  router: OpenAPIHono
}
