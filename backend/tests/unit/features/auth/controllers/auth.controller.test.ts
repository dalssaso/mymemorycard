import 'reflect-metadata'
import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { AuthController } from '@/features/auth/controllers/auth.controller'
import type { IAuthService } from '@/features/auth/services/auth.service.interface'
import { Logger } from '@/infrastructure/logging/logger'

describe('AuthController', () => {
  let controller: AuthController
  let mockAuthService: IAuthService
  let mockLogger: Logger

  beforeEach(() => {
    mockAuthService = {
      register: mock().mockResolvedValue({
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' },
        token: 'test-token',
      }),
      login: mock().mockResolvedValue({
        user: { id: 'user-123', username: 'testuser', email: 'test@example.com' },
        token: 'test-token',
      }),
      validateToken: mock().mockResolvedValue(null),
    }

    mockLogger = new Logger('AuthController')

    controller = new AuthController(mockAuthService, mockLogger)
  })

  it('should have router instance', () => {
    expect(controller.router).toBeDefined()
  })

  it('should create controller with injected dependencies', () => {
    expect(controller).toBeInstanceOf(AuthController)
  })
})
