import 'reflect-metadata'
import { container } from 'tsyringe'
import { db } from '@/infrastructure/database/connection'
import type { DrizzleDB } from '@/infrastructure/database/connection'

// Infrastructure
import { Logger } from '@/infrastructure/logging/logger'
import { MetricsService } from '@/infrastructure/metrics/metrics'

// Auth - Repositories
import { PostgresUserRepository } from '@/features/auth/repositories/user.repository'
import type { IUserRepository } from '@/features/auth/repositories/user.repository.interface'

// Auth - Services
import { PasswordHasher } from '@/features/auth/services/password-hasher'
import { TokenService } from '@/features/auth/services/token.service'
import { AuthService } from '@/features/auth/services/auth.service'
import type { IPasswordHasher } from '@/features/auth/services/password-hasher.interface'
import type { ITokenService } from '@/features/auth/services/token.service.interface'
import type { IAuthService } from '@/features/auth/services/auth.service.interface'

// Auth - Controllers
import { AuthController } from '@/features/auth/controllers/auth.controller'

/**
 * Register all dependencies for the application.
 * Called once at application startup.
 */
export function registerDependencies(): void {
  // Infrastructure - Singletons
  container.register<DrizzleDB>('Database', {
    useValue: db,
  })

  container.register(Logger, {
    useFactory: () => new Logger(),
  })
  container.registerSingleton(MetricsService)

  // Auth Domain - Repositories
  container.register<IUserRepository>('IUserRepository', {
    useClass: PostgresUserRepository,
  })

  // Auth Domain - Services
  container.register<IPasswordHasher>('IPasswordHasher', {
    useClass: PasswordHasher,
  })

  container.register<ITokenService>('ITokenService', {
    useClass: TokenService,
  })

  container.register<IAuthService>('IAuthService', {
    useClass: AuthService,
  })

  // Auth Domain - Controllers
  container.register('AuthController', {
    useClass: AuthController,
  })
}

/**
 * Reset container (useful for testing)
 */
export function resetContainer(): void {
  container.clearInstances()
}

export { container }
