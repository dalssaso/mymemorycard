import "reflect-metadata";
import { container } from "tsyringe";
import {
  ADMIN_CONTROLLER_TOKEN,
  ADMIN_REPOSITORY_TOKEN,
  ADMIN_SERVICE_TOKEN,
  AUTH_CONTROLLER_TOKEN,
  AUTH_SERVICE_TOKEN,
  CONFIG_TOKEN,
  CREDENTIAL_CONTROLLER_TOKEN,
  CREDENTIAL_SERVICE_TOKEN,
  DATABASE_TOKEN,
  ENCRYPTION_SERVICE_TOKEN,
  GAME_METADATA_SERVICE_TOKEN,
  GAME_REPOSITORY_TOKEN,
  GAMES_CONTROLLER_TOKEN,
  GAMES_PLATFORM_REPOSITORY_TOKEN,
  IGDB_CACHE_TOKEN,
  IGDB_RATE_LIMITER_TOKEN,
  IGDB_SERVICE_TOKEN,
  PASSWORD_HASHER_TOKEN,
  PLATFORM_CONTROLLER_TOKEN,
  PLATFORM_REPOSITORY_TOKEN,
  PLATFORM_SERVICE_TOKEN,
  PREFERENCES_CONTROLLER_TOKEN,
  PREFERENCES_REPOSITORY_TOKEN,
  PREFERENCES_SERVICE_TOKEN,
  REDIS_CONNECTION_TOKEN,
  RETROACHIEVEMENTS_CONTROLLER_TOKEN,
  RETROACHIEVEMENTS_SERVICE_TOKEN,
  STEAM_CONTROLLER_TOKEN,
  STEAM_SERVICE_TOKEN,
  STORE_CONTROLLER_TOKEN,
  STORE_REPOSITORY_TOKEN,
  STORE_SERVICE_TOKEN,
  TOKEN_SERVICE_TOKEN,
  USER_CREDENTIAL_REPOSITORY_TOKEN,
  USER_GAME_PROGRESS_REPOSITORY_TOKEN,
  USER_GAME_REPOSITORY_TOKEN,
  USER_PLATFORMS_CONTROLLER_TOKEN,
  USER_PLATFORMS_REPOSITORY_TOKEN,
  USER_PLATFORMS_SERVICE_TOKEN,
  USER_REPOSITORY_TOKEN,
} from "@/container/tokens";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import type { DrizzleDB } from "@/infrastructure/database/connection";
import { RedisConnection } from "@/infrastructure/redis/connection";
import type { IRedisConnection } from "@/infrastructure/redis/connection.interface";

// Config
import { Config } from "@/infrastructure/config/config";
import type { IConfig } from "@/infrastructure/config/config.interface";

// Infrastructure
import { Logger } from "@/infrastructure/logging/logger";
import { MetricsService } from "@/infrastructure/metrics/metrics";

// Auth - Repositories
import { PostgresUserRepository } from "@/features/auth/repositories/user.repository";
import type { IUserRepository } from "@/features/auth/repositories/user.repository.interface";

// Auth - Services
import { PasswordHasher } from "@/features/auth/services/password-hasher";
import { TokenService } from "@/features/auth/services/token.service";
import { AuthService } from "@/features/auth/services/auth.service";
import type { IPasswordHasher } from "@/features/auth/services/password-hasher.interface";
import type { ITokenService } from "@/features/auth/services/token.service.interface";
import type { IAuthService } from "@/features/auth/services/auth.service.interface";

// Auth - Controllers
import { AuthController } from "@/features/auth/controllers/auth.controller";
import type { IAuthController } from "@/features/auth/controllers/auth.controller.interface";

// Platform - Repositories
import { PostgresPlatformRepository } from "@/features/platforms/repositories/platform.repository";
import type { IPlatformRepository } from "@/features/platforms/repositories/platform.repository.interface";

// Platform - Services
import { PlatformService } from "@/features/platforms/services/platform.service";
import type { IPlatformService } from "@/features/platforms/services/platform.service.interface";

