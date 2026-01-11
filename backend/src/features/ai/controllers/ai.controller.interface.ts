import type { OpenAPIHono } from "@hono/zod-openapi"

export interface IAiController {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: OpenAPIHono<any>
}
