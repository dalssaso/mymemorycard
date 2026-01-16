import type { Platform } from "../types";

export interface IPlatformRepository {
  /**
   * Lists all platforms ordered by name.
   */
  list(): Promise<Platform[]>;

  /**
   * Finds a platform by its internal UUID.
   */
  getById(id: string): Promise<Platform | null>;

  /**
   * Finds a platform by its IGDB platform ID.
   */
  getByIgdbId(igdbPlatformId: number): Promise<Platform | null>;

  /**
   * Finds platforms by family grouping.
   */
  getByFamily(family: string): Promise<Platform[]>;
}
