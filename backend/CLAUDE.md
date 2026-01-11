# Backend CLAUDE.md

Backend instructions for Claude Code. See root [CLAUDE.md](../CLAUDE.md).

## Tech Stack

- **Runtime**: Bun 1.0+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16+ via Drizzle ORM
- **Cache**: Redis
- **Auth**: JWT (jsonwebtoken) + WebAuthn (passkeys)
- **External API**: RAWG for game metadata

## Commands

Preferred (root):

```bash
just dev-backend
just lint-backend
just typecheck-backend
just test-unit-backend
just build-backend
```

Direct (backend directory):

```bash
bun run dev           # Dev server with hot reload on :3000
bun run start         # Production start
bun run typecheck     # TypeScript checking
bun run lint          # ESLint with zero warnings allowed
bun run lint:fix      # ESLint with auto-fix
bun run format        # Prettier format
bun run format:check  # Check formatting
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio     # Open Drizzle Studio GUI
```

## After Every Code Change

Run after modifications:

```bash
just format-backend && just lint-backend && just typecheck-backend
```

Fix errors before committing. Lint runs with `--max-warnings=0`.

**Before every commit:**

```bash
just test-unit-backend  # Verify all tests pass
```

## Directory Structure

```
src/
  db/
    schema.ts         # Drizzle ORM schema (migrations auto-run on startup)
  lib/
    router.ts         # Custom lightweight router with path parameters
  middleware/
    auth.ts           # JWT authentication
    cors.ts           # CORS configuration
  routes/             # API route handlers
    games.ts          # Game CRUD, search, export
    collections.ts    # User collections
    auth.ts           # Login, register, WebAuthn
    sessions.ts       # Play session tracking
    achievements.ts   # Achievement tracking
    ai.ts             # AI curator features
    stats.ts          # Dashboard statistics
    ...
  services/
    db.ts             # PostgreSQL connection
    redis.ts          # Redis connection
    rawg.ts           # RAWG API client
    ai/               # AI provider integrations
  types/              # TypeScript type definitions
  index.ts            # Server entry point
drizzle/              # Migration files (auto-generated)
```

## Database

### Connection

```
postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard
```

Migrations run on backend startup.

### Schema Overview

Tables in `src/db/schema.ts`:

| Table            | Description                                     |
| ---------------- | ----------------------------------------------- |
| users            | User accounts                                   |
| games            | Game metadata (from RAWG)                       |
| userGames        | User library entries (ownership per platform)   |
| userGameProgress | Status, rating, completion, favorites           |
| playSessions     | Play session tracking                           |
| completionLogs   | Completion percentage history                   |
| collections      | User-created game collections                   |
| platforms        | Gaming platforms (Steam, PSN, etc.)             |
| userPlatforms    | User connected platforms                        |
| achievements     | Game achievements                               |
| gameAdditions    | DLC and editions                                |

### Drizzle ORM Patterns

```typescript
import { db } from '@/services/db'
import { games, userGames } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Query with joins
const results = await db
  .select()
  .from(userGames)
  .innerJoin(games, eq(userGames.gameId, games.id))
  .where(eq(userGames.userId, userId))

// Use transactions for multi-statement operations
await db.transaction(async (tx) => {
  await tx.insert(games).values(gameData)
  await tx.insert(userGames).values(userGameData)
})
```

### Database Migrations

**IMPORTANT**: Use Drizzle's migration workflow (never create SQL files manually):

```bash
# 1. Modify schema.ts with your changes
# 2. Generate migration from schema changes
bun run db:generate

# 3. Review generated SQL in drizzle/ directory
# 4. Apply migration (runs on backend startup)
bun run db:migrate
```

**For data migrations** (deleting records, transforming data):
1. Create schema-only migration with `db:generate`
2. Edit generated SQL to add data migration logic
3. Apply with `db:migrate`

Example workflow:
```typescript
// 1. Update schema.ts
export const aiProviderEnum = pgEnum("ai_provider", ["openai"]) // was ["openai", "openrouter", "ollama", "lmstudio"]

// 2. Generate migration
// $ bun run db:generate
// ✓ Generated migration: drizzle/0017_update_ai_provider.sql

// 3. Edit generated SQL to add data cleanup (if needed)
// Add: DELETE FROM user_ai_settings WHERE provider != 'openai';

// 4. Apply migration
// $ bun run db:migrate
```

## Router

Custom lightweight router in `lib/router.ts`:

```typescript
import { router } from '@/lib/router'

// Define routes with path parameters
router.get('/api/games/:id', getGameHandler, true) // true = requires auth
router.post('/api/games', createGameHandler, true)
router.delete('/api/games/:id', deleteGameHandler, true)

// Handler signature
type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  user?: JWTPayload
) => Promise<Response>
```

## Authentication

JWT-based auth with optional WebAuthn:

```typescript
// Middleware adds user to handlers marked as requiresAuth
router.get('/api/protected', handler, true)

// In handler, user is available as third parameter
async function handler(req: Request, params: Record<string, string>, user?: JWTPayload) {
  if (!user) return new Response('Unauthorized', { status: 401 })
  // user.id, user.username available
}
```

## Testing

