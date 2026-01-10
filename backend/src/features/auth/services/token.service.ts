import jwt from "jsonwebtoken";
import { injectable } from "tsyringe";
import type { ITokenService, JWTPayload } from "./token.service.interface";

@injectable()
export class TokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn = "7d";

  constructor() {
    this.secret = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
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
