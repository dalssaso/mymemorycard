import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";
import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { platforms } from "@/db/schema";
import type { IPlatformRepository } from "./platform.repository.interface";
import type { Platform } from "../types";

@injectable()
export class PlatformRepository implements IPlatformRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find platform by ID.
   * @param id - Platform ID (UUID)
   * @returns Platform or null if not found
   */
  async findById(id: string): Promise<Platform | null> {
    const result = await this.db.query.platforms.findFirst({
      where: eq(platforms.id, id),
    });
    return result ? this.mapToPlatform(result) : null;
  }

  /**
   * Find platform by IGDB ID.
   * @param igdbPlatformId - IGDB platform ID
   * @returns Platform or null if not found
   */
  async findByIgdbId(igdbPlatformId: number): Promise<Platform | null> {
    const result = await this.db.query.platforms.findFirst({
      where: eq(platforms.igdbPlatformId, igdbPlatformId),
    });
    return result ? this.mapToPlatform(result) : null;
  }

  /**
   * Get or create platform from IGDB data.
   * @param igdbPlatformId - IGDB platform ID
   * @param name - Platform name
   * @param data - Additional platform data (abbreviation, slug, platform_family, color_primary)
   * @returns Platform (created or existing)
   */
  async getOrCreate(
    igdbPlatformId: number,
    name: string,
    data?: Partial<Omit<Platform, "id" | "created_at">>
  ): Promise<Platform> {
    // Try to find existing platform by IGDB ID
    const existing = await this.findByIgdbId(igdbPlatformId);
    if (existing) {
      return existing;
    }

    // Create new platform
    const result = await this.db
      .insert(platforms)
      .values({
        igdbPlatformId,
        name,
        abbreviation: data?.abbreviation,
        slug: data?.slug,
        platformFamily: data?.platform_family,
        colorPrimary: data?.color_primary || "#6B7280",
      })
      .returning();

    return this.mapToPlatform(result[0]);
  }

  /**
   * List all platforms.
   * @returns Array of all platforms
   */
  async list(): Promise<Platform[]> {
    const results = await this.db.query.platforms.findMany();
    return results.map((row) => this.mapToPlatform(row));
  }

  /**
   * Find platforms by family.
   * @param platformFamily - Platform family name (e.g., "PS", "Xbox", "Nintendo")
   * @returns Array of platforms in family
   */
  async findByFamily(platformFamily: string): Promise<Platform[]> {
    const results = await this.db.query.platforms.findMany({
      where: eq(platforms.platformFamily, platformFamily),
    });
    return results.map((row) => this.mapToPlatform(row));
  }

  private mapToPlatform(row: Record<string, unknown>): Platform {
    return {
      id: row.id as string,
      igdb_platform_id: (row.igdbPlatformId as number) || null,
      name: row.name as string,
      abbreviation: (row.abbreviation as string) || null,
      slug: (row.slug as string) || null,
      platform_family: (row.platformFamily as string) || null,
      color_primary: (row.colorPrimary as string) || "#6B7280",
      created_at: this.ensureDate(row.createdAt),
    };
  }

  private ensureDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return null;
  }
}
