# Backend CLAUDE.md

Backend-specific instructions for Claude Code. See also the root [CLAUDE.md](../CLAUDE.md).

## Tech Stack

- **Runtime**: Bun 1.0+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 16+ via Drizzle ORM
- **Cache**: Redis
- **Auth**: JWT (jsonwebtoken) + WebAuthn (passkeys)
- **External API**: RAWG for game metadata

## Commands

```bash
bun run dev           # Dev server with hot reload on :3000
bun run start         # Production start
bun run typecheck     # TypeScript checking
bun run db:generate   # Generate migration from schema changes
bun run db:migrate    # Apply pending migrations
bun run db:push       # Push schema directly (dev only)
bun run db:studio     # Open Drizzle Studio GUI
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

Migrations run automatically on backend startup.

### Schema Overview

Key tables in `src/db/schema.ts`:

| Table | Description |
|-------|-------------|
| users | User accounts |
| games | Game metadata (from RAWG) |
| userGames | User's library entries (ownership per platform) |
| userGameProgress | Status, rating, completion, favorites |
| playSessions | Play session tracking |
| completionLogs | Completion percentage history |
| collections | User-created game collections |
| platforms | Gaming platforms (Steam, PSN, etc.) |
| userPlatforms | User's connected platforms |
| achievements | Game achievements |
| gameAdditions | DLC and editions |

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

## Router

Custom lightweight router in `lib/router.ts`:

```typescript
import { router } from '@/lib/router'

// Define routes with path parameters
router.get('/api/games/:id', getGameHandler, true)  // true = requires auth
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

Backend tests are currently disabled due to stability issues.

Verify changes with:
```bash
bun run typecheck
```

And manual testing against the running server.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | `postgresql://...@localhost:5433/mymemorycard` | PostgreSQL connection |
| REDIS_URL | `redis://localhost:6380` | Redis connection |
| JWT_SECRET | `dev-jwt-secret-change-in-production` | JWT signing key |
| RAWG_API_KEY | - | RAWG API for game metadata |
| PORT | `3000` | Server port |
| ORIGIN | - | Additional CORS origin |

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
