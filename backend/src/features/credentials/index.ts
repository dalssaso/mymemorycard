// Services
export { EncryptionService } from "./services/encryption.service"
export type { IEncryptionService } from "./services/encryption.service.interface"
export { CredentialService } from "./services/credential.service"
export type {
  ICredentialService,
  SaveCredentialInput,
  TwitchOAuthCredentials,
  ApiKeyCredentials,
  SteamOpenIdCredentials,
  CredentialStatus,
  CredentialStatusResponse,
  CredentialSaveResponse,
  CredentialValidateResponse,
} from "./services/credential.service.interface"

// Repositories
export { PostgresUserCredentialRepository } from "./repositories/user-credential.repository"
export type {
  IUserCredentialRepository,
  UpsertCredentialData,
} from "./repositories/user-credential.repository.interface"

// Controllers
export { CredentialController } from "./controllers/credential.controller"
export type { ICredentialController, CredentialEnv } from "./controllers/credential.controller.interface"

// Types
export type {
  ApiService,
  CredentialType,
  UserApiCredential,
  UpsertCredentialInput,
  UserApiCredentialResponse,
} from "./types"

// DTOs
export {
  ApiServiceSchema,
  CredentialTypeSchema,
  SaveCredentialRequestSchema,
  ValidateCredentialRequestSchema,
  ServiceParamSchema,
  CredentialStatusSchema,
  CredentialListResponseSchema,
  CredentialSaveResponseSchema,
  CredentialValidateResponseSchema,
} from "./dtos/credentials.dto"
export type {
  SaveCredentialRequest,
  ValidateCredentialRequest,
  ServiceParam,
  CredentialStatusDto,
  CredentialListResponse,
} from "./dtos/credentials.dto"
