import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { inject, injectable } from "tsyringe";
import type { IPlatformService } from "../services/platform.service.interface";
import type { IPlatformController, PlatformEnv } from "./platform.controller.interface";
import {
  PlatformIdParamsSchema,
  PlatformListResponseSchema,
  PlatformResponseSchema,
} from "../dtos/platform.dto";
import { Logger } from "@/infrastructure/logging/logger";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import { PLATFORM_SERVICE_TOKEN } from "@/container/tokens";

/**
 * PlatformController handles platform-related routes.
 *
 * @class
 * @public
 * @implements {IPlatformController}
 * @param {IPlatformService} platformService - Injected platform service.
 * @param {Logger} logger - Injected logger instance.
 * @property {OpenAPIHono<PlatformEnv>} router - OpenAPI-enabled router.
 */
@injectable()
export class PlatformController implements IPlatformController {
  public router: OpenAPIHono<PlatformEnv>;
  private logger: Logger;

  constructor(
    @inject(PLATFORM_SERVICE_TOKEN) private platformService: IPlatformService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("PlatformController");
    this.router = new OpenAPIHono<PlatformEnv>();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    const listRoute = createRoute({
      method: "get",
      path: "/",
      tags: ["platforms"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: { "application/json": { schema: PlatformListResponseSchema } },
          description: "List platforms",
        },
        401: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Unauthorized",
        },
      },
    });

    this.router.use("/", authMiddleware);
    this.router.openapi(listRoute, async (c) => {
      const result = await this.platformService.list();
      return c.json(result, 200);
    });

    const getRoute = createRoute({
      method: "get",
      path: "/{id}",
      tags: ["platforms"],
      security: [{ bearerAuth: [] }],
      request: {
        params: PlatformIdParamsSchema,
      },
      responses: {
        200: {
          content: { "application/json": { schema: PlatformResponseSchema } },
          description: "Get platform",
        },
        401: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Unauthorized",
        },
        404: {
          content: { "application/json": { schema: ErrorResponseSchema } },
          description: "Platform not found",
        },
      },
    });

    this.router.use("/:id", authMiddleware);
    this.router.openapi(getRoute, async (c) => {
      const params = c.req.valid("param");
      const result = await this.platformService.getById(params.id);
      return c.json(result, 200);
    });
  }
}
