# Phase 1: Auth Domain Migration - Implementation Plan

**Created**: 2026-01-09
**Status**: Ready for implementation
**Reference**: [DI Architecture Design](./2026-01-08-di-architecture-design.md)

## Overview

This plan provides task-by-task instructions for Phase 1: migrating the Auth domain to the new dependency injection architecture. This phase serves as the proof of concept for the entire backend refactoring effort.

## Goals

- Establish DI infrastructure with TSyringe
- Set up Hono framework alongside legacy router
- Implement Auth domain with full layer separation
- Achieve 90% unit test coverage for Auth domain
- Validate migration strategy with zero breaking changes
- Set up observability infrastructure (Pino logging, Prometheus metrics)

## Success Criteria

- [ ] All auth endpoints work identically to current implementation
- [ ] Unit tests run without PostgreSQL, Redis, or external services
- [ ] Integration tests validate full auth flow with real database
- [ ] Metrics exported at /metrics endpoint
- [ ] Structured logs include request IDs and user context
- [ ] Zero breaking changes to API contracts
- [ ] Lint and typecheck pass with zero warnings

## Prerequisites

- Docker PostgreSQL running on port 5433
- Docker Redis running on port 6380
- Bun 1.0+ installed
- Existing backend codebase at `backend/`

## Timeline

Estimated: 2 weeks (10 tasks)

## Tasks

### Task 1: Install Dependencies

**Goal**: Add all required npm packages for Phase 1

**Steps**:

1. Install core dependencies:

```bash
cd backend
bun add hono @hono/zod-openapi zod tsyringe reflect-metadata
bun add pino pino-pretty prom-client
bun add bcrypt jsonwebtoken
```

2. Install dev dependencies:

```bash
bun add -d @types/bcrypt @types/jsonwebtoken
```

3. Verify package.json includes all dependencies

4. Run `bun install` to ensure lockfile is updated

**Acceptance Criteria**:

- All packages installed without conflicts
- `bun run typecheck` passes
- No duplicate package versions

**Files Modified**:

- `backend/package.json`
- `backend/bun.lockb`

---

### Task 2: Project Structure Setup

**Goal**: Create new directory structure for DI architecture

**Steps**:

1. Create directories:

```bash
cd backend/src
mkdir -p features/auth/{controllers,services,repositories,dtos,errors}
mkdir -p infrastructure/{database,cache,http,logging,metrics}
mkdir -p shared/{errors,middleware,utils}
mkdir -p container
```

2. Verify structure matches design document:

```
src/
  features/
    auth/
      controllers/
      services/
      repositories/
      dtos/
      errors/
  infrastructure/
    database/
    cache/
    http/
    logging/
    metrics/
  shared/
    errors/
    middleware/
    utils/
  container/
```

**Acceptance Criteria**:

- All directories created
- Directory structure matches design document

**Files Created**:

- Directory structure only (no files yet)

---

### Task 3: Infrastructure Layer - Database

**Goal**: Create Drizzle database infrastructure with DI support

**Steps**:

1. Create `src/infrastructure/database/connection.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { injectable } from "tsyringe";

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

const queryClient = postgres(process.env.DATABASE_URL || "", {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(queryClient, { schema });

@injectable()
export class DatabaseConnection {
  public readonly db: DrizzleDB;

  constructor() {
    this.db = db;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }
}
```

2. Create `src/infrastructure/database/index.ts`:

```typescript
export { db, DatabaseConnection, type DrizzleDB } from "./connection";
```

3. Import schema types are properly exported from `src/db/schema.ts`

**Acceptance Criteria**:

- File compiles without errors
- `bun run typecheck` passes
- Exports match design document

**Files Created**:

- `src/infrastructure/database/connection.ts`
- `src/infrastructure/database/index.ts`

---

### Task 4: Infrastructure Layer - Logging

**Goal**: Set up Pino structured logging with request IDs

**Steps**:

1. Create `src/infrastructure/logging/logger.ts`:

```typescript
import pino from "pino";
import { injectable } from "tsyringe";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
});

@injectable()
export class Logger {
  constructor(private context?: string) {}

  child(context: string): Logger {
    return new Logger(context);
  }

  private log(level: string, message: string, ...args: unknown[]): void {
    const logObj = this.context ? { context: this.context } : {};
    logger[level as keyof typeof logger](logObj, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }
}
```

2. Create `src/infrastructure/logging/index.ts`:

```typescript
export { logger, Logger } from "./logger";
```

**Acceptance Criteria**:

- Logger creates pretty output in development
- Logger creates JSON output in production
- `bun run typecheck` passes

**Files Created**:

- `src/infrastructure/logging/logger.ts`
- `src/infrastructure/logging/index.ts`

---

### Task 5: Infrastructure Layer - Metrics

**Goal**: Set up Prometheus metrics collection

**Steps**:

1. Create `src/infrastructure/metrics/metrics.ts`:

