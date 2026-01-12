import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import type { Logger } from "@/infrastructure/logging/logger";
import { userAiSettings } from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import type { IAiSettingsRepository } from "./ai-settings.repository.interface";
import type { GatewayConfig, UserAiSettings } from "../types";
import { AI_MODELS } from "../types";

@injectable()
export class AiSettingsRepository implements IAiSettingsRepository {
  constructor(
    @inject("Database") private db: DrizzleDB,
    @inject("Logger") private logger: Logger
  ) {}

  /**
   * Find AI settings for a user by their ID
   * @param userId - The user's unique identifier
   * @returns The user's AI settings, or null if not found
   */
  async findByUserId(userId: string): Promise<UserAiSettings | null> {
    const result = await this.db
      .select()
      .from(userAiSettings)
      .where(eq(userAiSettings.userId, userId))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Save or update AI settings for a user
   * @param settings - The AI settings to save (userId and provider are required)
   * @returns A promise that resolves when the settings are saved
   * @throws Error if userId or provider are missing
   */
  async save(settings: Partial<UserAiSettings> & { userId: string }): Promise<void> {
    if (!settings.userId || !settings.provider) {
      throw new Error("userId and provider are required");
    }

    // Explicit insert payload - only non-nullable and provided fields
    const insertPayload = {
      userId: settings.userId,
      provider: settings.provider,
      baseUrl: settings.baseUrl ?? null,
      apiKeyEncrypted: settings.apiKeyEncrypted ?? null,
      model: settings.model ?? AI_MODELS.TEXT,
      imageApiKeyEncrypted: settings.imageApiKeyEncrypted ?? null,
      imageModel: settings.imageModel ?? "dall-e-3",
      temperature: settings.temperature ?? 0.7,
      maxTokens: settings.maxTokens ?? 2000,
      isActive: settings.isActive ?? false,
      collectionSuggestionsModel: settings.collectionSuggestionsModel ?? null,
      nextGameSuggestionsModel: settings.nextGameSuggestionsModel ?? null,
      coverGenerationModel: settings.coverGenerationModel ?? null,
      enableSmartRouting: settings.enableSmartRouting ?? true,
      gatewayApiKeyEncrypted: settings.gatewayApiKeyEncrypted ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Explicit update payload - only mutable columns (exclude conflict keys and createdAt)
    const updatePayload = {
      baseUrl: settings.baseUrl,
      apiKeyEncrypted: settings.apiKeyEncrypted,
      model: settings.model,
      imageApiKeyEncrypted: settings.imageApiKeyEncrypted,
      imageModel: settings.imageModel,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
      isActive: settings.isActive,
      collectionSuggestionsModel: settings.collectionSuggestionsModel,
      nextGameSuggestionsModel: settings.nextGameSuggestionsModel,
      coverGenerationModel: settings.coverGenerationModel,
      enableSmartRouting: settings.enableSmartRouting,
      gatewayApiKeyEncrypted: settings.gatewayApiKeyEncrypted,
      updatedAt: new Date(),
    };

    // Remove undefined values from update payload
    const cleanUpdatePayload = Object.fromEntries(
      Object.entries(updatePayload).filter(([_, v]) => v !== undefined)
    );

    await this.db
      .insert(userAiSettings)
      .values(insertPayload)
      .onConflictDoUpdate({
        target: [userAiSettings.userId, userAiSettings.provider],
        set: cleanUpdatePayload,
      });
  }

  /**
   * Get gateway configuration from user AI settings
   * @param userId - The user's unique identifier
   * @returns Gateway config with provider and apiKey, or null if settings not found or gateway not configured
   */
  async getGatewayConfig(userId: string): Promise<GatewayConfig | null> {
    const settings = await this.findByUserId(userId);

    if (!settings) {
      return null;
    }

    if (!settings.gatewayApiKeyEncrypted) {
      return null;
    }

    try {
      const apiKey = decrypt(settings.gatewayApiKeyEncrypted);
      return {
        apiKey,
        provider: settings.provider,
      };
    } catch (error) {
      // Treat decrypt failure as "not configured" - likely rotated secret or corrupt key
      // Log the error for debugging but don't expose details to caller
      this.logger.error("Failed to decrypt gateway API key", {
        userId,
        error,
      });
      return null;
    }
  }
}
