import type { Platform } from "@/features/platforms/types";

export interface IPlatformRepository {
  /**
   * List all platforms from storage.
   *
   * @returns Promise resolving to the platform list.
   */
  list(): Promise<Platform[]>;

  /**
   * Fetch a single platform by its id.
   *
   * @param id - Platform id.
   * @returns Promise resolving to the platform or null when not found.
   */
  getById(id: string): Promise<Platform | null>;
}
