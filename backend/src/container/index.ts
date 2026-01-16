import "reflect-metadata";
import { container } from "tsyringe";
import {
  ADMIN_CONTROLLER_TOKEN,
  ADMIN_REPOSITORY_TOKEN,
  ADMIN_SERVICE_TOKEN,
  AUTH_CONTROLLER_TOKEN,
  AUTH_SERVICE_TOKEN,
  CONFIG_TOKEN,
  DATABASE_TOKEN,
  PASSWORD_HASHER_TOKEN,
  PLATFORM_CONTROLLER_TOKEN,
  PLATFORM_REPOSITORY_TOKEN,
  PLATFORM_SERVICE_TOKEN,
  PREFERENCES_CONTROLLER_TOKEN,
  PREFERENCES_REPOSITORY_TOKEN,
  PREFERENCES_SERVICE_TOKEN,
  TOKEN_SERVICE_TOKEN,
  USER_REPOSITORY_TOKEN,
  USER_PLATFORMS_CONTROLLER_TOKEN,
  USER_PLATFORMS_REPOSITORY_TOKEN,
  USER_PLATFORMS_SERVICE_TOKEN,
} from "@/container/tokens";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import type { DrizzleDB } from "@/infrastructure/database/connection";

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
}

/**
 * Reset container (useful for testing)
 * Clears all registrations and instances
 */
export function resetContainer(): void {
  container.reset();
}

export { container };