// Platform - Controllers
import { PlatformController } from "@/features/platforms/controllers/platform.controller";
import type { IPlatformController } from "@/features/platforms/controllers/platform.controller.interface";

// User-Platforms - Repositories
import { PostgresUserPlatformsRepository } from "@/features/user-platforms/repositories/user-platforms.repository";
import type { IUserPlatformsRepository } from "@/features/user-platforms/repositories/user-platforms.repository.interface";

// User-Platforms - Services
import { UserPlatformsService } from "@/features/user-platforms/services/user-platforms.service";
import type { IUserPlatformsService } from "@/features/user-platforms/services/user-platforms.service.interface";

// User-Platforms - Controllers
import { UserPlatformsController } from "@/features/user-platforms/controllers/user-platforms.controller";
import type { IUserPlatformsController } from "@/features/user-platforms/controllers/user-platforms.controller.interface";

// Preferences - Repositories
import { PostgresPreferencesRepository } from "@/features/preferences/repositories/preferences.repository";
import type { IPreferencesRepository } from "@/features/preferences/repositories/preferences.repository.interface";

// Preferences - Services
import { PreferencesService } from "@/features/preferences/services/preferences.service";
import type { IPreferencesService } from "@/features/preferences/services/preferences.service.interface";

// Preferences - Controllers
import { PreferencesController } from "@/features/preferences/controllers/preferences.controller";
import type { IPreferencesController } from "@/features/preferences/controllers/preferences.controller.interface";

// Admin - Repositories
import { PostgresAdminRepository } from "@/features/admin/repositories/admin.repository";
import type { IAdminRepository } from "@/features/admin/repositories/admin.repository.interface";

// Admin - Services
import { AdminService } from "@/features/admin/services/admin.service";
import type { IAdminService } from "@/features/admin/services/admin.service.interface";

// Admin - Controllers
import { AdminController } from "@/features/admin/controllers/admin.controller";
import type { IAdminController } from "@/features/admin/controllers/admin.controller.interface";