```typescript
import { injectable } from "tsyringe";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

@injectable()
export class MetricsService {
  public readonly registry: Registry;

  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly dbQueryDuration: Histogram;
  public readonly authAttemptsTotal: Counter;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({ register: this.registry });

    this.httpRequestsTotal = new Counter({
      name: "http_requests_total",
      help: "Total HTTP requests",
      labelNames: ["method", "route", "status"],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: "http_request_duration_seconds",
      help: "HTTP request duration in seconds",
      labelNames: ["method", "route", "status"],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.dbQueryDuration = new Histogram({
      name: "db_query_duration_seconds",
      help: "Database query duration in seconds",
      labelNames: ["operation"],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.authAttemptsTotal = new Counter({
      name: "auth_attempts_total",
      help: "Total authentication attempts",
      labelNames: ["type", "success"],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

2. Create `src/infrastructure/metrics/index.ts`:

```typescript
export { MetricsService } from "./metrics";
```

**Acceptance Criteria**:

- Metrics service compiles without errors
- Registry includes default Node.js metrics
- Custom metrics defined for HTTP, DB, and auth
- `bun run typecheck` passes

**Files Created**:

- `src/infrastructure/metrics/metrics.ts`
- `src/infrastructure/metrics/index.ts`

---

### Task 6: Shared Error Handling

**Goal**: Create base error classes and domain error types

**Steps**:

1. Create `src/shared/errors/base.ts`:

```typescript
export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

2. Create `src/shared/errors/index.ts`:

```typescript
export {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "./base";
```

**Acceptance Criteria**:

- All error classes extend DomainError
- Error codes are consistent and programmatic
- Status codes match HTTP standards
- `bun run typecheck` passes

**Files Created**:

- `src/shared/errors/base.ts`
- `src/shared/errors/index.ts`

---

### Task 7: Auth Domain - DTOs and Errors

**Goal**: Create data transfer objects and domain-specific errors for Auth

**Steps**:

1. Create `src/features/auth/dtos/auth.dto.ts`:

```typescript
import { z } from "zod";

export const RegisterRequestSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const LoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.number(),
    username: z.string(),
    email: z.string(),
    createdAt: z.string(),
  }),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
```

2. Create `src/features/auth/dtos/index.ts`:

```typescript
export {
  RegisterRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  type RegisterRequest,
  type LoginRequest,
  type LoginResponse,
} from "./auth.dto";
```

3. Create `src/features/auth/errors/auth.errors.ts`:

```typescript
import { DomainError } from "@/shared/errors";

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid username or password", "INVALID_CREDENTIALS", 401);
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor(username: string) {
    super(`User ${username} already exists`, "USER_ALREADY_EXISTS", 409);
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email ${email} already registered`, "EMAIL_ALREADY_EXISTS", 409);
  }
}

export class TokenExpiredError extends DomainError {
  constructor() {
    super("Token has expired", "TOKEN_EXPIRED", 401);
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super("Invalid token", "INVALID_TOKEN", 401);
  }
}
```

4. Create `src/features/auth/errors/index.ts`:

```typescript
export {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  EmailAlreadyExistsError,
  TokenExpiredError,
  InvalidTokenError,
} from "./auth.errors";
```

**Acceptance Criteria**:

- Zod schemas compile and export types
- Error classes extend DomainError with proper codes
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/dtos/auth.dto.ts`
- `src/features/auth/dtos/index.ts`
- `src/features/auth/errors/auth.errors.ts`
- `src/features/auth/errors/index.ts`

---

### Task 8: Auth Domain - Repository Layer

**Goal**: Create repository with Drizzle Query Builder and prepared statements

**Steps**:

1. Create `src/features/auth/repositories/user.repository.interface.ts`:

```typescript
import { type User } from "@/db/schema";

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: { username: string; email: string; passwordHash: string }): Promise<User>;
  existsByUsername(username: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
```

2. Create `src/features/auth/repositories/user.repository.ts`:

```typescript
import { injectable, inject } from "tsyringe";
import { eq } from "drizzle-orm";
import { type DrizzleDB } from "@/infrastructure/database";
import { users, type User } from "@/db/schema";
import { type IUserRepository } from "./user.repository.interface";
import { type PreparedQuery } from "drizzle-orm/postgres-js";

@injectable()
export class PostgresUserRepository implements IUserRepository {
  private findByUsernamePrepared: PreparedQuery;
  private findByIdPrepared: PreparedQuery;
  private findByEmailPrepared: PreparedQuery;

  constructor(@inject("Database") private db: DrizzleDB) {
    this.findByUsernamePrepared = this.db
      .select()
      .from(users)
      .where(eq(users.username, placeholder("username")))
      .prepare("find_user_by_username");

    this.findByIdPrepared = this.db
      .select()
      .from(users)
      .where(eq(users.id, placeholder("id")))
      .prepare("find_user_by_id");

    this.findByEmailPrepared = this.db
      .select()
      .from(users)
      .where(eq(users.email, placeholder("email")))
      .prepare("find_user_by_email");
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await this.findByUsernamePrepared.execute({ username });
    return result[0] ?? null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.findByIdPrepared.execute({ id });
    return result[0] ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.findByEmailPrepared.execute({ email });
    return result[0] ?? null;
  }

  async create(data: { username: string; email: string; passwordHash: string }): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        password: data.passwordHash,
      })
      .returning();

    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const result = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return result.length > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result.length > 0;
  }
}
```

