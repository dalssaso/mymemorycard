import type { OpenAPIHono } from "@hono/zod-openapi"
import type { User } from "@/features/auth/types"

export type Variables = {
  requestId: string
  user?: User
}

export interface IAiController {
  router: OpenAPIHono<{ Variables: Variables }>
}
