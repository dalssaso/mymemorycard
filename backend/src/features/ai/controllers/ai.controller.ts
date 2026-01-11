import { injectable, inject } from "tsyringe"
import { OpenAPIHono, createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import type { IAiController } from "./ai.controller.interface"
import type { IEmbeddingService } from "../services/embedding.service.interface"
import type { ICuratorService } from "../services/curator.service.interface"
import type { IImageService } from "../services/image.service.interface"
import {
  GenerateEmbeddingRequestSchema,
  SuggestCollectionsRequestSchema,
  SuggestNextGameRequestSchema,
  GenerateCoverRequestSchema,
  CollectionSuggestionSchema,
  NextGameSuggestionSchema,
} from "../dtos/ai.dto"

const ErrorResponseSchema = z.object({
  error: z.string(),
})

const SuccessResponseSchema = z.object({
  success: z.boolean(),
})

const ImageResponseSchema = z.object({
  url: z.string(),
  model: z.string(),
})

@injectable()
export class AiController implements IAiController {
  public router: OpenAPIHono

  constructor(
    @inject("IEmbeddingService") private embeddingService: IEmbeddingService,
    @inject("ICuratorService") private curatorService: ICuratorService,
    @inject("IImageService") private imageService: IImageService,
  ) {
    this.router = new OpenAPIHono()
    this.registerRoutes()
  }

  private registerRoutes(): void {
    // POST /embeddings/games - Generate game embedding
    const generateGameEmbeddingRoute = createRoute({
      method: "post",
      path: "/embeddings/games",
      tags: ["ai"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GenerateEmbeddingRequestSchema,
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
      },
    })

    this.router.openapi(generateGameEmbeddingRoute, async (c) => {
      const body = c.req.valid("json")
      // TODO: Extract userId from authenticated user context
      const userId = "mock-user-id"

      await this.embeddingService.generateGameEmbedding(userId, body.gameId, body.text)

      return c.json({ success: true }, 201)
    })

    // POST /embeddings/collections - Generate collection embedding
    const generateCollectionEmbeddingRoute = createRoute({
      method: "post",
      path: "/embeddings/collections",
      tags: ["ai"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: GenerateEmbeddingRequestSchema,
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
      },
    })

    this.router.openapi(generateCollectionEmbeddingRoute, async (c) => {
      const body = c.req.valid("json")
      // TODO: Extract userId from authenticated user context
      const userId = "mock-user-id"

      await this.embeddingService.generateCollectionEmbedding(userId, body.gameId, body.text)

      return c.json({ success: true }, 201)
    })

    // POST /suggestions/collections - Suggest collections
    const suggestCollectionsRoute = createRoute({
      method: "post",
      path: "/suggestions/collections",
      tags: ["ai"],
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
      },
    })

    this.router.openapi(suggestCollectionsRoute, async (c) => {
      const body = c.req.valid("json")
      // TODO: Extract userId from authenticated user context
      const userId = "mock-user-id"

      const suggestions = await this.curatorService.suggestCollections(userId, body.gameIds)

      return c.json(suggestions, 200)
    })

    // POST /suggestions/next-game - Suggest next game
    const suggestNextGameRoute = createRoute({
      method: "post",
      path: "/suggestions/next-game",
      tags: ["ai"],
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
      },
    })

    this.router.openapi(suggestNextGameRoute, async (c) => {
      const body = c.req.valid("json")
      // TODO: Extract userId from authenticated user context
      const userId = "mock-user-id"

      const suggestions = await this.curatorService.suggestNextGame(userId, body.recentGameIds)

      return c.json(suggestions, 200)
    })

    // POST /images/collection-cover - Generate collection cover
    const generateCoverRoute = createRoute({
      method: "post",
      path: "/images/collection-cover",
      tags: ["ai"],
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
      },
    })

    this.router.openapi(generateCoverRoute, async (c) => {
      const body = c.req.valid("json")
      // TODO: Extract userId from authenticated user context
      const userId = "mock-user-id"

      const result = await this.imageService.generateCollectionCover(
        userId,
        body.collectionName,
        body.gameNames,
      )

      return c.json(result, 201)
    })
  }
}
