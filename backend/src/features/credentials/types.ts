import type { InferSelectModel } from "drizzle-orm";

import type { userApiCredentials } from "@/db/schema";

/**
 * API services that support credential storage
 */
export type ApiService = "igdb" | "steam" | "retroachievements" | "rawg";

/**
 * Types of credentials stored for API services
 */
export type CredentialType = "twitch_oauth" | "steam_openid" | "api_key";

/**
 * User API credentials entity from database
 */
export type UserApiCredential = InferSelectModel<typeof userApiCredentials>;

/**
 * Input for creating or updating user API credentials
 */
export interface UpsertCredentialInput {
  service: ApiService;
  credentialType: CredentialType;
  credentials: unknown;
}

/**
 * User API credentials response DTO (snake_case for API)
 */
export interface UserApiCredentialResponse {
  id: string;
  user_id: string;
  service: ApiService;
  credential_type: CredentialType;
  is_active: boolean;
  has_valid_token: boolean;
  token_expires_at: string | null;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}
