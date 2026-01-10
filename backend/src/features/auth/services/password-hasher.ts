import bcrypt from "bcryptjs";
import { injectable } from "tsyringe";
import type { IPasswordHasher } from "./password-hasher.interface";

@injectable()
export class PasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
