# Dependency Injection Patterns

## Overview

This document describes the DI patterns used in the MyMemoryCard backend, established in Phase 1 with the Auth domain.

## Architecture Layers

```
Controllers (HTTP) → Services (Business Logic) → Repositories (Data Access) → Infrastructure (DB, Redis, etc.)
```

## Interface-First Design

Always define interfaces before implementations:

```typescript
// 1. Define interface
export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
  exists(username: string): Promise<boolean>;
}

// 2. Implement
@injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(@inject("Database") private db: DrizzleDB) {}
  // ...
}

// 3. Register in container
container.register<IUserRepository>("IUserRepository", {
  useClass: PostgresUserRepository,
});

// 4. Inject in service
@injectable()
export class AuthService {
  constructor(@inject("IUserRepository") private userRepo: IUserRepository) {}
}
```

## Testing Pattern

### Unit Tests

Services and repositories are 100% testable without infrastructure:

```typescript
describe("AuthService", () => {
  let service: AuthService;
  let mockRepo: IUserRepository;
  let mockHasher: IPasswordHasher;
  let mockTokenService: ITokenService;

  beforeEach(() => {
    mockRepo = createMockUserRepository();
    mockHasher = createMockPasswordHasher();
    mockTokenService = createMockTokenService();

    service = new AuthService(mockRepo, mockHasher, mockTokenService, mockLogger, mockMetrics);
  });

  it("should register user", async () => {
    const result = await service.register("user", "email@example.com", "pass");
    expect(result.user.username).toBe("user");
  });
});
```

### Integration Tests

Test full request/response cycle with real database:

```typescript
describe("Auth Integration", () => {
  let app: OpenAPIHono;

  beforeAll(() => {
    registerDependencies();
    app = createHonoApp();
  });

  it("should register user via API", async () => {
    const response = await app.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "test", email: "test@example.com", password: "pass" }),
    });
    expect(response.status).toBe(201);
  });
});
```

## Controller Pattern

Controllers are thin HTTP handlers that delegate to services:

```typescript
@injectable()
export class AuthController {
  public router: OpenAPIHono;

  constructor(
    @inject("IAuthService") private authService: IAuthService,
    private logger: Logger
  ) {
    this.router = new OpenAPIHono();
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.router.openapi(this.registerRoute(), async (c) => {
      const body = c.req.valid("json");
      const result = await this.authService.register(body.username, body.email, body.password);
      return c.json(result, 201);
    });
  }
}
```

## Error Handling

Use domain errors with codes for programmatic handling:

```typescript
// Define error
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

// Throw in service
if (exists) {
  throw new ConflictError("User already exists");
}

// Handle in middleware
if (err instanceof DomainError) {
  return c.json({ error: err.message, code: err.code }, err.statusCode);
}
```

## Observability

### Logging

```typescript
@injectable()
export class AuthService {
  constructor(private logger: Logger) {
    this.logger = logger.child('AuthService')
  }

  async register(...) {
    this.logger.info('Attempting registration', username)
    // ...
    this.logger.info('Registration successful', userId)
  }
}
```

### Metrics

```typescript
@injectable()
export class AuthService {
  constructor(private metrics: MetricsService) {}

  async login(...) {
    const success = isValid ? 'true' : 'false'
    this.metrics.authAttemptsTotal.inc({ type: 'login', success })
  }
}
```

## Migrating a New Domain

1. **Create interfaces** in `features/<domain>/`
2. **Implement repositories** with `@inject('Database')`
3. **Implement services** with injected dependencies
4. **Create DTOs** with Zod schemas
5. **Implement controller** with OpenAPI routes
6. **Register in container** (`container/index.ts`)
7. **Mount routes** in `infrastructure/http/app.ts`
8. **Write unit tests** (90%+ coverage)
9. **Write integration tests**

## Benefits

- **90%+ test coverage** - All business logic testable without infrastructure
- **Type safety** - Full TypeScript inference through DI
- **Loose coupling** - Easy to swap implementations
- **Clear dependencies** - Constructor injection makes dependencies explicit
- **Easy mocking** - Interfaces enable complete mocking in tests
