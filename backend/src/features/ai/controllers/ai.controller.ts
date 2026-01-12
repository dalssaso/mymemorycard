import { injectable, inject } from "tsyringe";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { Context, TypedResponse } from "hono";
import { z } from "zod";
import type { IAiController, AiControllerVariables } from "./ai.controller.interface";
import type { IEmbeddingService } from "../services/embedding.service.interface";
import type { ICuratorService } from "../services/curator.service.interface";
import type { IImageService } from "../services/image.service.interface";
import {
  GenerateGameEmbeddingRequestSchema,
  GenerateCollectionEmbeddingRequestSchema,
  SuggestCollectionsRequestSchema,
  SuggestNextGameRequestSchema,
  GenerateCoverRequestSchema,
  ErrorResponseSchema,
  SuccessResponseSchema,
  ImageResponseSchema,
  CollectionSuggestionSchema,
  NextGameSuggestionSchema,
} from "../dtos/ai.dto";
import { createAuthMiddleware } from "@/infrastructure/http/middleware/auth.middleware";
import { ConfigurationError } from "../errors/configuration.error";
import { ValidationError } from "@/shared/errors/base";
import { Logger } from "@/infrastructure/logging/logger";

@injectable()
export class AiController implements IAiController {
  public router: OpenAPIHono<{ Variables: AiControllerVariables }>;

  constructor(
    @inject("IEmbeddingService") private embeddingService: IEmbeddingService,
    @inject("ICuratorService") private curatorService: ICuratorService,
    @inject("IImageService") private imageService: IImageService,
    @inject(Logger) private logger: Logger
  ) {
    this.router = new OpenAPIHono<{ Variables: AiControllerVariables }>();
    this.registerRoutes();
  }

  private handleError(
    c: Context,
    error: unknown,
    operation: string,
    metadata: Record<string, unknown> = {}
  ): TypedResponse<{ error: string }, 400 | 500 | 503, "json"> {
    const userId = c.get("user")?.id;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMetadata = {
      userId,
      ...metadata,
      error: errorMessage,
    };

    if (error instanceof ConfigurationError) {
      this.logger.error(`AI configuration error in ${operation}`, logMetadata);
      return c.json({ error: error.message }, 503);
    }

    if (error instanceof ValidationError) {
      return c.json({ error: error.message }, 400);
    }

    this.logger.error(`Error in ${operation}`, logMetadata);
    return c.json(
      {
        error: "Internal server error",
      },
      500
    );
  }

