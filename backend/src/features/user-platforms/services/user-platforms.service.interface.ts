import type {
  CreateUserPlatformInput,
  UpdateUserPlatformInput,
  UserPlatformResponse,
} from "../types";

/**
 * Service for user-platform business logic
 */
export interface IUserPlatformsService {
  /**
   * Get all platforms for a user
   */
  getUserPlatforms(userId: string): Promise<UserPlatformResponse[]>;

  /**
   * Add a platform to user's account
   */
  addPlatform(userId: string, data: CreateUserPlatformInput): Promise<UserPlatformResponse>;

  /**
   * Update user's platform details
   */
  updatePlatform(
    userId: string,
    id: string,
    data: UpdateUserPlatformInput
  ): Promise<UserPlatformResponse>;

  /**
   * Remove a platform from user's account
   */
  removePlatform(userId: string, id: string): Promise<void>;
}
