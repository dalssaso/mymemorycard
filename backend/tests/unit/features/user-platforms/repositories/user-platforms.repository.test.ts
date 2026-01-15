import 'reflect-metadata'
import { beforeEach, describe, expect, it } from 'bun:test'
import type { IUserPlatformsRepository } from '@/features/user-platforms/repositories/user-platforms.repository.interface'
import type {
  CreateUserPlatformInput,
  UpdateUserPlatformInput,
  UserPlatform,
} from '@/features/user-platforms/types'
import { ConflictError, NotFoundError } from '@/shared/errors/base'

const createMockRepository = (): IUserPlatformsRepository => ({
  findById: async () => null,
  findByUserId: async () => [],
  findByUserAndPlatform: async () => null,
  create: async (
    userId: string,
    data: CreateUserPlatformInput
  ): Promise<UserPlatform> => ({
    id: 'mock-id',
    userId,
    platformId: data.platformId,
    username: data.username ?? null,
    iconUrl: data.iconUrl ?? null,
    profileUrl: data.profileUrl ?? null,
    notes: data.notes ?? null,
    createdAt: new Date(),
  }),
  update: async (
    id: string,
    data: UpdateUserPlatformInput
  ): Promise<UserPlatform> => ({
    id,
    userId: 'mock-user-id',
    platformId: 'mock-platform-id',
    username: data.username ?? null,
    iconUrl: data.iconUrl ?? null,
    profileUrl: data.profileUrl ?? null,
    notes: data.notes ?? null,
    createdAt: new Date(),
  }),
  delete: async () => {},
  deleteByUserId: async () => {},
})

describe('IUserPlatformsRepository', () => {
  let repository: IUserPlatformsRepository

  beforeEach(() => {
    repository = createMockRepository()
  })

  describe('findById', () => {
    it('should be callable with id parameter', async () => {
      const result = await repository.findById('test-id')
      expect(result).toBeNull()
    })

    it('should return UserPlatform or null', async () => {
      const result = await repository.findById('test-id')
      expect(result === null || typeof result === 'object').toBe(true)
    })
  })

  describe('findByUserId', () => {
    it('should be callable with userId parameter', async () => {
      const result = await repository.findByUserId('user-1')
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return array of UserPlatforms', async () => {
      const result = await repository.findByUserId('user-1')
      expect(result).toHaveLength(0)
    })
  })

  describe('findByUserAndPlatform', () => {
    it('should be callable with userId and platformId', async () => {
      const result = await repository.findByUserAndPlatform('user-1', 'steam')
      expect(result).toBeNull()
    })

    it('should return UserPlatform or null', async () => {
      const result = await repository.findByUserAndPlatform('user-1', 'steam')
      expect(result === null || typeof result === 'object').toBe(true)
    })
  })

  describe('create', () => {
    it('should be callable with userId and CreateUserPlatformInput', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'steam',
      }
      const result = await repository.create('user-1', input)
      expect(result).toBeDefined()
    })

    it('should return UserPlatform with correct properties', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'steam',
        username: 'testuser',
      }
      const result = await repository.create('user-1', input)
      expect(result.id).toBeDefined()
      expect(result.userId).toBe('user-1')
      expect(result.platformId).toBe('steam')
    })

    it('should accept partial CreateUserPlatformInput', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'psn',
      }
      const result = await repository.create('user-2', input)
      expect(result).toBeDefined()
      expect(result.platformId).toBe('psn')
    })
  })

  describe('update', () => {
    it('should be callable with id and UpdateUserPlatformInput', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'newuser',
      }
      const result = await repository.update('up-1', input)
      expect(result).toBeDefined()
    })

    it('should return UserPlatform with updated properties', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'updated',
      }
      const result = await repository.update('up-1', input)
      expect(result.username).toBe('updated')
    })

    it('should handle empty UpdateUserPlatformInput', async () => {
      const input: UpdateUserPlatformInput = {}
      const result = await repository.update('up-1', input)
      expect(result).toBeDefined()
    })
  })

  describe('delete', () => {
    it('should be callable with id parameter', async () => {
      const result = await repository.delete('up-1')
      expect(result === undefined || result === null).toBe(true)
    })

    it('should return void or null', async () => {
      const result = await repository.delete('up-1')
      expect(result).toBeUndefined()
    })
  })

  describe('deleteByUserId', () => {
    it('should be callable with userId parameter', async () => {
      const result = await repository.deleteByUserId('user-1')
      expect(result === undefined || result === null).toBe(true)
    })

    it('should return void or null', async () => {
      const result = await repository.deleteByUserId('user-1')
      expect(result).toBeUndefined()
    })
  })
})
