import { injectable, inject } from "tsyringe";

import { USER_PLATFORMS_REPOSITORY_TOKEN } from "@/container/tokens";
import { Logger } from "@/infrastructure/logging/logger";
import { ForbiddenError, NotFoundError } from "@/shared/errors/base";
import type {
  CreateUserPlatformInput,
  UpdateUserPlatformInput,
  UserPlatform,
  UserPlatformResponse,
} from "../types";
import type { IUserPlatformsRepository } from "../repositories/user-platforms.repository.interface";

import type { IUserPlatformsService } from "./user-platforms.service.interface";

/**
 * Service layer for user-platforms business logic
 */
@injectable()
export class UserPlatformsService implements IUserPlatformsService {
  constructor(
    @inject(USER_PLATFORMS_REPOSITORY_TOKEN)
    private repository: IUserPlatformsRepository,
    @inject(Logger) private logger: Logger
  ) {
    this.logger = logger.child("UserPlatformsService");
  }

  async getUserPlatforms(userId: string): Promise<UserPlatformResponse[]> {
    this.logger.debug(`Fetching user platforms for ${userId}`);

    const platforms = await this.repository.findByUserId(userId);

    return platforms.map((p) => this.mapToResponse(p));
  }

  async addPlatform(userId: string, data: CreateUserPlatformInput): Promise<UserPlatformResponse> {
    this.logger.debug(`Adding platform ${data.platformId} for user ${userId}`);

    const platform = await this.repository.create(userId, data);

    return this.mapToResponse(platform);
  }

  async updatePlatform(
    userId: string,
    id: string,
    data: UpdateUserPlatformInput
  ): Promise<UserPlatformResponse> {
    this.logger.debug(`Updating platform ${id} for user ${userId}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("UserPlatform", id);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("Cannot update platform belonging to another user");
    }

    const updated = await this.repository.update(id, data);

    return this.mapToResponse(updated);
  }

  async removePlatform(userId: string, id: string): Promise<void> {
    this.logger.debug(`Removing platform ${id} from user ${userId}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError("UserPlatform", id);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError("Cannot remove platform belonging to another user");
    }

    await this.repository.delete(id);
  }

  /**
   * Convert internal UserPlatform type (camelCase) to API response type (snake_case)
   *
   * @param platform - Internal platform object with camelCase properties
   * @returns API response object with snake_case properties
   */
  private mapToResponse(platform: UserPlatform): UserPlatformResponse {
    return {
      id: platform.id,
      user_id: platform.userId,
      platform_id: platform.platformId,
      username: platform.username ?? undefined,
      icon_url: platform.iconUrl ?? undefined,
      profile_url: platform.profileUrl ?? undefined,
      notes: platform.notes ?? undefined,
      created_at: (platform.createdAt as Date).toISOString(),
    };
  }
}
