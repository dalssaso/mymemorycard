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
          id: "plat-1",
          name: "pc",
          displayName: "PC",
          platformType: "pc",
          isSystem: true,
          isPhysical: false,
          websiteUrl: null,
          colorPrimary: "#6B7280",
          defaultIconUrl: null,
          sortOrder: 0,
        },
      ],
      getById: async () => ({
        id: "plat-1",
        name: "pc",
        displayName: "PC",
        platformType: "pc",
        isSystem: true,
        isPhysical: false,
        websiteUrl: null,
        colorPrimary: "#6B7280",
        defaultIconUrl: null,
        sortOrder: 0,
      }),
    };

    service = new PlatformService(repo, createMockLogger());
  });

  it("maps list results to snake_case DTOs", async () => {
    const result = await service.list();

    expect(result.platforms[0]).toMatchObject({
      id: "plat-1",
      name: "pc",
      display_name: "PC",
      platform_type: "pc",
      is_system: true,
      is_physical: false,
      website_url: null,
      color_primary: "#6B7280",
      default_icon_url: null,
      sort_order: 0,
    });
  });

  it("maps getById result to snake_case DTO", async () => {
    const result = await service.getById("plat-1");

    expect(result.platform).toMatchObject({
      id: "plat-1",
      name: "pc",
      display_name: "PC",
      platform_type: "pc",
      is_system: true,
      is_physical: false,
      website_url: null,
      color_primary: "#6B7280",
      default_icon_url: null,
      sort_order: 0,
    });
  });

  it("throws NotFoundError when platform is missing", async () => {
    repo.getById = async () => null;

    await expect(service.getById("missing")).rejects.toThrow(NotFoundError);
  });
});
