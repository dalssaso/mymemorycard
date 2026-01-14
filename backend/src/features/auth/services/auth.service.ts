import { injectable, inject } from "tsyringe";
import type { IAuthService, AuthResult } from "./auth.service.interface";
import type { IUserRepository, User } from "../repositories/user.repository.interface";
import type { IPasswordHasher } from "./password-hasher.interface";
import type { ITokenService } from "./token.service.interface";
import { ConflictError, UnauthorizedError } from "@/shared/errors/base";
import { Logger } from "@/infrastructure/logging/logger";
import { MetricsService } from "@/infrastructure/metrics/metrics";
import {
  PASSWORD_HASHER_TOKEN,
  TOKEN_SERVICE_TOKEN,
  USER_REPOSITORY_TOKEN,
} from "@/container/tokens";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(USER_REPOSITORY_TOKEN) private userRepo: IUserRepository,
    @inject(PASSWORD_HASHER_TOKEN) private passwordHasher: IPasswordHasher,
    @inject(TOKEN_SERVICE_TOKEN) private tokenService: ITokenService,
    @inject(Logger) private logger: Logger,
    @inject(MetricsService) private metrics: MetricsService
  ) {
    this.logger = logger.child("AuthService");
  }

  async register(username: string, email: string, password: string): Promise<AuthResult> {
    this.logger.debug("Attempting user registration");

    // Input validation is performed by RegisterRequestSchema in the controller
    const hash = await this.passwordHasher.hash(password);

    try {
      const user = await this.userRepo.create(username, email, hash);

      const token = this.tokenService.generateToken({
        userId: user.id,
        username: user.username,
      });

      this.logger.info("User registered successfully");
      this.metrics.authAttemptsTotal.inc({ type: "register", success: "true" });

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      };
    } catch (error) {
      // Handle duplicate username: userRepo.create() throws ConflictError
      // when username already exists (database constraint violation)
      if (error instanceof ConflictError) {
        this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
        throw error;
      }

      // Handle all other creation errors (database issues, etc.)
      if (error instanceof Error) {
        this.logger.error("Failed to create user", error.message);
        this.logger.debug("User creation error details", {
          message: error.message,
          stack: error.stack,
        });
      }

      this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
      throw error;
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    this.logger.debug("Attempting user login");

    const user = await this.userRepo.findByUsername(username);

    // Prevent timing attacks by always performing password comparison
    // If user doesn't exist, use a valid dummy hash so comparison maintains constant-time behavior
    // This is a valid bcrypt hash (60 chars) for a non-existent user
    const DUMMY_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMye/IgKXkI5wkXQJ6FblDj.nfUV8jLCr8G";
    const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;

    const isValid = await this.passwordHasher.compare(password, hashToCompare);

    // Return same error for both "user not found" and "wrong password"
    // to prevent username enumeration via timing analysis
    if (!user || !isValid) {
      this.metrics.authAttemptsTotal.inc({ type: "login", success: "false" });
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = this.tokenService.generateToken({
      userId: user.id,
      username: user.username,
    });

    this.logger.info("User logged in successfully");
    this.metrics.authAttemptsTotal.inc({ type: "login", success: "true" });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  async validateToken(token: string): Promise<User | null> {
    this.logger.debug("Validating token");

    try {
      const payload = this.tokenService.verifyToken(token);

      if (!payload) {
        this.logger.debug("Token verification failed - invalid or expired token");
        this.metrics.authAttemptsTotal.inc({
          type: "validateToken",
          success: "false",
        });
        return null;
      }

      const user = await this.userRepo.findById(payload.userId);

      if (!user) {
        this.logger.debug("User not found for validated token");
        this.metrics.authAttemptsTotal.inc({
          type: "validateToken",
          success: "false",
        });
        return null;
      }

      this.logger.debug("Token validation successful");
      this.metrics.authAttemptsTotal.inc({
        type: "validateToken",
        success: "true",
      });
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to validate token", message);
      this.metrics.authAttemptsTotal.inc({
        type: "validateToken",
        success: "false",
      });
      throw error;
    }
  }
}
