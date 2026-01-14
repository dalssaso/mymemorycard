import "reflect-metadata";
import { container } from "tsyringe";
import {
  AUTH_CONTROLLER_TOKEN,
  AUTH_SERVICE_TOKEN,
  CONFIG_TOKEN,
  DATABASE_TOKEN,
  PASSWORD_HASHER_TOKEN,
  PLATFORM_CONTROLLER_TOKEN,
  PLATFORM_REPOSITORY_TOKEN,
  PLATFORM_SERVICE_TOKEN,
  TOKEN_SERVICE_TOKEN,
  USER_REPOSITORY_TOKEN,
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
}

/**
 * Reset container (useful for testing)
 * Clears all registrations and instances
 */
export function resetContainer(): void {
  container.reset();
}

export { container };