3. Create `src/features/auth/repositories/index.ts`:

```typescript
export { type IUserRepository } from "./user.repository.interface";
export { PostgresUserRepository } from "./user.repository";
```

**Acceptance Criteria**:

- Interface defines all repository methods
- Repository uses Drizzle Query Builder
- Hot paths (findByUsername, findById, findByEmail) use prepared statements
- Repository is injectable via TSyringe
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/repositories/user.repository.interface.ts`
- `src/features/auth/repositories/user.repository.ts`
- `src/features/auth/repositories/index.ts`

---

### Task 9: Auth Domain - Service Layer

**Goal**: Create auth service with business logic and password hashing

**Steps**:

1. Create `src/features/auth/services/auth.service.interface.ts`:

```typescript
import { type LoginResponse } from "../dtos";

export interface IAuthService {
  register(username: string, email: string, password: string): Promise<LoginResponse>;
  login(username: string, password: string): Promise<LoginResponse>;
  verifyToken(token: string): Promise<{ userId: number; username: string }>;
  getUserById(userId: number): Promise<{
    id: number;
    username: string;
    email: string;
    createdAt: string;
  } | null>;
}
```

2. Create `src/features/auth/services/auth.service.ts`:

```typescript
import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { type IAuthService } from "./auth.service.interface";
import { type IUserRepository } from "../repositories";
import { type LoginResponse } from "../dtos";
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  EmailAlreadyExistsError,
  InvalidTokenError,
  TokenExpiredError,
} from "../errors";
import { Logger } from "@/infrastructure/logging";
import { MetricsService } from "@/infrastructure/metrics";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const SALT_ROUNDS = 10;

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    private logger: Logger,
    private metrics: MetricsService
  ) {
    this.logger = logger.child("AuthService");
  }

  async register(username: string, email: string, password: string): Promise<LoginResponse> {
    const usernameExists = await this.userRepository.existsByUsername(username);
    if (usernameExists) {
      this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
      throw new UserAlreadyExistsError(username);
    }

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) {
      this.metrics.authAttemptsTotal.inc({ type: "register", success: "false" });
      throw new EmailAlreadyExistsError(email);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.userRepository.create({ username, email, passwordHash });

    this.logger.info(`User registered: ${username}`);
    this.metrics.authAttemptsTotal.inc({ type: "register", success: "true" });

    const token = this.generateToken(user.id, user.username);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      this.metrics.authAttemptsTotal.inc({ type: "login", success: "false" });
      throw new InvalidCredentialsError();
    }

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      this.metrics.authAttemptsTotal.inc({ type: "login", success: "false" });
      throw new InvalidCredentialsError();
    }

    this.logger.info(`User logged in: ${username}`);
    this.metrics.authAttemptsTotal.inc({ type: "login", success: "true" });

    const token = this.generateToken(user.id, user.username);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async verifyToken(token: string): Promise<{ userId: number; username: string }> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        username: string;
        exp: number;
      };

      return { userId: payload.userId, username: payload.username };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new InvalidTokenError();
    }
  }

  async getUserById(userId: number): Promise<{
    id: number;
    username: string;
    email: string;
    createdAt: string;
  } | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private generateToken(userId: number, username: string): string {
    return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });
  }
}
```

3. Create `src/features/auth/services/index.ts`:

```typescript
export { type IAuthService } from "./auth.service.interface";
export { AuthService } from "./auth.service";
```

**Acceptance Criteria**:

- Service implements all authentication business logic
- Password hashing uses bcrypt with 10 salt rounds
- JWT tokens expire after 7 days
- Metrics recorded for all auth attempts
- Structured logging with context
- Service is injectable via TSyringe
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/services/auth.service.interface.ts`
- `src/features/auth/services/auth.service.ts`
- `src/features/auth/services/index.ts`

---

### Task 10: Auth Domain - Controller Layer

**Goal**: Create Hono controllers with OpenAPI validation

**Steps**:

1. Create `src/features/auth/controllers/auth.controller.ts`:

