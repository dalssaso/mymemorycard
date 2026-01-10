import jwt from "jsonwebtoken";
import { injectable, inject } from "tsyringe";
import type { IConfig } from "@/infrastructure/config/config.interface";
import type { ITokenService, JWTPayload } from "./token.service.interface";

@injectable()
export class TokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn = "7d";

  constructor(@inject("IConfig") config: IConfig) {
    this.secret = config.jwt.secret;
  }

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as JWTPayload;
      return {
        userId: decoded.userId,
        username: decoded.username,
      };
    } catch {
      return null;
    }
  }
}
