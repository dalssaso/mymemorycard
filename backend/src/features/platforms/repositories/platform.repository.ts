import { asc, desc, eq } from "drizzle-orm";
import { inject, injectable } from "tsyringe";
import { platforms } from "@/db/schema";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { Platform } from "@/features/platforms/types";
import type { IPlatformRepository } from "./platform.repository.interface";
import { DATABASE_TOKEN } from "@/container/tokens";

@injectable()
export class PostgresPlatformRepository implements IPlatformRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Return all platforms ordered by system flag, sort order, and display name.
   *
   * @returns Promise resolving to the ordered platforms.
   */
  async list(): Promise<Platform[]> {
    return await this.db
      .select()
      .from(platforms)
      .orderBy(desc(platforms.isSystem), asc(platforms.sortOrder), asc(platforms.displayName));
  }

  /**
   * Fetch a single platform by its id.
   *
   * @param id - Platform id.
   * @returns Promise resolving to the platform or null when not found.
   */
  async getById(id: string): Promise<Platform | null> {
    const result = await this.db.select().from(platforms).where(eq(platforms.id, id)).limit(1);
    return result[0] ?? null;
  }
}
