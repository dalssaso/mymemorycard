import { injectable, inject } from "tsyringe";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError } from "@/shared/errors/base";
import { PLATFORM_REPOSITORY_TOKEN } from "@/container/tokens";
import type { IPlatformRepository } from "../repositories/platform.repository.interface";
import type { IPlatformService } from "./platform.service.interface";
import type { Platform } from "../types";
import type { PlatformDto, PlatformListResponse, PlatformResponse } from "../dtos/platform.dto";

@injectable()
export class PlatformService implements IPlatformService {
  private logger: Logger;

  constructor(
    @inject(PLATFORM_REPOSITORY_TOKEN) private repo: IPlatformRepository,
    @inject(Logger) logger: Logger
  ) {
    this.logger = logger.child("PlatformService");
  }

  /**
   * Lists all platforms.
   */
  async list(): Promise<PlatformListResponse> {
    this.logger.debug("Listing all platforms");
    const platforms = await this.repo.list();
    return { platforms: platforms.map((p) => this.toDto(p)) };
  }

  /**
   * Gets a platform by ID.
   */
  async getById(id: string): Promise<PlatformResponse> {
    this.logger.debug("Getting platform by ID", { id });
    const platform = await this.repo.getById(id);

    if (!platform) {
      throw new NotFoundError("Platform", id);
    }

    return { platform: this.toDto(platform) };
  }

  /**
   * Gets a platform by IGDB platform ID.
   */
  async getByIgdbId(igdbPlatformId: number): Promise<PlatformResponse> {
    this.logger.debug("Getting platform by IGDB ID", { igdbPlatformId });
    const platform = await this.repo.getByIgdbId(igdbPlatformId);

    if (!platform) {
      throw new NotFoundError("Platform", igdbPlatformId.toString());
    }

    return { platform: this.toDto(platform) };
  }

  private toDto(platform: Platform): PlatformDto {
    return {
      id: platform.id,
      igdb_platform_id: platform.igdbPlatformId,
      name: platform.name,
      abbreviation: platform.abbreviation,
      slug: platform.slug,
      platform_family: platform.platformFamily,
      color_primary: platform.colorPrimary,
      created_at: platform.createdAt?.toISOString() ?? null,
    };
  }
}
