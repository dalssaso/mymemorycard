import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";
import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { stores } from "@/db/schema";
import type { IStoreRepository } from "./store.repository.interface";
import type { Store } from "../types";

@injectable()
export class StoreRepository implements IStoreRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find store by ID.
   * @param id - Store ID (UUID)
   * @returns Store or null if not found
   */
  async findById(id: string): Promise<Store | null> {
    const result = await this.db.query.stores.findFirst({
      where: eq(stores.id, id),
    });
    return result ? this.mapToStore(result) : null;
  }

  /**
   * Find store by slug.
   * @param slug - Store slug (e.g., "steam", "gog", "epic")
   * @returns Store or null if not found
   */
  async findBySlug(slug: string): Promise<Store | null> {
    const result = await this.db.query.stores.findFirst({
      where: eq(stores.slug, slug),
    });
    return result ? this.mapToStore(result) : null;
  }

  /**
   * List all stores.
   * @returns Array of all stores
   */
  async list(): Promise<Store[]> {
    const results = await this.db.query.stores.findMany();
    return results.map((row) => this.mapToStore(row));
  }

  /**
   * List stores by platform family.
   * @param platformFamily - Platform family name
   * @returns Array of stores available for platform family
   */
  async listByPlatformFamily(platformFamily: string): Promise<Store[]> {
    const results = await this.db.query.stores.findMany({
      where: eq(stores.platformFamily, platformFamily),
    });
    return results.map((row) => this.mapToStore(row));
  }

  /**
   * List stores supporting achievements.
   * @returns Array of stores with achievement support
   */
  async listWithAchievements(): Promise<Store[]> {
    const results = await this.db.query.stores.findMany({
      where: eq(stores.supportsAchievements, true),
    });
    return results.map((row) => this.mapToStore(row));
  }

  private mapToStore(row: Record<string, unknown>): Store {
    return {
      id: row.id as string,
      slug: row.slug as string,
      display_name: row.displayName as string,
      store_type: row.storeType as "digital" | "physical",
      platform_family: (row.platformFamily as string) || null,
      color_primary: (row.colorPrimary as string) || "#6B7280",
      website_url: (row.websiteUrl as string) || null,
      icon_url: (row.iconUrl as string) || null,
      supports_achievements: Boolean(row.supportsAchievements),
      supports_library_sync: Boolean(row.supportsLibrarySync),
      igdb_website_category: (row.igdbWebsiteCategory as number) || null,
      sort_order: (row.sortOrder as number) || 0,
      created_at: this.ensureDate(row.createdAt) || new Date(),
    };
  }

  private ensureDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    return null;
  }
}