Run the test suite to verify changes:

```bash
bun test                     # Run unit and integration tests
bun run lint && bun run typecheck
```

Review test output and verify critical paths manually against running server.

## Environment Variables

Copy `.env.example` to `.env` and customize for your environment.

| Variable            | Default                                        | Description                       |
| ------------------- | ---------------------------------------------- | --------------------------------- |
| DATABASE_URL        | `postgresql://...@localhost:5433/mymemorycard` | PostgreSQL connection             |
| REDIS_URL           | `redis://localhost:6380`                       | Redis connection                  |
| JWT_SECRET          | `dev-jwt-secret-change-in-production`          | JWT signing key                   |
| RAWG_API_KEY        | -                                              | RAWG API for game metadata        |
| PORT                | `3000`                                         | Server port                       |
| ORIGIN              | -                                              | Additional CORS origin            |
| TEST_DATABASE_URL   | Same as DATABASE_URL                           | PostgreSQL for integration tests  |
| API_BASE_URL        | `http://localhost:3000`                        | API URL for integration tests     |

**Testing**: Integration tests use `DATABASE_URL` from environment or fall back to the default Docker postgres connection. To override for CI or different environments, set `DATABASE_URL` before running tests:

```bash
# Use default (local Docker postgres)
bun run test:integration

# Override for CI or custom database
DATABASE_URL=postgresql://user:pass@host:port/db bun run test:integration
```

## API Response Patterns

```typescript
// Success
return new Response(JSON.stringify(data), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

// Error
return new Response(JSON.stringify({ error: 'Not found' }), {
  status: 404,
  headers: { 'Content-Type': 'application/json' },
})
```

## Logging Rules

**CRITICAL: Never use console.log or console.error**

Inject Logger service in all classes:

```typescript
import type { Logger } from "@/infrastructure/logging/logger"

@injectable()
export class MyService {
  constructor(
    @inject("Logger") private logger: Logger
  ) {}

  async doSomething(): Promise<void> {
    this.logger.error("Operation failed", {
      userId: "123",
      error: error.message,
    })
  }
}
```

**When NOT to log:**
- Authentication failures (expected events, enables timing attacks)
- Validation errors from user input (expected, logged at boundary)
- Normal operation flow

**When TO log:**
- Unexpected errors (database failures, external API errors)
- Configuration errors preventing operation
- Security events (not auth failures)

## Security Patterns

### Authentication Errors

Return generic messages - never reveal system internals:

```typescript
// GOOD - Generic message
if (!user) {
  return c.json({ error: "Unauthorized" }, 401)
}

// BAD - Information leakage
if (!authHeader) {
  return c.json({ error: "Missing authorization header" }, 401)
}
```

### SQL Injection Prevention

Use parameterized queries, never string interpolation:

```typescript
// GOOD - Parameterized
import { sql } from "drizzle-orm"

const vectorString = JSON.stringify(embedding)
sql`embedding <-> ${vectorString}`

// BAD - String interpolation
const vectorString = `[${embedding.join(",")}]`
sql`embedding <-> ${vectorString}` // SQL injection risk
```

### Untrusted Input Validation

Validate AI responses and external data with Zod:

```typescript
import { z } from "zod"

const ResponseSchema = z.object({
  name: z.string(),
  confidence: z.number().min(0).max(1),
})

const parsed = JSON.parse(aiResponse)
const validation = z.array(ResponseSchema).safeParse(parsed)

if (!validation.success) {
  this.logger.error("Invalid AI response", {
    error: validation.error.message,
  })
  return []
}

return validation.data
```

## Error Types and HTTP Status Codes

Match error types to HTTP status codes:

```typescript
import { ConfigurationError } from "@/features/ai/errors/configuration.error"
import { ValidationError } from "@/shared/errors/base"

try {
  await service.doWork()
} catch (error) {
  if (error instanceof ConfigurationError) {
    return c.json({ error: error.message }, 503) // Service Unavailable
  }

  if (error instanceof ValidationError) {
    return c.json({ error: error.message }, 400) // Bad Request
  }

  // Unknown error
  this.logger.error("Unexpected error", { error: error.message })
  return c.json({ error: "Internal server error" }, 500)
}
```

## Dependency Injection with tsyringe

When adding dependencies, update tests with mocks:

```typescript
// Service
constructor(
  @inject("IRepository") private repo: IRepository,
  @inject("Logger") private logger: Logger
) {}

// Test setup
const mockLogger: Logger = {
  debug: mock(() => {}),
  info: mock(() => {}),
  warn: mock(() => {}),
  error: mock(() => {}),
  child: mock(() => mockLogger),
}

const service = new MyService(mockRepo, mockLogger)
```

## Zod Patterns

**UUID Validation** - `z.uuid()` is deprecated:

```typescript
// GOOD - Regex pattern
z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  "Must be a valid UUID"
)

// BAD - Deprecated
z.uuid() // Shows deprecation warning
```

**Schema Validation** - Always validate untrusted input:

```typescript
const schema = z.object({
  field: z.string(),
})

const result = schema.safeParse(input)
if (!result.success) {
  // Handle validation error
  return { error: result.error.message }
}

// Use validated data
return result.data
```
