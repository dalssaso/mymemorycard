import jwt, { type SignOptions } from "jsonwebtoken";
import { injectable, inject } from "tsyringe";
import type { IConfig } from "@/infrastructure/config/config.interface";
import { CONFIG_TOKEN } from "@/container/tokens";
import type { ITokenService, JWTPayload } from "./token.service.interface";

/**
 * Type guard to validate JWT payload has required fields
 */
function isValidJWTPayload(decoded: unknown): decoded is JWTPayload {
  return (
    typeof decoded === "object" &&
    decoded !== null &&
    "userId" in decoded &&
    typeof decoded.userId === "string" &&
    "username" in decoded &&
    typeof decoded.username === "string"
  );
}

@injectable()
export class TokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(@inject(CONFIG_TOKEN) config: IConfig) {
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
  }

  generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, this.secret, {
      algorithm: "HS256",
      expiresIn: this.expiresIn,
    } as SignOptions);
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret, {
        algorithms: ["HS256"],
      });

      if (!isValidJWTPayload(decoded)) {
        return null;
      }

      return {
        userId: decoded.userId,
        username: decoded.username,
      };
    } catch {
      return null;
    }
  }
}
