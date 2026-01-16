import type { PlatformListResponse, PlatformResponse } from "../dtos/platform.dto";

export interface IPlatformService {
  /**
   * Lists all platforms.
   */
  list(): Promise<PlatformListResponse>;

  /**
   * Gets a platform by ID.
   */
  getById(id: string): Promise<PlatformResponse>;

  /**
   * Gets a platform by IGDB platform ID.
   */
  getByIgdbId(igdbPlatformId: number): Promise<PlatformResponse>;
}
