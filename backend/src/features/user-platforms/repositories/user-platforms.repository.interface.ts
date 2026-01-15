import type { CreateUserPlatformInput, UpdateUserPlatformInput, UserPlatform } from "../types";

/**
 * Repository for managing user-platform associations
 */
export interface IUserPlatformsRepository {
  /**
   * Find a user-platform by ID
   */
  findById(id: string): Promise<UserPlatform | null>;

  /**
   * Find all platforms for a user
   */
  findByUserId(userId: string): Promise<UserPlatform[]>;

  /**
   * Find specific user-platform association
   */
  findByUserAndPlatform(userId: string, platformId: string): Promise<UserPlatform | null>;

  /**
   * Create a new user-platform association
   */
  create(userId: string, data: CreateUserPlatformInput): Promise<UserPlatform>;

  /**
   * Update a user-platform association
   */
  update(id: string, data: UpdateUserPlatformInput): Promise<UserPlatform>;

  /**
   * Delete a user-platform association
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all platforms for a user (used in cleanup)
   */
  deleteByUserId(userId: string): Promise<void>;
}
