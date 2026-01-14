import { inject, injectable } from "tsyringe";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError } from "@/shared/errors/base";
import { PLATFORM_REPOSITORY_TOKEN } from "@/container/tokens";
import type { Platform } from "../types";
import type { IPlatformRepository } from "../repositories/platform.repository.interface";
import type { PlatformListResponse, PlatformResponse } from "../dtos/platform.dto";
import type { IPlatformService } from "./platform.service.interface";

type PlatformDto = PlatformResponse["platform"];

@injectable()
export class PlatformService implements IPlatformService {
  constructor(
    @inject(PLATFORM_REPOSITORY_TOKEN) private repo: IPlatformRepository,
    @inject(Logger) private logger: Logger
  ) {
    this.logger = logger.child("PlatformService");
  }

  /**
   * List platforms and map them to API DTOs.
   *
   * @returns Promise resolving to the platform list response.
   */
  async list(): Promise<PlatformListResponse> {
    const platforms = await this.repo.list();
    return { platforms: platforms.map((platform) => this.toDto(platform)) };
  }

  /**
   * Get a platform by id and map it to the API DTO.
   *
   * @param id - Platform id.
   * @returns Promise resolving to the platform response.
   * @throws {NotFoundError} When the platform is not found.
   */
  async getById(id: string): Promise<PlatformResponse> {
    const platform = await this.repo.getById(id);
    if (!platform) {
      throw new NotFoundError("Platform", id);
    }
    return { platform: this.toDto(platform) };
  }

  private toDto(platform: Platform): PlatformDto {
    return {
      id: platform.id,
      name: platform.name,
      display_name: platform.displayName,
      platform_type: platform.platformType,
      is_system: platform.isSystem ?? false,
      is_physical: platform.isPhysical ?? false,
      website_url: platform.websiteUrl,
      color_primary: platform.colorPrimary,
      default_icon_url: platform.defaultIconUrl,
      sort_order: platform.sortOrder ?? 0,
    };
  }
}