  private registerRoutes(): void {
    const authMiddleware = createAuthMiddleware();

    // POST /embeddings/games - Generate game embedding
    const generateGameEmbeddingRoute = createRoute({
      method: "post",
      path: "/embeddings/games",
      tags: ["ai"],
      middleware: [authMiddleware],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GenerateGameEmbeddingRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: SuccessResponseSchema,
            },
          },
          description: "Game embedding generated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        500: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Internal server error",
        },
        503: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Service unavailable - AI configuration error",
        },
      },
    });

    this.router.openapi(generateGameEmbeddingRoute, async (c) => {
      let body: z.infer<typeof GenerateGameEmbeddingRequestSchema> | undefined;

      try {
        body = c.req.valid("json");
        const user = c.get("user")!;
        await this.embeddingService.generateGameEmbedding(user.id, body.gameId, body.text);

        return c.json({ success: true }, 201);
      } catch (error) {
        return this.handleError(c, error, "generateGameEmbedding", {
          gameId: body?.gameId,
        });
      }
    });

    // POST /embeddings/collections - Generate collection embedding
    const generateCollectionEmbeddingRoute = createRoute({
      method: "post",
      path: "/embeddings/collections",
      tags: ["ai"],
      middleware: [authMiddleware],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GenerateCollectionEmbeddingRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: SuccessResponseSchema,
            },
          },
          description: "Collection embedding generated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        500: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Internal server error",
        },
        503: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Service unavailable - AI configuration error",
        },
      },
    });

    this.router.openapi(generateCollectionEmbeddingRoute, async (c) => {
      let body: z.infer<typeof GenerateCollectionEmbeddingRequestSchema> | undefined;

      try {
        body = c.req.valid("json");
        const user = c.get("user")!;
        await this.embeddingService.generateCollectionEmbedding(
          user.id,
          body.collectionId,
          body.text
        );

        return c.json({ success: true }, 201);
      } catch (error) {
        return this.handleError(c, error, "generateCollectionEmbedding", {
          collectionId: body?.collectionId,
        });
      }
    });

    // POST /suggestions/collections - Suggest collections
    const suggestCollectionsRoute = createRoute({
      method: "post",
      path: "/suggestions/collections",
      tags: ["ai"],
      middleware: [authMiddleware],
      request: {
        body: {
          content: {
            "application/json": {
              schema: SuggestCollectionsRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(CollectionSuggestionSchema),
            },
          },
          description: "Collection suggestions generated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        500: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Internal server error",
        },
        503: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Service unavailable - AI configuration error",
        },
      },
    });

    this.router.openapi(suggestCollectionsRoute, async (c) => {
      let body: z.infer<typeof SuggestCollectionsRequestSchema> | undefined;

      try {
        body = c.req.valid("json");
        const user = c.get("user")!;
        const suggestions = await this.curatorService.suggestCollections(user.id, body.gameIds);

        return c.json(suggestions, 200);
      } catch (error) {
        return this.handleError(c, error, "suggestCollections", {
          gameIdsCount: body?.gameIds?.length,
        });
      }
    });

    // POST /suggestions/next-game - Suggest next game
    const suggestNextGameRoute = createRoute({
      method: "post",
      path: "/suggestions/next-game",
      tags: ["ai"],
      middleware: [authMiddleware],
      request: {
        body: {
          content: {
            "application/json": {
              schema: SuggestNextGameRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(NextGameSuggestionSchema),
            },
          },
          description: "Next game suggestions generated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        500: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Internal server error",
        },
        503: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Service unavailable - AI configuration error",
        },
      },
    });

    this.router.openapi(suggestNextGameRoute, async (c) => {
      let body: z.infer<typeof SuggestNextGameRequestSchema> | undefined;

      try {
        body = c.req.valid("json");
        const user = c.get("user")!;
        const suggestions = await this.curatorService.suggestNextGame(user.id, body.recentGameIds);

        return c.json(suggestions, 200);
      } catch (error) {
        return this.handleError(c, error, "suggestNextGame", {
          recentGameIdsCount: body?.recentGameIds?.length,
        });
      }
    });

    // POST /images/collection-cover - Generate collection cover
    const generateCoverRoute = createRoute({
      method: "post",
      path: "/images/collection-cover",
      tags: ["ai"],
      middleware: [authMiddleware],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GenerateCoverRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: ImageResponseSchema,
            },
          },
          description: "Collection cover generated successfully",
        },
        400: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Validation error",
        },
        401: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Unauthorized",
        },
        500: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Internal server error",
        },
        503: {
          content: {
            "application/json": {
              schema: ErrorResponseSchema,
            },
          },
          description: "Service unavailable - AI configuration error",
        },
      },
    });

    this.router.openapi(generateCoverRoute, async (c) => {
      let body: z.infer<typeof GenerateCoverRequestSchema> | undefined;

      try {
        body = c.req.valid("json");
        const user = c.get("user")!;
        const result = await this.imageService.generateCollectionCover(
          user.id,
          body.collectionName,
          body.gameNames
        );

        return c.json(result, 201);
      } catch (error) {
        return this.handleError(c, error, "generateCollectionCover", {
          collectionName: body?.collectionName,
          gameNamesCount: body?.gameNames?.length,
        });
      }
    });
  }
}
