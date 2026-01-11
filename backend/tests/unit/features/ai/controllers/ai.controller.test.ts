import "reflect-metadata"
import { describe, it, expect } from "bun:test"
import { AiController } from "@/features/ai/controllers/ai.controller"
import {
  createMockEmbeddingService,
  createMockCuratorService,
  createMockImageService,
} from "@/tests/helpers/repository.mocks"

describe("AiController", () => {
  it("should instantiate controller with dependencies", () => {
    const mockEmbeddingService = createMockEmbeddingService()
    const mockCuratorService = createMockCuratorService()
    const mockImageService = createMockImageService()

    const controller = new AiController(
      mockEmbeddingService,
      mockCuratorService,
      mockImageService,
    )

    expect(controller).toBeDefined()
    expect(controller.router).toBeDefined()
  })
})
