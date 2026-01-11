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

// AI - Repositories
import { AiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository";
import { EmbeddingRepository } from "@/features/ai/repositories/embedding.repository";
import type { IAiSettingsRepository } from "@/features/ai/repositories/ai-settings.repository.interface";
import type { IEmbeddingRepository } from "@/features/ai/repositories/embedding.repository.interface";

// AI - Services
import { GatewayService } from "@/features/ai/services/gateway.service";
import { EmbeddingService } from "@/features/ai/services/embedding.service";
import { CuratorService } from "@/features/ai/services/curator.service";
import { ImageService } from "@/features/ai/services/image.service";
import type { IGatewayService } from "@/features/ai/services/gateway.service.interface";
import type { IEmbeddingService } from "@/features/ai/services/embedding.service.interface";
import type { ICuratorService } from "@/features/ai/services/curator.service.interface";
import type { IImageService } from "@/features/ai/services/image.service.interface";

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

  // Logger singleton - optional context parameter handled by constructor
  container.registerSingleton(Logger);
  container.registerSingleton(MetricsService);

  // Auth Domain - Repositories
  container.registerSingleton<IUserRepository>("IUserRepository", PostgresUserRepository);

  // Auth Domain - Services
  container.registerSingleton<IPasswordHasher>("IPasswordHasher", PasswordHasher);
  container.registerSingleton<ITokenService>("ITokenService", TokenService);
  container.registerSingleton<IAuthService>("IAuthService", AuthService);

  // Auth Domain - Controllers
  container.registerSingleton<IAuthController>("IAuthController", AuthController);

  // AI Domain - Repositories
  container.registerSingleton<IAiSettingsRepository>("IAiSettingsRepository", AiSettingsRepository);
  container.registerSingleton<IEmbeddingRepository>("IEmbeddingRepository", EmbeddingRepository);

  // AI Domain - Services
  container.registerSingleton<IGatewayService>("IGatewayService", GatewayService);
  container.registerSingleton<IEmbeddingService>("IEmbeddingService", EmbeddingService);
  container.registerSingleton<ICuratorService>("ICuratorService", CuratorService);
  container.registerSingleton<IImageService>("IImageService", ImageService);
}

/**
 * Reset container (useful for testing)
 * Clears all registrations and instances
 */
export function resetContainer(): void {
  container.reset();
}

export { container };
