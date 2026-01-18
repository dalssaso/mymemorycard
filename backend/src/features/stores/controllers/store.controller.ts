import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { inject, injectable } from "tsyringe";
import type { IStoreService } from "../services/store.service.interface";
import type { IStoreController, StoreEnv } from "./store.controller.interface";
import {
  StoreIdParamsSchema,
  StoreListResponseSchema,
  StoreResponseSchema,
} from "../dtos/store.dto";
import { Logger } from "@/infrastructure/logging/logger";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import { STORE_SERVICE_TOKEN } from "@/container/tokens";

/**
 * StoreController handles store-related routes.
 *
 * @class
 * @public
 * @implements {IStoreController}
 * @param {IStoreService} storeService - Injected store service.
 * @param {Logger} logger - Injected logger instance.
 * @property {OpenAPIHono<StoreEnv>} router - OpenAPI-enabled router.
 */
@injectable()
export class StoreController implements IStoreController {
  public router: OpenAPIHono<StoreEnv>;
  private readonly logger: Logger;

  constructor(
    @inject(STORE_SERVICE_TOKEN) private storeService: IStoreService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("StoreController");
    this.router = new OpenAPIHono<StoreEnv>();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    const listRoute = createRoute({
      method: "get",
      path: "/",
      tags: ["stores"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: { "application/json": { schema: StoreListResponseSchema } },
          description: "List stores",
        },
        401: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Unauthorized",
        },
      },
    });

    this.router.use("/", authMiddleware);
    this.router.openapi(listRoute, async (c) => {
      this.logger.debug("GET /stores");
      const result = await this.storeService.list();
      return c.json(result, 200);
    });

    const getRoute = createRoute({
      method: "get",
      path: "/{id}",
      tags: ["stores"],
      security: [{ bearerAuth: [] }],
      request: {
        params: StoreIdParamsSchema,
      },
      responses: {
        200: {
          content: { "application/json": { schema: StoreResponseSchema } },
          description: "Get store",
        },
        401: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Unauthorized",
        },
        404: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Store not found",
        },
      },
    });

    this.router.use("/:id", authMiddleware);
    this.router.openapi(getRoute, async (c) => {
      this.logger.debug("GET /stores/:id");
      const params = c.req.valid("param");
      const result = await this.storeService.getById(params.id);
      return c.json(result, 200);
    });
  }
}
