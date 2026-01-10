import "reflect-metadata";
import { container } from "tsyringe";
import { DatabaseConnection } from "@/infrastructure/database/connection";
import type { DrizzleDB } from "@/infrastructure/database/connection";

// Config
import { Config } from "@/infrastructure/config/config";
import type { IConfig } from "@/infrastructure/config/config.interface";

// Infrastructure
import { Logger } from "@/infrastructure/logging/logger";
import { MetricsService } from "@/infrastructure/metrics/metrics";

// Singleton Logger instance
let loggerInstance: Logger | null = null;

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

/**
 * Register all dependencies for the application.
 * Called once at application startup.
 */
export function registerDependencies(): void {
  // Config first - validates env vars immediately at startup
  container.registerSingleton<IConfig>("IConfig", Config);

  // Infrastructure - Singletons
  container.registerSingleton(DatabaseConnection);

  // Register DrizzleDB from DatabaseConnection instance
  container.register<DrizzleDB>("Database", {
    useFactory: (container) => container.resolve(DatabaseConnection).db,
  });

  // Logger uses factory with manual singleton caching
  // (TSyringe can't inject optional constructor parameters with registerSingleton)
  container.register<Logger>(Logger, {
    useFactory: (): Logger => {
      if (!loggerInstance) {
        loggerInstance = new Logger();
      }
      return loggerInstance;
    },
  });
  container.registerSingleton(MetricsService);

  // Auth Domain - Repositories
  container.registerSingleton<IUserRepository>("IUserRepository", PostgresUserRepository);

  // Auth Domain - Services
  container.registerSingleton<IPasswordHasher>("IPasswordHasher", PasswordHasher);
  container.registerSingleton<ITokenService>("ITokenService", TokenService);
  container.registerSingleton<IAuthService>("IAuthService", AuthService);

  // Auth Domain - Controllers
  container.registerSingleton<AuthController>("AuthController", AuthController);
}

/**
 * Reset container (useful for testing)
 * Clears both registrations and instances, including the cached Logger singleton
 */
export function resetContainer(): void {
  loggerInstance = null;
  container.reset();
}

export { container };
