/**
 * Interface for credential encryption operations.
 * Uses AES-256-GCM for authenticated encryption.
 */
export interface IEncryptionService {
  /**
   * Encrypts data using AES-256-GCM.
   * Returns a base64-encoded string containing IV + auth tag + ciphertext.
   */
  encrypt(data: unknown): string;

  /**
   * Decrypts data encrypted by this service.
   * Returns the original data structure.
   * @throws Error if decryption fails (invalid key, tampered data, etc.)
   */
  decrypt<T = unknown>(encryptedData: string): T;
}
