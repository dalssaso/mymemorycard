import { injectable, inject } from "tsyringe"
import { eq } from "drizzle-orm"
import type { DrizzleDB } from "@/infrastructure/database/connection"
import { userAiSettings } from "@/db/schema"
import { decrypt } from "@/lib/encryption"
import type { IAiSettingsRepository } from "./ai-settings.repository.interface"
import type { GatewayConfig, UserAiSettings } from "../types"

@injectable()
export class AiSettingsRepository implements IAiSettingsRepository {
  constructor(@inject("Database") private db: DrizzleDB) {}

  async findByUserId(userId: string): Promise<UserAiSettings | null> {
    const result = await this.db
      .select()
      .from(userAiSettings)
      .where(eq(userAiSettings.userId, userId))
      .limit(1)

    return result[0] ?? null
  }

  async save(settings: Partial<UserAiSettings> & { userId: string }): Promise<void> {
    await this.db
      .insert(userAiSettings)
      .values(settings as UserAiSettings)
      .onConflictDoUpdate({
        target: [userAiSettings.userId, userAiSettings.provider],
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
  }

  async getGatewayConfig(userId: string): Promise<GatewayConfig | null> {
    const settings = await this.findByUserId(userId)

    if (!settings?.gatewayApiKeyEncrypted) {
      return null
    }

    return {
      apiKey: decrypt(settings.gatewayApiKeyEncrypted),
      provider: settings.provider,
    }
  }
}
