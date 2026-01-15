import { injectable, inject } from "tsyringe";
import type { Logger } from "pino";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";

import { USER_PLATFORMS_SERVICE_TOKEN } from "@/container/tokens";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto";
import type { IUserPlatformsService } from "../services/user-platforms.service.interface";
import type { IUserPlatformsController } from "./user-platforms.controller.interface";
import {
  AddUserPlatformRequestSchema,
  UpdateUserPlatformRequestSchema,
  UserPlatformResponseSchema,
  UserPlatformsListResponseSchema,
  UserPlatformIdParamsSchema,
} from "../dtos/user-platforms.dto";

/**
 * Controller for user-platforms routes
 */
@injectable()
export class UserPlatformsController implements IUserPlatformsController {
  readonly router: OpenAPIHono<any>;
  private logger: Logger;

  constructor(
    @inject(USER_PLATFORMS_SERVICE_TOKEN)
    private service: IUserPlatformsService,
    @inject("Logger") logger: Logger
  ) {
    this.logger = logger.child({ controller: "UserPlatformsController" });
    this.router = new OpenAPIHono<any>();

    this.registerRoutes();
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    // GET /user-platforms - Get all user platforms
    const getRoute = createRoute({
      method: "get",
      path: "/",
      tags: ["user-platforms"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: UserPlatformsListResponseSchema,
            },
          },
          description: "List of user platforms",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
      },
    });

    this.router.use("/", authMiddleware);
    this.router.openapi(getRoute, async (c) => {
      this.logger.debug("GET /user-platforms");
      const user = c.get("user");
      const userId = user.id;

      const platforms = await this.service.getUserPlatforms(userId);

      return c.json({ user_platforms: platforms }, 200);
    });

    // POST /user-platforms - Add platform to user
    const postRoute = createRoute({
      method: "post",
      path: "/",
      tags: ["user-platforms"],
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: AddUserPlatformRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: UserPlatformResponseSchema,
            },
          },
          description: "Platform added successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
      },
    });

    this.router.openapi(postRoute, async (c) => {
      this.logger.debug("POST /user-platforms");
      const user = c.get("user");
      const userId = user.id;
      const body = c.req.valid("json");

      const platform = await this.service.addPlatform(userId, {
        platformId: body.platform_id,
        username: body.username,
        iconUrl: body.icon_url,
        profileUrl: body.profile_url,
        notes: body.notes,
      });

      return c.json(platform, 201);
    });

    // PATCH /user-platforms/:id - Update platform
    const patchRoute = createRoute({
      method: "patch",
      path: "/{id}",
      tags: ["user-platforms"],
      security: [{ bearerAuth: [] }],
      request: {
        params: UserPlatformIdParamsSchema,
        body: {
          content: {
            "application/json": {
              schema: UpdateUserPlatformRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: UserPlatformResponseSchema,
            },
          },
          description: "Platform updated successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Platform not found",
        },
      },
    });

    this.router.use("/:id", authMiddleware);
    this.router.openapi(patchRoute, async (c) => {
      this.logger.debug("PATCH /user-platforms/:id");
      const user = c.get("user");
      const userId = user.id;
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");

      const platform = await this.service.updatePlatform(userId, id, {
        username: body.username,
        iconUrl: body.icon_url,
        profileUrl: body.profile_url,
        notes: body.notes,
      });

      return c.json(platform, 200);
    });

    // DELETE /user-platforms/:id - Remove platform
    const deleteRoute = createRoute({
      method: "delete",
      path: "/{id}",
      tags: ["user-platforms"],
      security: [{ bearerAuth: [] }],
      request: {
        params: UserPlatformIdParamsSchema,
      },
      responses: {
        204: {
          description: "Platform removed successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        404: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Platform not found",
        },
      },
    });

    this.router.openapi(deleteRoute, async (c) => {
      this.logger.debug("DELETE /user-platforms/:id");
      const user = c.get("user");
      const userId = user.id;
      const { id } = c.req.valid("param");

      await this.service.removePlatform(userId, id);

      return c.body(null, 204);
    });
  }
}
