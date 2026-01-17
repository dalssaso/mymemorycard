import type { Store } from "../types";

export interface IStoreRepository {
  /**
   * Find store by ID.
   * @param id - Store ID (UUID)
   * @returns Store or null if not found
   */
  findById(id: string): Promise<Store | null>;

  /**
   * Find store by slug.
   * @param slug - Store slug (e.g., "steam", "gog", "epic")
   * @returns Store or null if not found
   */
  findBySlug(slug: string): Promise<Store | null>;

  /**
   * List all stores.
   * @returns Array of all stores
   */
  list(): Promise<Store[]>;

  /**
   * List stores by platform family.
   * @param platformFamily - Platform family name
   * @returns Array of stores available for platform family
   */
  listByPlatformFamily(platformFamily: string): Promise<Store[]>;

  /**
   * List stores supporting achievements.
   * @returns Array of stores with achievement support
   */
  listWithAchievements(): Promise<Store[]>;
}