```typescript
import { injectable, inject } from "tsyringe";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { type IAuthService } from "../services";
import { RegisterRequestSchema, LoginRequestSchema, LoginResponseSchema } from "../dtos";
import { DomainError } from "@/shared/errors";
import { Logger } from "@/infrastructure/logging";
import { MetricsService } from "@/infrastructure/metrics";

@injectable()
export class AuthController {
  public router: OpenAPIHono;

  constructor(
    @inject("IAuthService") private authService: IAuthService,
    private logger: Logger,
    private metrics: MetricsService
  ) {
    this.logger = logger.child("AuthController");
    this.router = new OpenAPIHono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.openapi(this.registerRoute(), async (c) => {
      const body = c.req.valid("json");

      const result = await this.authService.register(body.username, body.email, body.password);

      return c.json(result, 201);
    });

    this.router.openapi(this.loginRoute(), async (c) => {
      const body = c.req.valid("json");

      const result = await this.authService.login(body.username, body.password);

      return c.json(result, 200);
    });

    this.router.openapi(this.meRoute(), async (c) => {
      const authHeader = c.req.header("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return c.json({ error: "Missing or invalid Authorization header" }, 401);
      }

      const token = authHeader.substring(7);
      const { userId } = await this.authService.verifyToken(token);
      const user = await this.authService.getUserById(userId);

      if (!user) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json({ user }, 200);
    });
  }

  private registerRoute(): ReturnType<typeof createRoute> {
    return createRoute({
      method: "post",
      path: "/register",
      tags: ["auth"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: RegisterRequestSchema,
            },
          },
        },
      },
      responses: {
        201: {
          content: {
            "application/json": {
              schema: LoginResponseSchema,
            },
          },
          description: "User registered successfully",
        },
        409: {
          description: "Username or email already exists",
        },
      },
    });
  }

  private loginRoute(): ReturnType<typeof createRoute> {
    return createRoute({
      method: "post",
      path: "/login",
      tags: ["auth"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: LoginRequestSchema,
            },
          },
        },
      },
      responses: {
        200: {
          content: {
            "application/json": {
              schema: LoginResponseSchema,
            },
          },
          description: "Login successful",
        },
        401: {
          description: "Invalid credentials",
        },
      },
    });
  }

  private meRoute(): ReturnType<typeof createRoute> {
    return createRoute({
      method: "get",
      path: "/me",
      tags: ["auth"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                user: z.object({
                  id: z.number(),
                  username: z.string(),
                  email: z.string(),
                  createdAt: z.string(),
                }),
              }),
            },
          },
          description: "Current user retrieved successfully",
        },
        401: {
          description: "Unauthorized",
        },
        404: {
          description: "User not found",
        },
      },
    });
  }
}
```

2. Create `src/features/auth/controllers/index.ts`:

```typescript
export { AuthController } from "./auth.controller";
```

**Acceptance Criteria**:

- Controller uses @hono/zod-openapi for validation
- All routes have OpenAPI documentation
- Error handling uses domain errors
- Metrics recorded for all requests
- Controller is injectable via TSyringe
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/controllers/auth.controller.ts`
- `src/features/auth/controllers/index.ts`

---

### Task 11: DI Container Setup

**Goal**: Create TSyringe container with all dependency registrations

**Steps**:

1. Create `src/container/index.ts`:

```typescript
import "reflect-metadata";
import { container } from "tsyringe";
import { db, type DrizzleDB } from "@/infrastructure/database";
import { Logger } from "@/infrastructure/logging";
import { MetricsService } from "@/infrastructure/metrics";
import { PostgresUserRepository, type IUserRepository } from "@/features/auth/repositories";
import { AuthService, type IAuthService } from "@/features/auth/services";

export function registerDependencies(): void {
  // Infrastructure
  container.register<DrizzleDB>("Database", {
    useValue: db,
  });

  container.registerSingleton(Logger);
  container.registerSingleton(MetricsService);

  // Auth domain
  container.register<IUserRepository>("IUserRepository", {
    useClass: PostgresUserRepository,
  });

  container.register<IAuthService>("IAuthService", {
    useClass: AuthService,
  });
}

export { container };
```

**Acceptance Criteria**:

- reflect-metadata imported first
- Database registered as singleton value
- All repositories and services registered
- Logger and metrics registered as singletons
- `bun run typecheck` passes

**Files Created**:

- `src/container/index.ts`

---

### Task 12: Hono Application Setup

**Goal**: Create Hono app with middleware and error handling

**Steps**:

1. Create `src/infrastructure/http/app.ts`:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { container } from "@/container";
import { AuthController } from "@/features/auth/controllers";
import { MetricsService } from "@/infrastructure/metrics";
import { logger } from "@/infrastructure/logging";
import { DomainError } from "@/shared/errors";

export function createApp(): Hono {
  const app = new Hono();

  // CORS middleware
  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", process.env.ORIGIN || ""].filter(Boolean),
      credentials: true,
    })
  );

  // Request logging
  app.use("*", honoLogger());

  // Metrics middleware
  const metricsService = container.resolve(MetricsService);
  app.use("*", async (c, next) => {
    const start = Date.now();
    await next();
    const duration = (Date.now() - start) / 1000;

    metricsService.httpRequestsTotal.inc({
      method: c.req.method,
      route: c.req.routePath || c.req.path,
      status: c.res.status.toString(),
    });

    metricsService.httpRequestDuration.observe(
      {
        method: c.req.method,
        route: c.req.routePath || c.req.path,
        status: c.res.status.toString(),
      },
      duration
    );
  });

  // Error handling
  app.onError((err, c) => {
    if (err instanceof DomainError) {
      logger.warn({ code: err.code, message: err.message }, "Domain error");
      return c.json(
        {
          error: err.message,
          code: err.code,
          details: err.details,
        },
        err.statusCode
      );
    }

    logger.error({ err }, "Unhandled error");
    return c.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      500
    );
  });

  // Health check
  app.get("/health", (c) => {
    return c.json({ status: "ok" });
  });

  // Metrics endpoint
  app.get("/metrics", async (c) => {
    const metrics = await metricsService.getMetrics();
    return c.text(metrics);
  });

  // Register auth routes
  const authController = container.resolve(AuthController);
  app.route("/api/auth", authController.router);

  return app;
}
```

