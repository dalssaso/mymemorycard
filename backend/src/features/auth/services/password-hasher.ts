import * as bcrypt from "bcryptjs";
import { injectable, inject } from "tsyringe";
import type { IPasswordHasher } from "./password-hasher.interface";
import type { IConfig } from "@/infrastructure/config/config.interface";

@injectable()
export class PasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(@inject("IConfig") config: IConfig) {
    this.saltRounds = config.bcrypt.saltRounds;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
