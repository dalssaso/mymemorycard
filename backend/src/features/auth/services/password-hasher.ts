import bcrypt from "bcryptjs";
import { injectable } from "tsyringe";
import type { IPasswordHasher } from "./password-hasher.interface";

/**
 * Configuration for bcrypt password hashing.
 * - saltRounds: Number of rounds for bcrypt salt generation (default: 10)
 *   Higher values increase security but also increase computation time.
 *   Recommended range: 10-12 for production, can use 8-10 for development.
 */
interface PasswordHasherConfig {
  saltRounds?: number;
}

@injectable()
export class PasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(config?: PasswordHasherConfig) {
    // Read from config, environment variable, or use default
    const configSaltRounds = config?.saltRounds;
    const envSaltRounds = process.env.BCRYPT_SALT_ROUNDS
      ? parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
      : undefined;

    // Priority: config > environment > default
    this.saltRounds = configSaltRounds ?? envSaltRounds ?? 10;

    // Validate salt rounds are in reasonable range
    if (this.saltRounds < 4 || this.saltRounds > 31) {
      throw new Error(
        `Invalid BCRYPT_SALT_ROUNDS: ${this.saltRounds}. Must be between 4 and 31.`
      );
    }
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