2. Create `src/infrastructure/http/index.ts`:

```typescript
export { createApp } from "./app";
```

**Acceptance Criteria**:

- Hono app created with CORS middleware
- Request logging enabled
- Metrics middleware tracks all requests
- Error handling converts DomainErrors to JSON responses
- Health check endpoint at /health
- Metrics endpoint at /metrics
- Auth routes mounted at /api/auth
- `bun run typecheck` passes

**Files Created**:

- `src/infrastructure/http/app.ts`
- `src/infrastructure/http/index.ts`

---

### Task 13: Update Main Entry Point

**Goal**: Integrate Hono app alongside legacy router

**Steps**:

1. Read current `src/index.ts` to understand existing setup

2. Update `src/index.ts` to add Hono app:

```typescript
import "reflect-metadata"; // Must be first
import { registerDependencies } from "@/container";
import { createApp } from "@/infrastructure/http";
import { logger } from "@/infrastructure/logging";
import { db } from "@/services/db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// ... existing imports for legacy router ...

const PORT = parseInt(process.env.PORT || "3000", 10);

async function startServer(): Promise<void> {
  logger.info("Starting MyMemoryCard backend...");

  // Run migrations
  const migrationClient = postgres(process.env.DATABASE_URL || "", { max: 1 });
  const migrationDb = drizzle(migrationClient);
  await migrate(migrationDb, { migrationsFolder: "./drizzle" });
  await migrationClient.end();
  logger.info("Database migrations completed");

  // Register DI dependencies
  registerDependencies();
  logger.info("DI container initialized");

  // Create Hono app (for new routes)
  const honoApp = createApp();
  logger.info("Hono application created");

  // Create HTTP server
  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      // Route to Hono app for new API routes
      if (
        url.pathname.startsWith("/api/auth") ||
        url.pathname === "/health" ||
        url.pathname === "/metrics"
      ) {
        return honoApp.fetch(req);
      }

      // Legacy router for existing routes
      return legacyRouter.handle(req);
    },
  });

  logger.info(`Server running on http://localhost:${PORT}`);
}

startServer().catch((error) => {
  logger.error({ err: error }, "Failed to start server");
  process.exit(1);
});
```

3. Ensure `reflect-metadata` is the first import

4. Verify migrations still run on startup

5. Test that both Hono and legacy routes work

**Acceptance Criteria**:

- reflect-metadata imported first
- DI container registered before creating Hono app
- Hono routes handle /api/auth, /health, /metrics
- Legacy router handles all other routes
- Migrations run on startup
- Server starts without errors
- `bun run typecheck` passes

**Files Modified**:

- `src/index.ts`

---

### Task 14: Unit Tests - Repository Layer

**Goal**: Create unit tests for UserRepository with mocked database

**Steps**:

1. Create test helper `src/__tests__/helpers/mock-db.ts`:

```typescript
import { type DrizzleDB } from "@/infrastructure/database";

export function createMockDrizzleDB(): DrizzleDB {
  const mockPreparedQuery = {
    execute: jest.fn(),
  };

  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    limit: jest.fn().mockReturnThis(),
    prepare: jest.fn().mockReturnValue(mockPreparedQuery),
    execute: jest.fn(),
  } as unknown as DrizzleDB;
}
```

2. Create `src/features/auth/repositories/__tests__/user.repository.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { PostgresUserRepository } from "../user.repository";
import { createMockDrizzleDB } from "@/__tests__/helpers/mock-db";

