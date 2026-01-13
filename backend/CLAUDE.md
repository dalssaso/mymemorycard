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
just lint-backend && just typecheck-backend
```

Fix errors before committing. Lint runs with `--max-warnings=0`.

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
    stats.ts          # Dashboard statistics
    ...
  services/
    db.ts             # PostgreSQL connection
    redis.ts          # Redis connection
    rawg.ts           # RAWG API client
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

Prefer Drizzle queries with typed schema imports and transactions for multi-step writes.

### Database Migrations

**IMPORTANT**: Use Drizzle's migration workflow (never create SQL files manually):
1. Modify `schema.ts`.
2. Generate migrations with `bun run db:generate`.
3. Review generated SQL in `drizzle/`.
4. Apply with `bun run db:migrate` (also runs on backend startup).

**For data migrations** (deleting records, transforming data):
1. Create schema-only migration with `db:generate`
2. Edit generated SQL to add data migration logic
3. Apply with `db:migrate`

## Router

Custom lightweight router in `lib/router.ts`:
Use the router for legacy `/api` routes only. New DI routes live under `/api/v1`.

## Authentication

JWT-based auth with optional WebAuthn. DI auth endpoints are versioned under `/api/v1`.

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

Return JSON with `snake_case` fields and include a `Content-Type` header.

## API Standards

- `/api/v1` for all new DI routes.
- JSON and query payloads use `snake_case`.
- OpenAPI is generated from the DI app and used for frontend codegen.
- Reference: `docs/architecture/guidelines.md`.
