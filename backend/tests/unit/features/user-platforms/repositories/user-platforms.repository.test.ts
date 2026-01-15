import 'reflect-metadata'
import { beforeEach, describe, expect, it } from 'bun:test'
import type {
  IUserPlatformsRepository,
} from '@/features/user-platforms/repositories/user-platforms.repository.interface'
import type {
  CreateUserPlatformInput,
  UpdateUserPlatformInput,
  UserPlatform,
} from '@/features/user-platforms/types'
import { ConflictError, NotFoundError } from '@/shared/errors/base'

// Mock repository for unit testing
const createMockRepository = (): IUserPlatformsRepository => ({
  async findById(id: string): Promise<UserPlatform | null> {
    if (id === 'test-user-platform-1') {
      return {
        id: 'test-user-platform-1',
        userId: 'test-user-1',
        platformId: 'test-platform-1',
        username: 'testuser' as string | null,
        iconUrl: 'https://example.com/icon.png' as string | null,
        profileUrl: 'https://example.com/profile' as string | null,
        notes: 'Test notes' as string | null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      }
    }
    return null
  },

  async findByUserId(userId: string): Promise<UserPlatform[]> {
    if (userId === 'test-user-1') {
      return [
        {
          id: 'test-user-platform-1',
          userId: 'test-user-1',
          platformId: 'test-platform-1',
          username: 'testuser1' as string | null,
          iconUrl: 'https://example.com/icon1.png' as string | null,
          profileUrl: 'https://example.com/profile1' as string | null,
          notes: 'Test notes 1' as string | null,
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        {
          id: 'test-user-platform-2',
          userId: 'test-user-1',
          platformId: 'test-platform-2',
          username: 'testuser2' as string | null,
          iconUrl: 'https://example.com/icon2.png' as string | null,
          profileUrl: 'https://example.com/profile2' as string | null,
          notes: 'Test notes 2' as string | null,
          createdAt: new Date('2024-01-02T00:00:00Z'),
        },
      ]
    }
    return []
  },

  async findByUserAndPlatform(
    userId: string,
    platformId: string
  ): Promise<UserPlatform | null> {
    if (userId === 'test-user-1' && platformId === 'test-platform-1') {
      return {
        id: 'test-user-platform-1',
        userId: 'test-user-1',
        platformId: 'test-platform-1',
        username: 'testuser' as string | null,
        iconUrl: 'https://example.com/icon.png' as string | null,
        profileUrl: 'https://example.com/profile' as string | null,
        notes: 'Test notes' as string | null,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      }
    }
    return null
  },

  async create(
    userId: string,
    data: CreateUserPlatformInput
  ): Promise<UserPlatform> {
    // Simulate conflict error for duplicate entries
    if (userId === 'duplicate-user' && data.platformId === 'duplicate-platform') {
      throw new ConflictError(
        `User platform already exists for user ${userId} and platform ${data.platformId}`
      )
    }

    return {
      id: 'new-user-platform-id',
      userId,
      platformId: data.platformId,
      username: (data.username ?? null) as string | null,
      iconUrl: (data.iconUrl ?? null) as string | null,
      profileUrl: (data.profileUrl ?? null) as string | null,
      notes: (data.notes ?? null) as string | null,
      createdAt: new Date(),
    }
  },

  async update(
    id: string,
    data: UpdateUserPlatformInput
  ): Promise<UserPlatform> {
    if (id === 'nonexistent-id') {
      throw new NotFoundError('UserPlatform', id)
    }

    return {
      id,
      userId: 'test-user-1',
      platformId: 'test-platform-1',
      username: (data.username ?? null) as string | null,
      iconUrl: (data.iconUrl ?? null) as string | null,
      profileUrl: (data.profileUrl ?? null) as string | null,
      notes: (data.notes ?? null) as string | null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    }
  },

  async delete(id: string): Promise<void> {
    if (id === 'nonexistent-id') {
      throw new NotFoundError('UserPlatform', id)
    }
  },

  async deleteByUserId(userId: string): Promise<void> {
    if (userId === 'nonexistent-user') {
      throw new NotFoundError('User', userId)
    }
  },
})

describe('UserPlatformsRepository', () => {
  let repository: IUserPlatformsRepository

  beforeEach(() => {
    repository = createMockRepository()
  })

  // ========================================
  // Tests for create method
  // ========================================

  describe('create', () => {
    it('should create a user-platform with all fields', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'steam',
        username: 'steampunk',
        iconUrl: 'https://example.com/steam-icon.png',
        profileUrl: 'https://example.com/steam-profile',
        notes: 'My Steam account',
      }

      const result = await repository.create('user-1', input)

      expect(result).toBeTruthy()
      expect(result.userId).toBe('user-1')
      expect(result.platformId).toBe('steam')
      expect(result.username).toBe('steampunk')
      expect(result.iconUrl).toBe('https://example.com/steam-icon.png')
      expect(result.profileUrl).toBe('https://example.com/steam-profile')
      expect(result.notes).toBe('My Steam account')
      expect(result.createdAt).toBeTruthy()
    })

    it('should create a user-platform with minimal fields', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'psn',
      }

      const result = await repository.create('user-2', input)

      expect(result).toBeTruthy()
      expect(result.userId).toBe('user-2')
      expect(result.platformId).toBe('psn')
      expect(result.username).toBeNull()
      expect(result.iconUrl).toBeNull()
      expect(result.profileUrl).toBeNull()
      expect(result.notes).toBeNull()
      expect(result.createdAt).toBeTruthy()
    })

    it('should set createdAt timestamp on creation', async () => {
      const before = new Date()
      const input: CreateUserPlatformInput = {
        platformId: 'xbox',
      }

      const result = await repository.create('user-3', input)
      const after = new Date()

      expect(result.createdAt).toBeTruthy()
      if (result.createdAt) {
        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 100)
      }
    })

    it('should throw ConflictError for duplicate user-platform', async () => {
      const input: CreateUserPlatformInput = {
        platformId: 'duplicate-platform',
      }

      try {
        await repository.create('duplicate-user', input)
        expect.unreachable('Should have thrown ConflictError')
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictError)
        expect(error instanceof ConflictError && error.statusCode).toBe(409)
      }
    }
    )
  })

  // ========================================
  // Tests for findByUserId method
  // ========================================

  describe('findByUserId', () => {
    it('should find all platforms for a user', async () => {
      const result = await repository.findByUserId('test-user-1')

      expect(result).toHaveLength(2)
      expect(result[0].userId).toBe('test-user-1')
      expect(result[1].userId).toBe('test-user-1')
    })

    it('should return empty array for user with no platforms', async () => {
      const result = await repository.findByUserId('test-user-no-platforms')

      expect(result).toHaveLength(0)
      expect(Array.isArray(result)).toBe(true)
    })

    it('should return platforms with all properties', async () => {
      const result = await repository.findByUserId('test-user-1')

      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('userId')
      expect(result[0]).toHaveProperty('platformId')
      expect(result[0]).toHaveProperty('username')
      expect(result[0]).toHaveProperty('iconUrl')
      expect(result[0]).toHaveProperty('profileUrl')
      expect(result[0]).toHaveProperty('notes')
      expect(result[0]).toHaveProperty('createdAt')
    })
  })

  // ========================================
  // Tests for findByUserAndPlatform method
  // ========================================

  describe('findByUserAndPlatform', () => {
    it('should find user-platform by user and platform id', async () => {
      const result = await repository.findByUserAndPlatform(
        'test-user-1',
        'test-platform-1'
      )

      expect(result).toBeTruthy()
      expect(result?.userId).toBe('test-user-1')
      expect(result?.platformId).toBe('test-platform-1')
    })

    it('should return null if user-platform does not exist', async () => {
      const result = await repository.findByUserAndPlatform(
        'nonexistent-user',
        'nonexistent-platform'
      )

      expect(result).toBeNull()
    })

    it('should return user-platform with all properties', async () => {
      const result = await repository.findByUserAndPlatform(
        'test-user-1',
        'test-platform-1'
      )

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('platformId')
      expect(result).toHaveProperty('username')
      expect(result).toHaveProperty('iconUrl')
      expect(result).toHaveProperty('profileUrl')
      expect(result).toHaveProperty('notes')
      expect(result).toHaveProperty('createdAt')
    })
  })

  // ========================================
  // Tests for findById method
  // ========================================

  describe('findById', () => {
    it('should find user-platform by id', async () => {
      const result = await repository.findById('test-user-platform-1')

      expect(result).toBeTruthy()
      expect(result?.id).toBe('test-user-platform-1')
      expect(result?.userId).toBe('test-user-1')
      expect(result?.platformId).toBe('test-platform-1')
    })

    it('should return null if id does not exist', async () => {
      const result = await repository.findById('nonexistent-id')

      expect(result).toBeNull()
    })

    it('should return user-platform with all properties', async () => {
      const result = await repository.findById('test-user-platform-1')

      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('platformId')
      expect(result).toHaveProperty('username')
      expect(result).toHaveProperty('iconUrl')
      expect(result).toHaveProperty('profileUrl')
      expect(result).toHaveProperty('notes')
      expect(result).toHaveProperty('createdAt')
    })
  })

  // ========================================
  // Tests for update method
  // ========================================

  describe('update', () => {
    it('should update user-platform with new username', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'newusername',
      }

      const result = await repository.update('test-user-platform-1', input)

      expect(result).toBeTruthy()
      expect(result.id).toBe('test-user-platform-1')
      expect(result.username).toBe('newusername')
    })

    it('should update user-platform with new profile url', async () => {
      const input: UpdateUserPlatformInput = {
        profileUrl: 'https://example.com/new-profile',
      }

      const result = await repository.update('test-user-platform-1', input)

      expect(result).toBeTruthy()
      expect(result.profileUrl).toBe('https://example.com/new-profile')
    })

    it('should update user-platform with multiple fields', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'updated',
        iconUrl: 'https://example.com/new-icon.png',
        notes: 'Updated notes',
      }

      const result = await repository.update('test-user-platform-1', input)

      expect(result).toBeTruthy()
      expect(result.username).toBe('updated')
      expect(result.iconUrl).toBe('https://example.com/new-icon.png')
      expect(result.notes).toBe('Updated notes')
    })

    it('should throw NotFoundError if user-platform does not exist', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'test',
      }

      try {
        await repository.update('nonexistent-id', input)
        expect.unreachable('Should have thrown NotFoundError')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error instanceof NotFoundError && error.statusCode).toBe(404)
      }
    }
    )

    it('should preserve userId and platformId on update', async () => {
      const input: UpdateUserPlatformInput = {
        username: 'updated',
      }

      const result = await repository.update('test-user-platform-1', input)

      expect(result.userId).toBe('test-user-1')
      expect(result.platformId).toBe('test-platform-1')
    })
  })

  // ========================================
  // Tests for delete method
  // ========================================

  describe('delete', () => {
    it('should delete user-platform by id', async () => {
      await expect(repository.delete('test-user-platform-1')).resolves.toBeUndefined()
    })

    it('should throw NotFoundError if user-platform does not exist', async () => {
      try {
        await repository.delete('nonexistent-id')
        expect.unreachable('Should have thrown NotFoundError')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error instanceof NotFoundError && error.statusCode).toBe(404)
      }
    }
    )
  })

  // ========================================
  // Tests for deleteByUserId method
  // ========================================

  describe('deleteByUserId', () => {
    it('should delete all platforms for a user', async () => {
      await expect(repository.deleteByUserId('test-user-1')).resolves.toBeUndefined()
    })

    it('should throw NotFoundError if user does not exist', async () => {
      try {
        await repository.deleteByUserId('nonexistent-user')
        expect.unreachable('Should have thrown NotFoundError')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect(error instanceof NotFoundError && error.statusCode).toBe(404)
      }
    }
    )

    it('should resolve without error if user has no platforms', async () => {
      await expect(repository.deleteByUserId('user-no-platforms')).resolves.toBeUndefined()
    })
  })
})