describe("PostgresUserRepository", () => {
  let repository: PostgresUserRepository;
  let mockDb: ReturnType<typeof createMockDrizzleDB>;

  beforeEach(() => {
    mockDb = createMockDrizzleDB();
    repository = new PostgresUserRepository(mockDb);
  });

  describe("findByUsername", () => {
    it("should return user when found", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        createdAt: new Date(),
      };

      const mockPrepared = {
        execute: jest.fn().mockResolvedValue([mockUser]),
      };
      mockDb.select().from().where().prepare = jest.fn().mockReturnValue(mockPrepared);

      const result = await repository.findByUsername("testuser");

      expect(result).toEqual(mockUser);
      expect(mockPrepared.execute).toHaveBeenCalledWith({ username: "testuser" });
    });

    it("should return null when user not found", async () => {
      const mockPrepared = {
        execute: jest.fn().mockResolvedValue([]),
      };
      mockDb.select().from().where().prepare = jest.fn().mockReturnValue(mockPrepared);

      const result = await repository.findByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return new user", async () => {
      const mockUser = {
        id: 1,
        username: "newuser",
        email: "new@example.com",
        password: "hashedpassword",
        createdAt: new Date(),
      };

      mockDb.insert().values().returning = jest.fn().mockResolvedValue([mockUser]);

      const result = await repository.create({
        username: "newuser",
        email: "new@example.com",
        passwordHash: "hashedpassword",
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe("existsByUsername", () => {
    it("should return true when user exists", async () => {
      mockDb.select().from().where().limit = jest.fn().mockResolvedValue([{ id: 1 }]);

      const result = await repository.existsByUsername("existinguser");

      expect(result).toBe(true);
    });

    it("should return false when user does not exist", async () => {
      mockDb.select().from().where().limit = jest.fn().mockResolvedValue([]);

      const result = await repository.existsByUsername("nonexistent");

      expect(result).toBe(false);
    });
  });
});
```

3. Run tests:

```bash
cd backend
bun test src/features/auth/repositories/__tests__/user.repository.test.ts
```

**Acceptance Criteria**:

- All repository tests pass
- Tests run without PostgreSQL connection
- Mock DB helper reusable for other tests
- Tests cover happy path and edge cases
- `bun run typecheck` passes

**Files Created**:

- `src/__tests__/helpers/mock-db.ts`
- `src/features/auth/repositories/__tests__/user.repository.test.ts`

---

### Task 15: Unit Tests - Service Layer

**Goal**: Create unit tests for AuthService with mocked dependencies

**Steps**:

1. Create `src/features/auth/services/__tests__/auth.service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, jest } from "bun:test";
import { AuthService } from "../auth.service";
import { type IUserRepository } from "../../repositories";
import { Logger } from "@/infrastructure/logging";
import { MetricsService } from "@/infrastructure/metrics";
import {
  InvalidCredentialsError,
  UserAlreadyExistsError,
  EmailAlreadyExistsError,
} from "../../errors";

describe("AuthService", () => {
  let service: AuthService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockLogger: Logger;
  let mockMetrics: MetricsService;

  beforeEach(() => {
    mockUserRepository = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      existsByUsername: jest.fn(),
      existsByEmail: jest.fn(),
    };

    mockLogger = { child: jest.fn().mockReturnThis(), info: jest.fn() } as unknown as Logger;
    mockMetrics = {
      authAttemptsTotal: { inc: jest.fn() },
    } as unknown as MetricsService;

    service = new AuthService(mockUserRepository, mockLogger, mockMetrics);
  });

  describe("register", () => {
    it("should successfully register new user", async () => {
      mockUserRepository.existsByUsername.mockResolvedValue(false);
      mockUserRepository.existsByEmail.mockResolvedValue(false);
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        createdAt: new Date(),
      });

      const result = await service.register("testuser", "test@example.com", "password123");

      expect(result).toHaveProperty("token");
      expect(result.user.username).toBe("testuser");
      expect(mockMetrics.authAttemptsTotal.inc).toHaveBeenCalledWith({
        type: "register",
        success: "true",
      });
    });

    it("should throw UserAlreadyExistsError when username exists", async () => {
      mockUserRepository.existsByUsername.mockResolvedValue(true);

      await expect(
        service.register("existinguser", "test@example.com", "password123")
      ).rejects.toThrow(UserAlreadyExistsError);

      expect(mockMetrics.authAttemptsTotal.inc).toHaveBeenCalledWith({
        type: "register",
        success: "false",
      });
    });

    it("should throw EmailAlreadyExistsError when email exists", async () => {
      mockUserRepository.existsByUsername.mockResolvedValue(false);
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      await expect(
        service.register("testuser", "existing@example.com", "password123")
      ).rejects.toThrow(EmailAlreadyExistsError);
    });
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: hashedPassword,
        createdAt: new Date(),
      });

      const result = await service.login("testuser", "password123");

      expect(result).toHaveProperty("token");
      expect(result.user.username).toBe("testuser");
      expect(mockMetrics.authAttemptsTotal.inc).toHaveBeenCalledWith({
        type: "login",
        success: "true",
      });
    });

    it("should throw InvalidCredentialsError when user not found", async () => {
      mockUserRepository.findByUsername.mockResolvedValue(null);

      await expect(service.login("nonexistent", "password123")).rejects.toThrow(
        InvalidCredentialsError
      );

      expect(mockMetrics.authAttemptsTotal.inc).toHaveBeenCalledWith({
        type: "login",
        success: "false",
      });
    });

    it("should throw InvalidCredentialsError when password is wrong", async () => {
      const hashedPassword = await bcrypt.hash("correctpassword", 10);
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: hashedPassword,
        createdAt: new Date(),
      });

      await expect(service.login("testuser", "wrongpassword")).rejects.toThrow(
        InvalidCredentialsError
      );
    });
  });

  describe("verifyToken", () => {
    it("should successfully verify valid token", async () => {
      const token = jwt.sign(
        { userId: 1, username: "testuser" },
        process.env.JWT_SECRET || "dev-jwt-secret-change-in-production",
        { expiresIn: "7d" }
      );

      const result = await service.verifyToken(token);

      expect(result).toEqual({ userId: 1, username: "testuser" });
    });

    it("should throw InvalidTokenError for invalid token", async () => {
      await expect(service.verifyToken("invalid-token")).rejects.toThrow(InvalidTokenError);
    });
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      mockUserRepository.findById.mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        createdAt: new Date("2024-01-01"),
      });

      const result = await service.getUserById(1);

      expect(result).toEqual({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      });
    });

    it("should return null when user not found", async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
```

2. Add missing imports at top of file:

```typescript
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
```

3. Run tests:

```bash
cd backend
bun test src/features/auth/services/__tests__/auth.service.test.ts
```

**Acceptance Criteria**:

- All service tests pass
- Tests run without external dependencies
- Tests cover success and error cases
- Password hashing and JWT verification tested
- Metrics calls verified
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/services/__tests__/auth.service.test.ts`

---

### Task 16: Integration Tests - Auth Flow

**Goal**: Create end-to-end integration tests with real database

**Steps**:

1. Create `src/features/auth/__tests__/integration/auth.integration.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { createApp } from "@/infrastructure/http";
import { registerDependencies } from "@/container";
import { db } from "@/infrastructure/database";
import { users } from "@/db/schema";
import "reflect-metadata";

describe("Auth Integration Tests", () => {
  let app: ReturnType<typeof createApp>;
  let testUserId: number;

  beforeAll(() => {
    registerDependencies();
    app = createApp();
  });

  beforeEach(async () => {
    // Clean up test users
    await db.delete(users).where(sql`username LIKE 'test%'`);
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(users).where(sql`username LIKE 'test%'`);
  });

  describe("POST /api/auth/register", () => {
    it("should register new user successfully", async () => {
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser123",
          email: "testuser123@example.com",
          password: "SecurePass123!",
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty("token");
      expect(data.user.username).toBe("testuser123");
      expect(data.user.email).toBe("testuser123@example.com");

      testUserId = data.user.id;
    });

    it("should reject duplicate username", async () => {
      // First registration
      await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "duplicate",
          email: "first@example.com",
          password: "password123",
        }),
      });

      // Second registration with same username
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "duplicate",
          email: "second@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.code).toBe("USER_ALREADY_EXISTS");
    });

    it("should reject duplicate email", async () => {
      // First registration
      await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user1",
          email: "duplicate@example.com",
          password: "password123",
        }),
      });

      // Second registration with same email
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "user2",
          email: "duplicate@example.com",
          password: "password123",
        }),
      });

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.code).toBe("EMAIL_ALREADY_EXISTS");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Register test user
      await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "logintest",
          email: "logintest@example.com",
          password: "password123",
        }),
      });
    });

    it("should login with valid credentials", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "logintest",
          password: "password123",
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("token");
      expect(data.user.username).toBe("logintest");
    });

    it("should reject invalid username", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "nonexistent",
          password: "password123",
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.code).toBe("INVALID_CREDENTIALS");
    });

    it("should reject invalid password", async () => {
      const response = await app.request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "logintest",
          password: "wrongpassword",
        }),
      });

      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("GET /api/auth/me", () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and get token
      const response = await app.request("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "metest",
          email: "metest@example.com",
          password: "password123",
        }),
      });

      const data = await response.json();
      authToken = data.token;
    });

    it("should return current user with valid token", async () => {
      const response = await app.request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user.username).toBe("metest");
      expect(data.user.email).toBe("metest@example.com");
    });

    it("should reject request without token", async () => {
      const response = await app.request("/api/auth/me", {
        method: "GET",
      });

      expect(response.status).toBe(401);
    });

    it("should reject invalid token", async () => {
      const response = await app.request("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status).toBe(401);
    });
  });
});
```

2. Add missing import:

```typescript
import { sql } from "drizzle-orm";
```

3. Run integration tests:

```bash
cd backend
bun test src/features/auth/__tests__/integration/auth.integration.test.ts
```

**Acceptance Criteria**:

- All integration tests pass
- Tests use real PostgreSQL database
- Tests clean up data after each run
- Full auth flow tested end-to-end
- Error cases validated
- `bun run typecheck` passes

**Files Created**:

- `src/features/auth/__tests__/integration/auth.integration.test.ts`

---

### Task 17: Manual Testing and Validation

**Goal**: Verify all auth endpoints work correctly through manual testing

**Steps**:

1. Start the backend server:

```bash
cd backend
bun run dev
```

2. Test health check:

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok"}`

3. Test metrics endpoint:

```bash
curl http://localhost:3000/metrics
```

Expected: Prometheus metrics output

4. Test registration:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manualtest",
    "email": "manualtest@example.com",
    "password": "TestPass123!"
  }'
