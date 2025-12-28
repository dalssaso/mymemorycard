import crypto from 'crypto'
import { config } from '@/config'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

// Derive 32-byte key from JWT secret using scrypt
const KEY = crypto.scryptSync(config.jwt.secret, 'salt', 32)

/**
 * Encrypts a string using AES-256-GCM
 * Returns format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts a string encrypted with encrypt()
 * Expects format: iv:authTag:encryptedData (all hex-encoded)
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format')
  }

  const [ivHex, authTagHex, encrypted] = parts

  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}
