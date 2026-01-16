import type { ApiService, CredentialType, UserApiCredential } from "../types";

/**
 * Repository interface for user API credentials storage.
 */
export interface IUserCredentialRepository {
  /**
   * Find credentials for a specific user and service.
   *
   * @param userId - User ID
   * @param service - API service (igdb, steam, etc.)
   * @returns Credential if found, null otherwise
   */
  findByUserAndService(userId: string, service: ApiService): Promise<UserApiCredential | null>;

  /**
   * Find all credentials for a user.
   *
   * @param userId - User ID
   * @returns Array of credentials
   */
  findByUser(userId: string): Promise<UserApiCredential[]>;

  /**
   * Save or update credentials for a user and service.
   * Uses upsert to handle both create and update.
   *
   * @param userId - User ID
   * @param credential - Credential data to upsert
   * @returns Created or updated credential
   */
  upsert(userId: string, credential: UpsertCredentialData): Promise<UserApiCredential>;

  /**
   * Delete credentials for a user and service.
   *
   * @param userId - User ID
   * @param service - API service to delete credentials for
   */
  delete(userId: string, service: ApiService): Promise<void>;

  /**
   * Update token validation status.
   *
   * @param userId - User ID
   * @param service - API service
   * @param hasValidToken - Whether the token is valid
   * @param tokenExpiresAt - Token expiration date (optional)
   * @returns Updated credential if found, null otherwise
   */
  updateValidationStatus(
    userId: string,
    service: ApiService,
    hasValidToken: boolean,
    tokenExpiresAt?: Date | null
  ): Promise<UserApiCredential | null>;
}

/**
 * Data required for upserting credentials.
 */
export interface UpsertCredentialData {
  service: ApiService;
  credentialType: CredentialType;
  encryptedCredentials: string;
  isActive?: boolean;
  hasValidToken?: boolean;
  tokenExpiresAt?: Date | null;
}
