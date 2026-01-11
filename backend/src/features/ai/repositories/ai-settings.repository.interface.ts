import type { GatewayConfig, UserAiSettings } from "../types";

export interface IAiSettingsRepository {
  findByUserId(userId: string): Promise<UserAiSettings | null>;
  save(settings: Partial<UserAiSettings> & { userId: string }): Promise<void>;
  getGatewayConfig(userId: string): Promise<GatewayConfig | null>;
}
