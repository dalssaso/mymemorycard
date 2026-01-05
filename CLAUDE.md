# CLAUDE.md

Project-wide instructions for Claude Code. See also:

- [frontend/CLAUDE.md](frontend/CLAUDE.md) - Frontend-specific guidance
- [backend/CLAUDE.md](backend/CLAUDE.md) - Backend-specific guidance
- [docs/CLAUDE.md](docs/CLAUDE.md) - Documentation guidance

## Project Overview

MyMemoryCard is a self-hosted game library aggregator for tracking your gaming collection across
platforms.

**Tech Stack:**

- **Backend**: Bun, TypeScript, PostgreSQL 16+, Redis, Drizzle ORM
- **Frontend**: React 18, Vite, TanStack (Router, Query, Table), Tailwind CSS, shadcn/ui

## Documentation Lookup

When implementing features, use **Context7 MCP** (if available) to fetch up-to-date documentation:

```
# Resolve library ID first
resolve-library-id: "tanstack query"

# Then query docs
query-docs: libraryId="/tanstack/query", query="optimistic updates mutation"
```

Useful libraries to query:
- `/tanstack/query` - Server state, mutations, optimistic updates
- `/tanstack/router` - File-based routing, loaders
- `/shadcn-ui/ui` - UI components, installation
- `/tailwindlabs/tailwindcss` - Styling utilities

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

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `npm run typecheck`     | Type check both projects  |
| `npm run format`        | Prettier all files        |
| `npm run format:check`  | Check formatting          |
| `npm run lint:backend`  | Run ESLint on backend     |
| `npm run lint:frontend` | Run ESLint on frontend    |
| `npm test`              | Run frontend tests        |
| `make help`             | Show all make commands    |

## After Every Code Change

Run these commands after any `feat`, `fix`, `refactor`, or `chore` modifications:

```bash
# Backend changes
cd backend && bun run lint && bun run typecheck

# Frontend changes
cd frontend && npm run lint && npm run typecheck

# Or from root for both
npm run lint:backend && npm run typecheck
npm run lint:frontend && npm run typecheck
npm run format:check
```

Fix any lint/type errors before committing.

## Code Style

### Prettier (enforced)

- 2 spaces, no tabs
- No semicolons
- 100 character line width
- Trailing commas (ES5)
- Arrow function parens: always `(x) => x`

### TypeScript (enforced by ESLint)

- **NO EMOJIS** in code, logs, console output, error messages, or commits
- **No `any`** - use proper types or `unknown`
- **Explicit return types** on all functions
- **Type imports** must use `import type { X }` or `import { type X }`

### Naming Conventions (enforced by ESLint)

| Element    | Convention                                        |
| ---------- | ------------------------------------------------- |
| Variables  | `camelCase`, `UPPER_CASE`, `snake_case`           |
| Parameters | `camelCase` (leading `_` allowed for unused)      |
| Functions  | `camelCase`                                       |
| Types      | `PascalCase`                                      |
| Interfaces | `PascalCase`                                      |
| Components | `PascalCase`                                      |
| Constants  | `SCREAMING_SNAKE_CASE`                            |
| Properties | `camelCase`, `snake_case` (or any with `-` `/`)   |

### Imports Order

```typescript
import { describe } from 'bun:test'        // Test framework
import externalLib from 'external-package' // External
import { router } from '@/lib/router'      // Internal (@/ alias)
import { type Game } from '@/types'        // Type imports inline
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
```

Rules (enforced by commitlint):

- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- **Subject**: lowercase, no period at end
- **Header max length**: 100 characters

Examples:

```
feat: add user authentication
fix: resolve null pointer in game search
refactor: extract api client to separate module
```

Releases are automated via release-please based on conventional commits.

**Commit only after user tests and confirms changes work.**

## Frontend Patterns

See [frontend/CLAUDE.md](frontend/CLAUDE.md) for detailed patterns on:
- shadcn/ui component usage and creation
- Custom hooks for queries and mutations
- Route loaders with `ensureQueryData`
- Optimistic updates
