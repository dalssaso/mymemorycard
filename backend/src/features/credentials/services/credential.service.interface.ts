import type { ApiService, CredentialType } from "../types";

/**
 * Service interface for managing user API credentials.
 */
export interface ICredentialService {
  /**
   * Get all credentials status for a user (without decrypted values).
   */
  listCredentials(userId: string): Promise<CredentialStatusResponse>;

  /**
   * Save credentials for a service.
   */
  saveCredentials(userId: string, input: SaveCredentialInput): Promise<CredentialSaveResponse>;

  /**
   * Validate stored credentials by attempting authentication.
   */
  validateCredentials(userId: string, service: ApiService): Promise<CredentialValidateResponse>;

  /**
   * Delete credentials for a service.
   */
  deleteCredentials(userId: string, service: ApiService): Promise<void>;
}

/**
 * Input for saving credentials.
 */
export interface SaveCredentialInput {
  service: ApiService;
  credential_type: CredentialType;
  credentials: TwitchOAuthCredentials | ApiKeyCredentials | SteamOpenIdCredentials;
}

/**
 * Twitch OAuth credentials for IGDB.
 */
export interface TwitchOAuthCredentials {
  client_id: string;
  client_secret: string;
}

/**
 * API key credentials (RetroAchievements, RAWG).
 */
export interface ApiKeyCredentials {
  username?: string;
  api_key: string;
}

/**
 * Steam OpenID credentials (stored after OAuth callback).
 */
export interface SteamOpenIdCredentials {
  steam_id: string;
  display_name?: string;
}

/**
 * Single credential status (no decrypted values).
 */
export interface CredentialStatus {
  service: ApiService;
  is_active: boolean;
  has_valid_token: boolean;
  token_expires_at: string | null;
  last_validated_at: string | null;
}

/**
 * Response for listing all credentials.
 */
export interface CredentialStatusResponse {
  services: CredentialStatus[];
}

/**
 * Response after saving credentials.
 */
export interface CredentialSaveResponse {
  service: ApiService;
  credential_type: CredentialType;
  is_active: boolean;
  message: string;
}

/**
 * Response after validating credentials.
 */
export interface CredentialValidateResponse {
  service: ApiService;
  valid: boolean;
  has_valid_token: boolean;
  token_expires_at: string | null;
  message: string;
}
