import type { OpenAPIHono } from "@hono/zod-openapi";
import type { User } from "@/types";

export type StoreVariables = {
  user: User;
};

export type StoreEnv = {
  Variables: StoreVariables;
};

/**
 * Interface for StoreController
 * Defines the public contract for store route management
 */
export interface IStoreController {
  /**
   * OpenAPI Hono router with registered store endpoints
   * - GET / - List stores
   * - GET /:id - Get store
   */
  router: OpenAPIHono<StoreEnv>;
}
