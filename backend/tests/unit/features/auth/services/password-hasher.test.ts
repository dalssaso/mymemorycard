import 'reflect-metadata'
import { describe, it, expect } from 'bun:test'
import { PasswordHasher } from '@/features/auth/services/password-hasher'

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher()

  it('should hash password', async () => {
    const password = 'SecurePassword123!'
    const hash = await hasher.hash(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(20)
  })

  it('should compare password with hash correctly', async () => {
    const password = 'SecurePassword123!'
    const hash = await hasher.hash(password)

    const isValid = await hasher.compare(password, hash)
    expect(isValid).toBe(true)
  })

  it('should return false for invalid password', async () => {
    const password = 'SecurePassword123!'
    const hash = await hasher.hash(password)

    const isValid = await hasher.compare('WrongPassword', hash)
    expect(isValid).toBe(false)
  })
})
