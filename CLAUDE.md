# CLAUDE.md

Project-wide instructions for Claude Code. See also:

- [frontend/CLAUDE.md](frontend/CLAUDE.md) - Frontend guidance
- [backend/CLAUDE.md](backend/CLAUDE.md) - Backend guidance
- [docs/CLAUDE.md](docs/CLAUDE.md) - Documentation guidance

## Project Overview

MyMemoryCard aggregates game libraries across platforms for self-hosted tracking.

**Tech Stack:**

- **Backend**: Bun, TypeScript, PostgreSQL 16+, Redis, Drizzle ORM
- **Frontend**: React 18, Vite, TanStack (Router, Query, Table), Tailwind CSS, shadcn/ui

## Documentation Lookup

Use **Context7 MCP** to fetch current documentation when implementing features:

```
# Resolve library ID first
resolve-library-id: "tanstack query"

# Then query docs
query-docs: libraryId="/tanstack/query", query="optimistic updates mutation"
```

Query these libraries:

- `/tanstack/query` - Server state, mutations, optimistic updates
- `/tanstack/router` - File-based routing, loaders
- `/shadcn-ui/ui` - UI components, installation
- `/tailwindlabs/tailwindcss` - Styling utilities

## Quick Start

```bash
docker compose up -d          # PostgreSQL (port 5433) + Redis (port 6380)
cd backend && bun run dev     # Backend on :3000
cd frontend && npm run dev    # Frontend on :5173
```

Make commands:

```bash
make install                  # Install all dependencies
make dev                      # Start infrastructure
make dev-backend              # Start backend (separate terminal)
make dev-frontend             # Start frontend (separate terminal)
```

## Git Worktrees

Git worktrees (`.worktrees/` directory):

**Critical Rules:**

- **Commit changes in the worktree**, not in the main repository
- Verify location before committing: `git rev-parse --show-toplevel`

**Setup Requirements:**

Bootstrap the environment after creating or switching to a worktree:

```bash
# Install dependencies
bun install          # Backend dependencies
npm install          # Frontend dependencies

# Setup git hooks (required)
npx husky install    # Enable pre-commit hooks
```

**Pre-commit Hooks:**

- **Fix all pre-commit failures** (never use `--no-verify`)
- Fix linting, formatting, and type errors shown by hooks
- Hooks enforce code quality and prevent broken commits

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

Run these commands after `feat`, `fix`, `refactor`, or `chore` changes:

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

## Configuration Files - DO NOT MODIFY

**EXPLICITLY PROHIBITED** without asking the user first:

- `.prettierrc` / `prettier.config.js` - Formatting rules
- `.eslintrc` / `eslint.config.ts` - Linting rules
- `.commitlint.config.ts` - Commit message rules
- `tsconfig.json` - TypeScript configuration
- Any other style, guide, or linting configuration files

**Rule:** When tools report errors or violations, **FIX THE CODE**, never modify the configuration files to suppress them.

If a tool is reporting issues that seem incorrect or overly strict, **ask the user first** before considering any config changes. The configuration represents the project's standards and must be respected.

## Code Style

### Prettier (enforced)

- 2 spaces, no tabs
- No semicolons
- 100 character line width
- Trailing commas (ES5)
- Arrow function parens: always `(x) => x`

**Format all changes before committing:**

```bash
# Backend
cd backend && bun run format

# Frontend
cd frontend && npm run format

# Or from root for both
npm run format
```

Never commit unformatted code. The project's `.prettierrc` files define the exact formatting rules—respect them while developing and before creating commits.

### TypeScript (ESLint enforced)

- **NO EMOJIS** in code, logs, console output, error messages, or commits
- **No `any`** - use proper types or `unknown`
- **Explicit return types** on functions
- **Type imports** use `import type { X }` or `import { type X }`

### Naming Conventions (ESLint enforced)

| Element    | Convention                                      |
| ---------- | ----------------------------------------------- |
| Variables  | `camelCase`, `UPPER_CASE`, `snake_case`         |
| Parameters | `camelCase` (leading `_` for unused)            |
| Functions  | `camelCase`                                     |
| Types      | `PascalCase`                                    |
| Interfaces | `PascalCase`                                    |
| Components | `PascalCase`                                    |
| Constants  | `SCREAMING_SNAKE_CASE`                          |
| Properties | `camelCase`, `snake_case` (or with `-` `/`)     |

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

Frontend tests only (backend tests disabled):

```bash
cd frontend && npm test       # Run vitest
npm run test:coverage         # 90% coverage threshold
```

Verify backend changes with `bun run typecheck` and manual testing.

## Database

```bash
make db-shell                 # Open PostgreSQL shell
make db-generate              # Generate migration from schema changes
make db-studio                # Browse with Drizzle Studio
```

Connection: `postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard`

Migrations run on backend startup.

## Commit Format

```
type: short description
```

Rules (commitlint enforced):

- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`
- **Subject**: lowercase, no period
- **Header**: 100 characters maximum

Examples:

```
feat: add user authentication
fix: resolve null pointer in game search
refactor: extract api client to separate module
```

Release-please automates releases from conventional commits.

**Commit only after user confirms changes work.**

## Frontend Patterns

See [frontend/CLAUDE.md](frontend/CLAUDE.md) for detailed patterns on:

- shadcn/ui component usage and creation
- Custom hooks for queries and mutations
- Route loaders with `ensureQueryData`
- Optimistic updates
