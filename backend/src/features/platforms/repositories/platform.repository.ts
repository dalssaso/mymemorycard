import { injectable, inject } from "tsyringe";
import { eq, asc } from "drizzle-orm";
import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { platforms } from "@/db/schema";
import type { Platform } from "../types";
import type { IPlatformRepository } from "./platform.repository.interface";

@injectable()
export class PostgresPlatformRepository implements IPlatformRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Lists all platforms ordered by name.
   */
  async list(): Promise<Platform[]> {
    const results = await this.db.select().from(platforms).orderBy(asc(platforms.name));

    return results.map((row) => this.toDomain(row));
  }

  /**
   * Finds a platform by its internal UUID.
   */
  async getById(id: string): Promise<Platform | null> {
    const results = await this.db.select().from(platforms).where(eq(platforms.id, id)).limit(1);

    return results[0] ? this.toDomain(results[0]) : null;
  }

  /**
   * Finds a platform by its IGDB platform ID.
   */
  async getByIgdbId(igdbPlatformId: number): Promise<Platform | null> {
    const results = await this.db
      .select()
      .from(platforms)
      .where(eq(platforms.igdbPlatformId, igdbPlatformId))
      .limit(1);

    return results[0] ? this.toDomain(results[0]) : null;
  }

  /**
   * Finds platforms by family grouping.
   */
  async getByFamily(family: string): Promise<Platform[]> {
    const results = await this.db
      .select()
      .from(platforms)
      .where(eq(platforms.platformFamily, family))
      .orderBy(asc(platforms.name));

    return results.map((row) => this.toDomain(row));
  }

  private toDomain(row: typeof platforms.$inferSelect): Platform {
    return {
      id: row.id,
      igdbPlatformId: row.igdbPlatformId,
      name: row.name,
      abbreviation: row.abbreviation,
      slug: row.slug,
      platformFamily: row.platformFamily,
      colorPrimary: row.colorPrimary,
      createdAt: row.createdAt,
    };
  }
}
