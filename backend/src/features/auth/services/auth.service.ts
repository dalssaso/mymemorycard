import { injectable, inject } from 'tsyringe'
import type { IAuthService, AuthResult } from './auth.service.interface'
import type { IUserRepository } from '../repositories/user.repository.interface'
import type { IPasswordHasher } from './password-hasher.interface'
import type { ITokenService } from './token.service.interface'
import { ValidationError, ConflictError, UnauthorizedError } from '@/shared/errors/base'
import { Logger } from '@/infrastructure/logging/logger'
import { MetricsService } from '@/infrastructure/metrics/metrics'
import type { InferSelectModel } from 'drizzle-orm'
import { users } from '@/db/schema'

type User = InferSelectModel<typeof users>

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject('IUserRepository') private userRepo: IUserRepository,
    @inject('IPasswordHasher') private passwordHasher: IPasswordHasher,
    @inject('ITokenService') private tokenService: ITokenService,
    private logger: Logger,
    private metrics: MetricsService
  ) {
    this.logger = logger.child('AuthService')
  }

  async register(username: string, email: string, password: string): Promise<AuthResult> {
    this.logger.info('Attempting user registration', username)

    if (!username || !email || !password) {
      throw new ValidationError('Username, email, and password are required')
    }

    const exists = await this.userRepo.exists(username)
    if (exists) {
      this.metrics.authAttemptsTotal.inc({ type: 'register', success: 'false' })
      throw new ConflictError(`User ${username} already exists`)
    }

    const hash = await this.passwordHasher.hash(password)
    const user = await this.userRepo.create(username, email, hash)

    const token = this.tokenService.generateToken({
      userId: user.id,
      username: user.username,
    })

    this.logger.info('User registered successfully', user.id)
    this.metrics.authAttemptsTotal.inc({ type: 'register', success: 'true' })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    this.logger.info('Attempting user login', username)

    const user = await this.userRepo.findByUsername(username)

    if (!user) {
      this.metrics.authAttemptsTotal.inc({ type: 'login', success: 'false' })
      throw new UnauthorizedError('Invalid credentials')
    }

    const isValid = await this.passwordHasher.compare(password, user.passwordHash)

    if (!isValid) {
      this.metrics.authAttemptsTotal.inc({ type: 'login', success: 'false' })
      throw new UnauthorizedError('Invalid credentials')
    }

    const token = this.tokenService.generateToken({
      userId: user.id,
      username: user.username,
    })

    this.logger.info('User logged in successfully', user.id)
    this.metrics.authAttemptsTotal.inc({ type: 'login', success: 'true' })

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    }
  }

  async validateToken(token: string): Promise<User | null> {
    const payload = this.tokenService.verifyToken(token)

    if (!payload) {
      return null
    }

    return this.userRepo.findById(payload.userId)
  }
}
