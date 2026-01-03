# CLAUDE.md

Project-wide instructions for Claude Code. See also:
- [frontend/CLAUDE.md](frontend/CLAUDE.md) - Frontend-specific guidance
- [backend/CLAUDE.md](backend/CLAUDE.md) - Backend-specific guidance
- [docs/CLAUDE.md](docs/CLAUDE.md) - Documentation guidance

## Project Overview

MyMemoryCard is a self-hosted game library aggregator for tracking your gaming collection across platforms.

**Tech Stack:**
- **Backend**: Bun, TypeScript, PostgreSQL 16+, Redis, Drizzle ORM
- **Frontend**: React 18, Vite, TanStack (Router, Query, Table), Tailwind CSS

## Quick Start

```bash
docker compose up -d          # Start PostgreSQL (port 5433) + Redis (port 6380)
cd backend && bun run dev     # Backend on :3000
cd frontend && npm run dev    # Frontend on :5173
```

Or use Make:

```bash
make install                  # Install all dependencies
make dev                      # Start infrastructure
make dev-backend              # Start backend (separate terminal)
make dev-frontend             # Start frontend (separate terminal)
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run typecheck` | Type check both projects |
| `npm run format` | Prettier all files |
| `npm test` | Run frontend tests |
| `make help` | Show all make commands |

## Code Style

### Critical Rules

- **NO EMOJIS** in code, logs, console output, error messages, or commits
- **No semicolons** (Prettier config)
- **Single quotes**, 2 spaces, 100 char line width
- **TypeScript strict mode** - no `any` without justification

### Naming

- PascalCase: types, interfaces, components
- camelCase: variables, functions
- SCREAMING_SNAKE_CASE: constants

### Imports Order

```typescript
import { describe } from 'bun:test'        // Test framework
import externalLib from 'external-package' // External
import { router } from '@/lib/router'      // Internal (@/ alias)
import type { Game } from '@/types'        // Type imports with 'type'
```

### Path Alias

Both projects use `@/*` to map to `src/*`:

```typescript
import { gamesAPI } from '@/lib/api'
import { db } from '@/services/db'
```

## Testing

Frontend tests only (backend tests currently disabled):

```bash
cd frontend && npm test       # Run vitest
npm run test:coverage         # With 90% coverage threshold
```

Backend changes: verify with `bun run typecheck` and manual testing.

## Database

```bash
make db-shell                 # Open PostgreSQL shell
make db-generate              # Generate migration from schema changes
make db-studio                # Browse with Drizzle Studio
```

Connection: `postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard`

Migrations run automatically on backend startup.

## Commit Format

```
type: short description

Optional longer description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

Releases are automated via release-please based on conventional commits.

**Commit only after user tests and confirms changes work.**
