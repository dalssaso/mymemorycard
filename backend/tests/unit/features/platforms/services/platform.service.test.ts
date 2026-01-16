import "reflect-metadata";
import { beforeEach, describe, expect, it } from "bun:test";
import { PlatformService } from "@/features/platforms/services/platform.service";
import type { IPlatformRepository } from "@/features/platforms/repositories/platform.repository.interface";
import { NotFoundError } from "@/shared/errors/base";
import { createMockLogger } from "@/tests/helpers/repository.mocks";

describe("PlatformService", () => {
  let service: PlatformService;
  let repo: IPlatformRepository;

  beforeEach(() => {
    repo = {
      list: async () => [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          igdbPlatformId: 6,
          name: "PC (Windows)",
          abbreviation: "PC",
          slug: "win",
          platformFamily: "PC",
          colorPrimary: "#6B7280",
          createdAt: new Date(),
        },
      ],
      getById: async () => ({
        id: "550e8400-e29b-41d4-a716-446655440000",
        igdbPlatformId: 6,
        name: "PC (Windows)",
        abbreviation: "PC",
        slug: "win",
        platformFamily: "PC",
        colorPrimary: "#6B7280",
        createdAt: new Date(),
      }),
      getByIgdbId: async () => ({
        id: "550e8400-e29b-41d4-a716-446655440000",
        igdbPlatformId: 6,
        name: "PC (Windows)",
        abbreviation: "PC",
        slug: "win",
        platformFamily: "PC",
        colorPrimary: "#6B7280",
        createdAt: new Date(),
      }),
      getByFamily: async () => [],
    };

    service = new PlatformService(repo, createMockLogger());
  });

  it("maps list results to snake_case DTOs", async () => {
    const result = await service.list();

    expect(result.platforms[0]).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      igdb_platform_id: 6,
      name: "PC (Windows)",
      abbreviation: "PC",
      slug: "win",
      platform_family: "PC",
      color_primary: "#6B7280",
      created_at: expect.any(String),
    });
  });

  it("maps getById result to snake_case DTO", async () => {
    const result = await service.getById("550e8400-e29b-41d4-a716-446655440000");

    expect(result.platform).toMatchObject({
      id: "550e8400-e29b-41d4-a716-446655440000",
      igdb_platform_id: 6,
      name: "PC (Windows)",
      abbreviation: "PC",
      slug: "win",
      platform_family: "PC",
      color_primary: "#6B7280",
      created_at: expect.any(String),
    });
  });

  it("throws NotFoundError when platform is missing", async () => {
    repo.getById = async () => null;

    await expect(service.getById("missing")).rejects.toThrow(NotFoundError);
  });
});
