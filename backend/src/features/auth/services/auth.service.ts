import { injectable, inject } from "tsyringe";
import type { IAuthService, AuthResult } from "./auth.service.interface";
import type { IUserRepository, User } from "../repositories/user.repository.interface";
import type { IPasswordHasher } from "./password-hasher.interface";
import type { ITokenService } from "./token.service.interface";
import { ConflictError, UnauthorizedError } from "@/shared/errors/base";
import { Logger } from "@/infrastructure/logging/logger";
import { MetricsService } from "@/infrastructure/metrics/metrics";

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("IPasswordHasher") private passwordHasher: IPasswordHasher,
    @inject("ITokenService") private tokenService: ITokenService,
    @inject(Logger) private logger: Logger,
    @inject(MetricsService) private metrics: MetricsService
  ) {
    this.logger = logger.child("AuthService");
  }

  async register(username: string, email: string, password: string): Promise<AuthResult> {
    this.logger.debug("Attempting user registration");

    // Input validation is performed by RegisterRequestSchema in the controller
    const exists = await this.userRepo.exists(username);
    if (exists) {
      this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
      throw new ConflictError(`User ${username} already exists`);
    }

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
      // Handle TOCTOU race condition: userRepo.create() may throw ConflictError
      // even though exists() passed (another request could have created the user)
      if (error instanceof ConflictError) {
        this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
        throw error;
      }

      // Handle all other creation errors (database issues, etc.)
      if (error instanceof Error) {
        this.logger.error("Failed to create user", error.message);
        this.logger.debug("User creation error details", error.message);
      }

      this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
      throw error;
    }
  }

  async login(username: string, password: string): Promise<AuthResult> {
    this.logger.debug("Attempting user login");

    const user = await this.userRepo.findByUsername(username);

    if (!user) {
      this.metrics.authAttemptsTotal.inc({ type: "login", success: "false" });
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await this.passwordHasher.compare(password, user.passwordHash);

    if (!isValid) {
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
    const payload = this.tokenService.verifyToken(token);

    if (!payload) {
      return null;
    }

    return this.userRepo.findById(payload.userId);
  }
}
