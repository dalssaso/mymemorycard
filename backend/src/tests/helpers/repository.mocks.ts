import { mock } from 'bun:test'
import type { IUserRepository } from '@/features/auth/repositories/user.repository.interface'
import type { IPasswordHasher } from '@/features/auth/services/password-hasher.interface'
import type { ITokenService } from '@/features/auth/services/token.service.interface'
import type { InferSelectModel } from 'drizzle-orm'
import { type users } from '@/db/schema'

type User = InferSelectModel<typeof users>

export function createMockUserRepository(
  overrides?: Partial<IUserRepository>
): IUserRepository {
  return {
    findByUsername: mock().mockResolvedValue(null),
    findById: mock().mockResolvedValue(null),
    create: mock().mockImplementation(
      async (username: string, email: string, passwordHash: string) => ({
        id: 'test-user-id',
        username,
        email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ),
    exists: mock().mockResolvedValue(false),
    ...overrides,
  }
}

export function createMockPasswordHasher(
  overrides?: Partial<IPasswordHasher>
): IPasswordHasher {
  return {
    hash: mock().mockImplementation(async (password: string) => `hashed_${password}`),
    compare: mock().mockImplementation(
      async (password: string, hash: string) => hash === `hashed_${password}`
    ),
    ...overrides,
  }
}

export function createMockTokenService(overrides?: Partial<ITokenService>): ITokenService {
  return {
    generateToken: mock().mockImplementation((payload) => `token_${payload.userId}`),
    verifyToken: mock().mockImplementation((token) => {
      if (token.startsWith('token_')) {
        const userId = token.replace('token_', '')
        return { userId, username: 'testuser' }
      }
      return null
    }),
    ...overrides,
  }
}

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    username: 'testuser',
    email: 'testuser@users.mymemorycard.local',
    passwordHash: 'hashed_password123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}
