import { injectable, inject } from "tsyringe"
import { OpenAPIHono, createRoute } from "@hono/zod-openapi"

import { CREDENTIAL_SERVICE_TOKEN } from "@/container/tokens"
import { Logger } from "@/infrastructure/logging/logger"
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware"
import { ErrorResponseSchema } from "@/features/auth/dtos/auth.dto"
import type { ICredentialService } from "../services/credential.service.interface"
import type { ICredentialController, CredentialEnv } from "./credential.controller.interface"
import {
  SaveCredentialRequestSchema,
  ValidateCredentialRequestSchema,
  ServiceParamSchema,
  CredentialListResponseSchema,
  CredentialSaveResponseSchema,
  CredentialValidateResponseSchema,
} from "../dtos/credentials.dto"

/**
 * Controller for credential management routes.
 */
@injectable()
export class CredentialController implements ICredentialController {
  readonly router: OpenAPIHono<CredentialEnv>

  private logger: Logger

  constructor(
    @inject(CREDENTIAL_SERVICE_TOKEN)
    private service: ICredentialService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("CredentialController")
    this.router = new OpenAPIHono<CredentialEnv>()

    this.registerRoutes()
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware()

    // GET /credentials - List all credentials status
    const listRoute = createRoute({
      method: "get",
      path: "/",
      tags: ["credentials"],
      summary: "List credential statuses",
      description: "Get the status of all stored API credentials for the authenticated user.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: CredentialListResponseSchema,
            },
          },
          description: "List of credential statuses",
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
    })

    this.router.use("/", authMiddleware)
    this.router.openapi(listRoute, async (c) => {
      this.logger.debug("GET /credentials")
      const user = c.get("user")

      const result = await this.service.listCredentials(user.id)

      return c.json(result, 200)
    })

    // POST /credentials - Save credentials
    const saveRoute = createRoute({
      method: "post",
      path: "/",
      tags: ["credentials"],
      summary: "Save API credentials",
      description:
        "Save or update API credentials for a service. Credentials are encrypted before storage.",
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: SaveCredentialRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: CredentialSaveResponseSchema,
            },
          },
          description: "Credentials saved successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Bad Request - validation error",
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
    })

    this.router.openapi(saveRoute, async (c) => {
      this.logger.debug("POST /credentials")
      const user = c.get("user")
      const body = c.req.valid("json")

      const result = await this.service.saveCredentials(user.id, {
        service: body.service,
        credential_type: body.credential_type,
        credentials: body.credentials,
      })

      return c.json(result, 201)
    })

    // POST /credentials/validate - Validate credentials
    const validateRoute = createRoute({
      method: "post",
      path: "/validate",
      tags: ["credentials"],
      summary: "Validate stored credentials",
      description:
        "Validate stored credentials by attempting authentication with the external service.",
      security: [{ bearerAuth: [] }],
      request: {
        body: {
          content: {
            "application/json": {
              schema: ValidateCredentialRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: CredentialValidateResponseSchema,
            },
          },
          description: "Validation result",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Bad Request - validation error",
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
          description: "Credentials not found",
        },
      },
    })

    this.router.use("/validate", authMiddleware)
    this.router.openapi(validateRoute, async (c) => {
      this.logger.debug("POST /credentials/validate")
      const user = c.get("user")
      const body = c.req.valid("json")

      const result = await this.service.validateCredentials(user.id, body.service)

      return c.json(result, 200)
    })

    // DELETE /credentials/:service - Delete credentials
    const deleteRoute = createRoute({
      method: "delete",
      path: "/{service}",
      tags: ["credentials"],
      summary: "Delete credentials",
      description: "Delete stored credentials for a specific service.",
      security: [{ bearerAuth: [] }],
      request: {
        params: ServiceParamSchema,
      },
      responses: {
        204: {
          description: "Credentials deleted successfully",
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
          description: "Credentials not found",
        },
      },
    })

    this.router.use("/:service", authMiddleware)
    this.router.openapi(deleteRoute, async (c) => {
      this.logger.debug("DELETE /credentials/:service")
      const user = c.get("user")
      const { service } = c.req.valid("param")

      await this.service.deleteCredentials(user.id, service)

      return c.body(null, 204)
    })
  }
}
