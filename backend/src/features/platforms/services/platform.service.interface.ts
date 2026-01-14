import type { PlatformListResponse, PlatformResponse } from "../dtos/platform.dto";

export interface IPlatformService {
  /**
   * List all platforms for API consumers.
   *
   * @returns Promise resolving to a list response of platforms.
   */
  list(): Promise<PlatformListResponse>;

  /**
   * Get a platform by id.
   *
   * @param id - Platform id.
   * @returns Promise resolving to a platform response.
   * @throws {NotFoundError} When the platform is not found.
   */
  getById(id: string): Promise<PlatformResponse>;
}
