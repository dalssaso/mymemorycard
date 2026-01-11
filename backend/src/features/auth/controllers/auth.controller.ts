import { injectable, inject } from "tsyringe";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { IAuthService } from "../services/auth.service.interface";
import type { IAuthController } from "./auth.controller.interface";
import {
  RegisterRequestSchema,
  LoginRequestSchema,
  AuthResponseSchema,
  ErrorResponseSchema,
} from "../dtos/auth.dto";
import { Logger } from "@/infrastructure/logging/logger";

@injectable()
export class AuthController implements IAuthController {
  public router: OpenAPIHono;

  constructor(
    @inject("IAuthService") private authService: IAuthService,
    private logger: Logger
  ) {
    this.logger = logger.child("AuthController");
    this.router = new OpenAPIHono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    const registerRoute = createRoute({
      method: "post",
      path: "/register",
      tags: ["auth"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: RegisterRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: AuthResponseSchema,
            },
          },
          description: "User registered successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        409: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "User already exists",
        },
      },
    });

    this.router.openapi(registerRoute, async (c) => {
      const body = c.req.valid("json");

      const result = await this.authService.register(body.username, body.email, body.password);

      return c.json(result, 201);
    });

    const loginRoute = createRoute({
      method: "post",
      path: "/login",
      tags: ["auth"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: LoginRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: AuthResponseSchema,
            },
          },
          description: "User logged in successfully",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Invalid credentials",
        },
      },
    });

    this.router.openapi(loginRoute, async (c) => {
      const body = c.req.valid("json");

      const result = await this.authService.login(body.username, body.password);

      return c.json(result, 200);
    });
  }
}
