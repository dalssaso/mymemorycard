import { injectable, inject } from "tsyringe";
import { eq, and } from "drizzle-orm";

import { DATABASE_TOKEN } from "@/container/tokens";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { userApiCredentials } from "@/db/schema";
import { NotFoundError } from "@/shared/errors/base";
import type { ApiService, UserApiCredential } from "../types";

import type {
  IUserCredentialRepository,
  UpsertCredentialData,
} from "./user-credential.repository.interface";

/**
 * PostgreSQL implementation of IUserCredentialRepository using Drizzle ORM.
 */
@injectable()
export class PostgresUserCredentialRepository implements IUserCredentialRepository {
  constructor(@inject(DATABASE_TOKEN) private db: DrizzleDB) {}

  /**
   * Find credentials for a specific user and service.
   *
   * @param userId - User ID
   * @param service - API service (igdb, steam, etc.)
   * @returns Credential if found, null otherwise
   */
  async findByUserAndService(
    userId: string,
    service: ApiService
  ): Promise<UserApiCredential | null> {
    const result = await this.db
      .select()
      .from(userApiCredentials)
      .where(and(eq(userApiCredentials.userId, userId), eq(userApiCredentials.service, service)))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Find all credentials for a user.
   *
   * @param userId - User ID
   * @returns Array of credentials
   */
  async findByUser(userId: string): Promise<UserApiCredential[]> {
    return await this.db
      .select()
      .from(userApiCredentials)
      .where(eq(userApiCredentials.userId, userId))
      .orderBy(userApiCredentials.service);
  }

  /**
   * Save or update credentials using upsert.
   *
   * @param userId - User ID
   * @param data - Credential data to upsert
   * @returns Created or updated credential
   */
  async upsert(userId: string, data: UpsertCredentialData): Promise<UserApiCredential> {
    const [result] = await this.db
      .insert(userApiCredentials)
      .values({
        userId,
        service: data.service,
        credentialType: data.credentialType,
        encryptedCredentials: data.encryptedCredentials,
        isActive: data.isActive ?? true,
        hasValidToken: data.hasValidToken ?? false,
        tokenExpiresAt: data.tokenExpiresAt ?? null,
        lastValidatedAt: null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userApiCredentials.userId, userApiCredentials.service],
        set: {
          credentialType: data.credentialType,
          encryptedCredentials: data.encryptedCredentials,
          isActive: data.isActive ?? true,
          hasValidToken: data.hasValidToken ?? false,
          tokenExpiresAt: data.tokenExpiresAt ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result!;
  }

  /**
   * Delete credentials for a user and service.
   *
   * @param userId - User ID
   * @param service - API service to delete credentials for
   * @throws NotFoundError if no credential exists for the user and service
   */
  async delete(userId: string, service: ApiService): Promise<void> {
    const result = await this.db
      .delete(userApiCredentials)
      .where(and(eq(userApiCredentials.userId, userId), eq(userApiCredentials.service, service)))
      .returning({ id: userApiCredentials.id });

    if (result.length === 0) {
      throw new NotFoundError("Credential", service);
    }
  }

  /**
   * Update token validation status after validation check.
   *
   * @param userId - User ID
   * @param service - API service
   * @param hasValidToken - Whether the token is valid
   * @param tokenExpiresAt - Token expiration date (optional)
   * @returns Updated credential if found, null otherwise
   */
  async updateValidationStatus(
    userId: string,
    service: ApiService,
    hasValidToken: boolean,
    tokenExpiresAt?: Date | null
  ): Promise<UserApiCredential | null> {
    const result = await this.db
      .update(userApiCredentials)
      .set({
        hasValidToken,
        tokenExpiresAt: tokenExpiresAt ?? null,
        lastValidatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(userApiCredentials.userId, userId), eq(userApiCredentials.service, service)))
      .returning();

    return result[0] ?? null;
  }
}