```

Expected: 201 status with token and user object

5. Test login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "manualtest",
    "password": "TestPass123!"
  }'
```

Expected: 200 status with token and user object

6. Test /me endpoint (replace TOKEN with actual token from login):

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

Expected: 200 status with user object

7. Test existing legacy routes still work:

```bash
curl http://localhost:3000/api/games
```

Expected: Legacy route responds normally

8. Check logs for structured output with context

9. Check metrics at /metrics show auth_attempts_total increments

**Acceptance Criteria**:

- All curl commands return expected responses
- Status codes match specifications
- Tokens are valid JWT format
- Legacy routes still functional
- Logs show structured JSON output
- Metrics track auth attempts
- No errors in server logs

---

### Task 18: Documentation and Cleanup

**Goal**: Document Phase 1 completion and prepare for Phase 2

**Steps**:

1. Update `backend/CLAUDE.md` to document new architecture:

Add section:

```markdown
## New Architecture (Phase 1+)

Phase 1 introduces dependency injection architecture for improved testability:

### Directory Structure
```

src/
features/ # Domain features (auth, games, etc.)
auth/
controllers/ # Hono route handlers with OpenAPI
services/ # Business logic
repositories/ # Data access layer
dtos/ # Request/response schemas (Zod)
errors/ # Domain-specific errors
infrastructure/ # Cross-cutting concerns
database/ # Drizzle connection
cache/ # Redis client
http/ # Hono app setup
logging/ # Pino logger
metrics/ # Prometheus metrics
shared/ # Shared utilities
errors/ # Base error classes
middleware/ # Reusable middleware
container/ # TSyringe DI setup

