import { inject, injectable } from "tsyringe";

import { ENCRYPTION_SERVICE_TOKEN, USER_CREDENTIAL_REPOSITORY_TOKEN } from "@/container/tokens";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/base";

import type { ApiService, UserApiCredential } from "../types";
import type { IUserCredentialRepository } from "../repositories/user-credential.repository.interface";
import type { IEncryptionService } from "./encryption.service.interface";
import type {
  ICredentialService,
  SaveCredentialInput,
  CredentialStatus,
  CredentialStatusResponse,
  CredentialSaveResponse,
  CredentialValidateResponse,
  TwitchOAuthCredentials,
} from "./credential.service.interface";

/**
 * Service for managing user API credentials with encryption.
 */
@injectable()
export class CredentialService implements ICredentialService {
  private logger: Logger;

  constructor(
    @inject(USER_CREDENTIAL_REPOSITORY_TOKEN)
    private repository: IUserCredentialRepository,
    @inject(ENCRYPTION_SERVICE_TOKEN)
    private encryption: IEncryptionService,
    @inject(Logger) parentLogger: Logger
  ) {
    this.logger = parentLogger.child("CredentialService");
  }

  /**
   * List all credentials status for a user (without decrypted values).
   *
   * @param userId - User ID to list credentials for
   * @returns Credential status response containing all services
   */
  async listCredentials(userId: string): Promise<CredentialStatusResponse> {
    this.logger.debug(`Listing credentials for user ${userId}`);

    const credentials = await this.repository.findByUser(userId);

    return {
      services: credentials.map((c) => this.toCredentialStatus(c)),
    };
  }

  /**
   * Save credentials for a service (encrypts before storage).
   *
   * @param userId - User ID to save credentials for
   * @param input - Credential input data with service and credentials
   * @returns Save response with status and message
   */
  async saveCredentials(
    userId: string,
    input: SaveCredentialInput
  ): Promise<CredentialSaveResponse> {
    this.logger.debug(`Saving credentials for ${input.service}`);

    this.validateCredentialInput(input);

    const encryptedCredentials = this.encryption.encrypt(input.credentials);

    await this.repository.upsert(userId, {
      service: input.service,
      credentialType: input.credential_type,
      encryptedCredentials,
      isActive: true,
      hasValidToken: false,
      tokenExpiresAt: null,
    });

    return {
      service: input.service,
      credential_type: input.credential_type,
      is_active: true,
      message: `Credentials saved for ${input.service}. Please validate to confirm they work.`,
    };
  }

  /**
   * Validate stored credentials by attempting authentication.
   *
   * Note: Actual API validation will be implemented in Phase B3 (IGDB)
   * and B7 (Steam/RetroAchievements). For now, this marks credentials
   * as validated with a placeholder check.
   *
   * @param userId - User ID whose credentials to validate
   * @param service - API service to validate
   * @returns Validation response with status
   */
  async validateCredentials(
    userId: string,
    service: ApiService
  ): Promise<CredentialValidateResponse> {
    this.logger.debug(`Validating credentials for ${service}`);

    const credential = await this.repository.findByUserAndService(userId, service);
    if (!credential) {
      throw new NotFoundError("Credential", service);
    }

    // Decrypt to verify we can read the credentials
    const decrypted = this.decryptCredentials(credential);

    // Placeholder validation - actual API calls added in B3/B7
    const isValid = this.performValidation(service, decrypted);

    // Calculate token expiry for OAuth-based services (Twitch expires in ~60 days)
    const tokenExpiresAt = service === "igdb" ? this.calculateTokenExpiry() : null;

    await this.repository.updateValidationStatus(userId, service, isValid, tokenExpiresAt);

    return {
      service,
      valid: isValid,
      has_valid_token: isValid,
      token_expires_at: tokenExpiresAt?.toISOString() ?? null,
      message: isValid
        ? `Credentials for ${service} validated successfully.`
        : `Credentials for ${service} could not be validated.`,
    };
  }

  /**
   * Delete credentials for a service.
   *
   * @param userId - User ID whose credentials to delete
   * @param service - API service to delete credentials for
   */
  async deleteCredentials(userId: string, service: ApiService): Promise<void> {
    this.logger.debug(`Deleting credentials for ${service}`);

    await this.repository.delete(userId, service);
  }

  /**
   * Convert database entity to API response status.
   *
   * @param credential - Database credential entity
   * @returns API credential status without sensitive data
   */
  private toCredentialStatus(credential: UserApiCredential): CredentialStatus {
    return {
      service: credential.service as ApiService,
      is_active: credential.isActive,
      has_valid_token: credential.hasValidToken,
      token_expires_at: credential.tokenExpiresAt?.toISOString() ?? null,
      last_validated_at: credential.lastValidatedAt?.toISOString() ?? null,
    };
  }

  /**
   * Validate the credential input structure based on service type.
   *
   * @param input - Credential input to validate
   * @throws ValidationError if input is invalid for the service type
   */
  private validateCredentialInput(input: SaveCredentialInput): void {
    const { service, credential_type, credentials } = input;

    if (service === "igdb") {
      if (credential_type !== "twitch_oauth") {
        throw new ValidationError("IGDB requires twitch_oauth credential type");
      }
      const creds = credentials as TwitchOAuthCredentials;
      if (!creds.client_id || !creds.client_secret) {
        throw new ValidationError("IGDB credentials require client_id and client_secret");
      }
    } else if (service === "retroachievements" || service === "rawg") {
      if (credential_type !== "api_key") {
        throw new ValidationError(`${service} requires api_key credential type`);
      }
      const creds = credentials as { api_key?: string };
      if (!creds.api_key) {
        throw new ValidationError(`${service} credentials require api_key`);
      }
    } else if (service === "steam") {
      if (credential_type !== "steam_openid") {
        throw new ValidationError("Steam requires steam_openid credential type");
      }
    }
  }

  /**
   * Decrypt credentials from storage.
   *
   * @param credential - Credential entity with encrypted data
   * @returns Decrypted credential data
   * @throws ValidationError if decryption fails
   */
  private decryptCredentials(credential: UserApiCredential): unknown {
    try {
      return this.encryption.decrypt(credential.encryptedCredentials);
    } catch {
      this.logger.error(`Failed to decrypt credentials for ${credential.service}`);
      throw new ValidationError("Failed to decrypt stored credentials");
    }
  }

  /**
   * Placeholder validation - actual API calls added in B3/B7.
   * For now, validates that credentials can be decrypted and have required fields.
   *
   * @param _service - API service (unused in placeholder)
   * @param decrypted - Decrypted credential data
   * @returns True if credentials appear valid
   */
  private performValidation(_service: ApiService, decrypted: unknown): boolean {
    // Basic structure check - actual API validation in B3/B7
    if (!decrypted || typeof decrypted !== "object") {
      return false;
    }
    return true;
  }

  /**
   * Calculate token expiry for OAuth services.
   * Twitch tokens typically expire in 60 days.
   *
   * @returns Date representing token expiration
   */
  private calculateTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 60);
    return expiry;
  }
}
