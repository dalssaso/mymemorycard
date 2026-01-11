import crypto from "crypto";
import { container } from "@/container";
import type { IConfig } from "@/infrastructure/config/config.interface";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

// Derive 32-byte key from encryption secret using scrypt
let KEY: Buffer | undefined;

/**
 * Initialize encryption key at startup
 */
export function initializeEncryptionKey(): void {
  const config = container.resolve<IConfig>("IConfig");
  KEY = crypto.scryptSync(config.encryption.secret, config.encryption.salt, 32);
}

/**
 * Get the encryption key (must call initializeEncryptionKey first)
 */
function getKey(): Buffer {
  if (!KEY) {
    throw new Error("Encryption key not initialized. Call initializeEncryptionKey first.");
  }
  return KEY;
}

/**
 * Reset encryption key (for testing)
 */
export function resetEncryptionKey(): void {
  KEY = undefined;
}

/**
 * Encrypts a string using AES-256-GCM
 * Returns format: iv:authTag:encryptedData (all hex-encoded)
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string encrypted with encrypt()
 * Expects format: iv:authTag:encryptedData (all hex-encoded)
 */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