````

### Migrated Features

- **Auth** (Phase 1): Register, login, token verification
  - Routes: `/api/auth/*`
  - 90%+ unit test coverage
  - Integration tests with real database

### Legacy Features

All other features still use legacy router until migrated:
- Games, Collections, Sessions, Stats, AI, etc.
- Routes: `/api/*` (excluding `/api/auth`)

### Testing

```bash
# Unit tests (no database required)
bun test src/features/auth/repositories
bun test src/features/auth/services

# Integration tests (requires database)
bun test src/features/auth/__tests__/integration
````

### Observability

- **Logs**: Pino structured JSON logging with context
- **Metrics**: Prometheus metrics at `/metrics`
  - `http_requests_total` - HTTP request counter
  - `http_request_duration_seconds` - Request latency
  - `db_query_duration_seconds` - Database query latency
  - `auth_attempts_total` - Authentication attempts

````

2. Update root `CLAUDE.md` to reference new architecture:

Add to "After Every Code Change" section:
```markdown
# For new architecture code (Phase 1+)
cd backend && bun test src/features/auth && bun run lint && bun run typecheck
````

3. Commit Phase 1 changes:

```bash
git add .
git commit -m "feat: phase 1 auth domain migration to DI architecture

- Add TSyringe dependency injection container
- Add Hono framework with OpenAPI support
- Migrate auth domain to layered architecture
- Add Pino structured logging and Prometheus metrics
- Achieve 90%+ unit test coverage for auth domain
- Add integration tests for full auth flow
- Maintain zero breaking changes to API contracts

Coexistence:
- New routes: /api/auth/* (Hono)
- Legacy routes: /api/* excluding auth (legacy router)
- Both systems work side-by-side"
```

4. Create Phase 2 preparation checklist in `docs/plans/phase2-games-domain.md`:

```markdown
# Phase 2: Games Domain Migration

**Depends on**: Phase 1 (Auth) completion
**Duration**: 2 weeks

## Scope

Migrate games domain to new architecture:

- Game search and metadata
- User game library (userGames)
- Game progress tracking
- Platform management
- RAWG API integration

## Prerequisites

- [ ] Phase 1 tests passing
- [ ] Phase 1 deployed to production
- [ ] No regressions reported
- [ ] Team familiar with DI patterns

## Tasks

(To be detailed in separate implementation plan)
```

**Acceptance Criteria**:

- Backend CLAUDE.md documents new architecture
- Root CLAUDE.md updated with testing commands
- Phase 1 committed with descriptive message
- Phase 2 preparation document created
- All files formatted and linted

**Files Modified**:

- `backend/CLAUDE.md`
- `CLAUDE.md`

**Files Created**:

- `docs/plans/phase2-games-domain.md`

---

## Validation Checklist

Before marking Phase 1 complete, verify:

- [ ] All 18 tasks completed
- [ ] `bun run lint` passes with zero warnings
- [ ] `bun run typecheck` passes
- [ ] All unit tests pass (repositories, services)
- [ ] All integration tests pass (auth flow)
- [ ] Manual testing validates all endpoints
- [ ] Metrics visible at /metrics
- [ ] Structured logs include request context
- [ ] Legacy routes still functional
- [ ] Zero breaking changes to API contracts
- [ ] Documentation updated
- [ ] Changes committed to git

## Next Steps

1. Monitor Phase 1 in production for 1 week
2. Gather feedback on DI patterns and testing
3. Plan Phase 2: Games domain migration
4. Continue with remaining domains per 15-week timeline

## Rollback Plan

If critical issues found:

1. Revert commit: `git revert <commit-hash>`
2. Deploy previous version
3. Auth routes fall back to legacy implementation
4. Investigate issues in development environment
5. Apply fixes and re-deploy

Phase 1 is isolated to auth routes, minimizing blast radius.
