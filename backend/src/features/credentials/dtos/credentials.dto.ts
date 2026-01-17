import { z } from "zod";

/**
 * Service enum schema.
 */
export const ApiServiceSchema = z.enum(["igdb", "steam", "retroachievements", "rawg"]);

/**
 * Credential type enum schema.
 */
export const CredentialTypeSchema = z.enum(["twitch_oauth", "steam_openid", "api_key"]);

/**
 * Twitch OAuth credentials schema (for IGDB).
 */
export const TwitchOAuthCredentialsSchema = z.object({
  client_id: z.string().min(1, "Client ID is required"),
  client_secret: z.string().min(1, "Client secret is required"),
});

/**
 * API key credentials schema (for RetroAchievements, RAWG).
 */
export const ApiKeyCredentialsSchema = z.object({
  username: z.string().optional(),
  api_key: z.string().min(1, "API key is required"),
});

/**
 * Steam OpenID credentials schema.
 */
export const SteamOpenIdCredentialsSchema = z.object({
  steam_id: z.string().min(1, "Steam ID is required"),
  display_name: z.string().optional(),
});

/**
 * Request schema for saving credentials.
 */
export const SaveCredentialRequestSchema = z
  .object({
    service: ApiServiceSchema,
    credential_type: CredentialTypeSchema,
    credentials: z.union([
      TwitchOAuthCredentialsSchema,
      ApiKeyCredentialsSchema,
      SteamOpenIdCredentialsSchema,
    ]),
  })
  .strict()
  .openapi("SaveCredentialRequest", {
    description: "Request to save API credentials for a service",
    example: {
      service: "igdb",
      credential_type: "twitch_oauth",
      credentials: {
        client_id: "your-twitch-client-id",
        client_secret: "your-twitch-client-secret",
      },
    },
  });

export type SaveCredentialRequest = z.infer<typeof SaveCredentialRequestSchema>;

/**
 * Request schema for validating credentials.
 */
export const ValidateCredentialRequestSchema = z
  .object({
    service: ApiServiceSchema,
  })
  .strict()
  .openapi("ValidateCredentialRequest", {
    description: "Request to validate stored credentials",
    example: {
      service: "igdb",
    },
  });

export type ValidateCredentialRequest = z.infer<typeof ValidateCredentialRequestSchema>;

/**
 * Service parameter schema for delete endpoint.
 */
export const ServiceParamSchema = z.object({
  service: ApiServiceSchema,
});

export type ServiceParam = z.infer<typeof ServiceParamSchema>;

/**
 * Single credential status response.
 */
export const CredentialStatusSchema = z
  .object({
    service: ApiServiceSchema,
    is_active: z.boolean(),
    has_valid_token: z.boolean(),
    token_expires_at: z.string().datetime().nullable(),
    last_validated_at: z.string().datetime().nullable(),
  })
  .openapi("CredentialStatus", {
    description: "Status of a single API credential",
    example: {
      service: "igdb",
      is_active: true,
      has_valid_token: true,
      token_expires_at: "2026-03-16T12:00:00.000Z",
      last_validated_at: "2026-01-16T12:00:00.000Z",
    },
  });

export type CredentialStatusDto = z.infer<typeof CredentialStatusSchema>;

/**
 * List credentials response.
 */
export const CredentialListResponseSchema = z
  .object({
    services: z.array(CredentialStatusSchema).max(10).openapi({ maxItems: 10 }),
  })
  .openapi("CredentialListResponse", {
    description: "List of all credential statuses for the user",
  });

export type CredentialListResponse = z.infer<typeof CredentialListResponseSchema>;

/**
 * Save credential response.
 */
export const CredentialSaveResponseSchema = z
  .object({
    service: ApiServiceSchema,
    credential_type: CredentialTypeSchema,
    is_active: z.boolean(),
    message: z.string(),
  })
  .openapi("CredentialSaveResponse", {
    description: "Response after saving credentials",
    example: {
      service: "igdb",
      credential_type: "twitch_oauth",
      is_active: true,
      message: "Credentials saved for igdb. Please validate to confirm they work.",
    },
  });

export type CredentialSaveResponse = z.infer<typeof CredentialSaveResponseSchema>;

/**
 * Validate credential response.
 */
export const CredentialValidateResponseSchema = z
  .object({
    service: ApiServiceSchema,
    valid: z.boolean(),
    has_valid_token: z.boolean(),
    token_expires_at: z.string().datetime().nullable(),
    message: z.string(),
  })
  .openapi("CredentialValidateResponse", {
    description: "Response after validating credentials",
    example: {
      service: "igdb",
      valid: true,
      has_valid_token: true,
      token_expires_at: "2026-03-16T12:00:00.000Z",
      message: "Credentials for igdb validated successfully.",
    },
  });

export type CredentialValidateResponse = z.infer<typeof CredentialValidateResponseSchema>;