// Credentials - Repositories
import { PostgresUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository";
import type { IUserCredentialRepository } from "@/features/credentials/repositories/user-credential.repository.interface";

// Credentials - Services
import { CredentialService, EncryptionService } from "@/features/credentials";
import type { ICredentialService, IEncryptionService } from "@/features/credentials";

// Credentials - Controllers
import { CredentialController } from "@/features/credentials/controllers/credential.controller";
import type { ICredentialController } from "@/features/credentials/controllers/credential.controller.interface";

// IGDB Integration
import { IgdbCache, IgdbRateLimiter, IgdbService } from "@/integrations/igdb";
import type { IIgdbService, IRateLimiter } from "@/integrations/igdb";

// Games - Repositories
import { GameRepository } from "@/features/games/repositories/game.repository";
import type { IGameRepository } from "@/features/games/repositories/game.repository.interface";
import { UserGameRepository } from "@/features/games/repositories/user-game.repository";
import type { IUserGameRepository } from "@/features/games/repositories/user-game.repository.interface";
import { PlatformRepository as GamesPlatformRepository } from "@/features/games/repositories/platform.repository";
import type { IPlatformRepository as IGamesPlatformRepository } from "@/features/games/repositories/platform.repository.interface";
import { StoreRepository } from "@/features/games/repositories/store.repository";
import type { IStoreRepository } from "@/features/games/repositories/store.repository.interface";
import { UserGameProgressRepository } from "@/features/games/repositories/user-game-progress.repository";
import type { IUserGameProgressRepository } from "@/features/games/repositories/user-game-progress.repository.interface";

// Games - Services
import { GameMetadataService } from "@/features/games/services/game-metadata.service";
import type { IGameMetadataService } from "@/features/games/services/game-metadata.service.interface";

// Games - Controllers
import { GamesController } from "@/features/games/controllers/games.controller";
import type { IGamesController } from "@/features/games/controllers/games.controller.interface";

// Stores - Services
import { StoreService } from "@/features/stores/services/store.service";
import type { IStoreService } from "@/features/stores/services/store.service.interface";

// Stores - Controllers
import { StoreController } from "@/features/stores/controllers/store.controller";
import type { IStoreController } from "@/features/stores/controllers/store.controller.interface";

// Steam Integration
import { SteamController } from "@/integrations/steam/steam.controller";
import type { ISteamController } from "@/integrations/steam/steam.controller.interface";
import { SteamService } from "@/integrations/steam/steam.service";
import type { ISteamService } from "@/integrations/steam/steam.service.interface";

// RetroAchievements Integration
import { RetroAchievementsController } from "@/integrations/retroachievements/retroachievements.controller";
import type { IRetroAchievementsController } from "@/integrations/retroachievements/retroachievements.controller.interface";
import { RetroAchievementsService } from "@/integrations/retroachievements/retroachievements.service";
import type { IRetroAchievementsService } from "@/integrations/retroachievements/retroachievements.service.interface";

/**
 * Register all dependencies for the application.
 * Called once at application startup.
 */
export function registerDependencies(): void {
  // Config first - validates env vars immediately at startup
  container.registerSingleton<IConfig>(CONFIG_TOKEN, Config);

  // Infrastructure - Singletons
  container.registerSingleton(DatabaseConnection);

  // Register DrizzleDB from DatabaseConnection instance
  container.register<DrizzleDB>(DATABASE_TOKEN, {
    useFactory: (container) => container.resolve(DatabaseConnection).db,
  });

  // Redis Connection - Singleton with lazy connection support
  container.registerSingleton<IRedisConnection>(REDIS_CONNECTION_TOKEN, RedisConnection);

  // Logger singleton - optional context parameter handled by constructor
  container.registerSingleton(Logger);
  container.registerSingleton(MetricsService);

  // Auth Domain - Repositories
  container.registerSingleton<IUserRepository>(USER_REPOSITORY_TOKEN, PostgresUserRepository);

  // Auth Domain - Services
  container.registerSingleton<IPasswordHasher>(PASSWORD_HASHER_TOKEN, PasswordHasher);
  container.registerSingleton<ITokenService>(TOKEN_SERVICE_TOKEN, TokenService);
  container.registerSingleton<IAuthService>(AUTH_SERVICE_TOKEN, AuthService);

  // Auth Domain - Controllers
  container.registerSingleton<IAuthController>(AUTH_CONTROLLER_TOKEN, AuthController);

  // Platforms Domain - Repositories
  container.registerSingleton<IPlatformRepository>(
    PLATFORM_REPOSITORY_TOKEN,
    PostgresPlatformRepository
  );

  // Platforms Domain - Services
  container.registerSingleton<IPlatformService>(PLATFORM_SERVICE_TOKEN, PlatformService);

  // Platforms Domain - Controllers
  container.registerSingleton<IPlatformController>(PLATFORM_CONTROLLER_TOKEN, PlatformController);

  // User-Platforms Domain - Repositories
  container.registerSingleton<IUserPlatformsRepository>(
    USER_PLATFORMS_REPOSITORY_TOKEN,
    PostgresUserPlatformsRepository
  );

  // User-Platforms Domain - Services
  container.registerSingleton<IUserPlatformsService>(
    USER_PLATFORMS_SERVICE_TOKEN,
    UserPlatformsService
  );

  // User-Platforms Domain - Controllers
  container.registerSingleton<IUserPlatformsController>(
    USER_PLATFORMS_CONTROLLER_TOKEN,
    UserPlatformsController
  );

  // Preferences Domain - Repositories
  container.registerSingleton<IPreferencesRepository>(
    PREFERENCES_REPOSITORY_TOKEN,
    PostgresPreferencesRepository
  );

  // Preferences Domain - Services
  container.registerSingleton<IPreferencesService>(PREFERENCES_SERVICE_TOKEN, PreferencesService);

  // Preferences Domain - Controllers
  container.registerSingleton<IPreferencesController>(
    PREFERENCES_CONTROLLER_TOKEN,
    PreferencesController
  );

  // Admin Domain - Repositories
  container.registerSingleton<IAdminRepository>(ADMIN_REPOSITORY_TOKEN, PostgresAdminRepository);

  // Admin Domain - Services
  container.registerSingleton<IAdminService>(ADMIN_SERVICE_TOKEN, AdminService);

  // Admin Domain - Controllers
  container.registerSingleton<IAdminController>(ADMIN_CONTROLLER_TOKEN, AdminController);

  // Credentials Domain - Repositories
  container.registerSingleton<IUserCredentialRepository>(
    USER_CREDENTIAL_REPOSITORY_TOKEN,
    PostgresUserCredentialRepository
  );

  // Credentials Domain - Services
  container.registerSingleton<IEncryptionService>(ENCRYPTION_SERVICE_TOKEN, EncryptionService);
  container.registerSingleton<ICredentialService>(CREDENTIAL_SERVICE_TOKEN, CredentialService);

  // Credentials Domain - Controllers
  container.registerSingleton<ICredentialController>(
    CREDENTIAL_CONTROLLER_TOKEN,
    CredentialController
  );

  // IGDB Integration
  // Rate limiter is a singleton to maintain consistent rate limiting across all requests
  container.registerSingleton<IRateLimiter>(IGDB_RATE_LIMITER_TOKEN, IgdbRateLimiter);

  // IGDB Cache - Uses RedisConnection for Redis access
  container.register<IgdbCache>(IGDB_CACHE_TOKEN, {
    useFactory: (c) => {
      const redisConnection = c.resolve<IRedisConnection>(REDIS_CONNECTION_TOKEN);
      const redisFactory = async (): ReturnType<IRedisConnection["getClient"]> =>
        redisConnection.getClient();
      return new IgdbCache(redisFactory);
    },
  });
  container.registerSingleton<IIgdbService>(IGDB_SERVICE_TOKEN, IgdbService);

  // Games Domain - Repositories
  container.registerSingleton<IGameRepository>(GAME_REPOSITORY_TOKEN, GameRepository);
  container.registerSingleton<IUserGameRepository>(USER_GAME_REPOSITORY_TOKEN, UserGameRepository);
  container.registerSingleton<IGamesPlatformRepository>(
    GAMES_PLATFORM_REPOSITORY_TOKEN,
    GamesPlatformRepository
  );
  container.registerSingleton<IStoreRepository>(STORE_REPOSITORY_TOKEN, StoreRepository);
  container.registerSingleton<IUserGameProgressRepository>(
    USER_GAME_PROGRESS_REPOSITORY_TOKEN,
    UserGameProgressRepository
  );

  // Games Domain - Services
  container.registerSingleton<IGameMetadataService>(
    GAME_METADATA_SERVICE_TOKEN,
    GameMetadataService
  );

  // Games Domain - Controllers
  container.registerSingleton<IGamesController>(GAMES_CONTROLLER_TOKEN, GamesController);

  // Stores Domain - Services
  container.registerSingleton<IStoreService>(STORE_SERVICE_TOKEN, StoreService);

  // Stores Domain - Controllers
  container.registerSingleton<IStoreController>(STORE_CONTROLLER_TOKEN, StoreController);

  // Steam Integration - Services
  container.registerSingleton<ISteamService>(STEAM_SERVICE_TOKEN, SteamService);

  // Steam Integration - Controllers
  container.registerSingleton<ISteamController>(STEAM_CONTROLLER_TOKEN, SteamController);

  // RetroAchievements Integration - Services
  container.registerSingleton<IRetroAchievementsService>(
    RETROACHIEVEMENTS_SERVICE_TOKEN,
    RetroAchievementsService
  );

  // RetroAchievements Integration - Controllers
  container.registerSingleton<IRetroAchievementsController>(
    RETROACHIEVEMENTS_CONTROLLER_TOKEN,
    RetroAchievementsController
  );
}

/**
 * Reset container (useful for testing)
 * Clears all registrations and instances
 */
export function resetContainer(): void {
  container.reset();
}

export { container };
