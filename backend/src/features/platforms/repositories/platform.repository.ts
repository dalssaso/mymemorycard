import { asc, desc, eq } from "drizzle-orm"
import { inject, injectable } from "tsyringe"
import { platforms } from "@/db/schema"
import type { DrizzleDB } from "@/infrastructure/database/connection"
import type { Platform } from "../types"
import type { IPlatformRepository } from "./platform.repository.interface"

@injectable()
export class PostgresPlatformRepository implements IPlatformRepository {
  constructor(@inject("Database") private db: DrizzleDB) {}

  async list(): Promise<Platform[]> {
    return await this.db
      .select()
      .from(platforms)
      .orderBy(desc(platforms.isSystem), asc(platforms.sortOrder), asc(platforms.displayName))
  }

  async getById(id: string): Promise<Platform | null> {
    const result = await this.db.select().from(platforms).where(eq(platforms.id, id)).limit(1)
    return result[0] ?? null
  }
}
