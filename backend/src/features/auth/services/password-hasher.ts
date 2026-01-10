import * as bcrypt from "bcryptjs";
import { injectable, inject } from "tsyringe";
import type { IPasswordHasher } from "./password-hasher.interface";
import type { IConfig } from "@/infrastructure/config/config.interface";

@injectable()
export class PasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(@inject("IConfig") config: IConfig) {
    const saltRounds = config.bcrypt.saltRounds;

    // Validate saltRounds is a number
    if (typeof saltRounds !== "number") {
      throw new Error(
        `Invalid bcrypt saltRounds in IConfig: expected number, got ${typeof saltRounds}`
      );
    }

    // Validate saltRounds is within safe range (10-12 recommended, 4-31 allowed by bcrypt)
    const MIN_SALT_ROUNDS = 4;
    const MAX_SALT_ROUNDS = 31;
    if (saltRounds < MIN_SALT_ROUNDS || saltRounds > MAX_SALT_ROUNDS) {
      throw new Error(
        `Invalid bcrypt saltRounds in IConfig: ${saltRounds} is outside allowed range [${MIN_SALT_ROUNDS}-${MAX_SALT_ROUNDS}]`
      );
    }

    this.saltRounds = saltRounds;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
