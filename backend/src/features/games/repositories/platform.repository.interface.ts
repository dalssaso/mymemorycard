import type { Platform } from "../types";

export interface IPlatformRepository {
  /**
   * Find platform by ID.
   * @param id - Platform ID (UUID)
   * @returns Platform or null if not found
   */
  findById(id: string): Promise<Platform | null>;

  /**
   * Find platform by IGDB ID.
   * @param igdbPlatformId - IGDB platform ID
   * @returns Platform or null if not found
   */
  findByIgdbId(igdbPlatformId: number): Promise<Platform | null>;

  /**
   * Get or create platform from IGDB data.
   * @param igdbPlatformId - IGDB platform ID
   * @param name - Platform name
   * @param data - Additional platform data (abbreviation, slug, platform_family, color_primary)
   * @returns Platform (created or existing)
   */
  getOrCreate(
    igdbPlatformId: number,
    name: string,
    data?: Partial<Omit<Platform, "id" | "created_at">>
  ): Promise<Platform>;

  /**
   * List all platforms.
   * @returns Array of all platforms
   */
  list(): Promise<Platform[]>;

  /**
   * Find platforms by family.
   * @param platformFamily - Platform family name (e.g., "PS", "Xbox", "Nintendo")
   * @returns Array of platforms in family
   */
  findByFamily(platformFamily: string): Promise<Platform[]>;
}
