import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { inject, injectable } from "tsyringe";
import { CONFIG_TOKEN } from "@/container/tokens";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type { IEncryptionService } from "./encryption.service.interface";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Scrypt parameters for key derivation.
 * N=32768 (2^15): CPU/memory cost parameter
 * r=8: Block size parameter
 * p=1: Parallelization parameter
 * These provide strong protection against brute-force attacks.
 */
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1 };

/**
 * Service for encrypting and decrypting sensitive credential data.
 * Uses AES-256-GCM with scrypt-derived keys for secure storage.
 */
@injectable()
export class EncryptionService implements IEncryptionService {
  private key: Buffer;

  constructor(@inject(CONFIG_TOKEN) config: IConfig) {
    this.key = scryptSync(
      config.encryption.secret,
      config.encryption.salt,
      KEY_LENGTH,
      SCRYPT_OPTIONS
    );
  }

  /**
   * Encrypts data using AES-256-GCM.
   * Returns a base64-encoded string containing IV + auth tag + ciphertext.
   */
  encrypt(data: unknown): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const plaintext = JSON.stringify(data);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

    const authTag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, authTag, encrypted]);

    return combined.toString("base64");
  }

  /**
   * Decrypts data encrypted by this service.
   * Returns the original data structure.
   * @throws Error if decryption fails (invalid key, tampered data, etc.)
   */
  decrypt<T = unknown>(encryptedData: string): T {
    const combined = Buffer.from(encryptedData, "base64");

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  }
}
