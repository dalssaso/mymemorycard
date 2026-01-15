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

Use **Context7 MCP** to fetch current documentation when implementing features.

Query these libraries:
- `/tanstack/query` - Server state, mutations, optimistic updates
- `/tanstack/router` - File-based routing, loaders
- `/shadcn-ui/ui` - UI components, installation
- `/tailwindlabs/tailwindcss` - Styling utilities

## API Standards

- All new DI routes live under `/api/v1`.
- JSON and query payloads use `snake_case`.
- OpenAPI is generated from the DI app and used for frontend codegen.
- Reference: `docs/architecture/guidelines.md`.

## Quick Start

```bash
just dev                      # PostgreSQL (port 5433) + Redis (port 6380)
just dev-backend              # Backend on :3000
just dev-frontend             # Frontend on :5173
```

Just commands:

```bash
just setup                    # Install all dependencies + git hooks
just dev                      # Start infrastructure
just dev-backend              # Start backend (separate terminal)
just dev-frontend             # Start frontend (separate terminal)
```

## Git Worktrees

Git worktrees (`.worktrees/` directory):

**Critical Rules:**

- **Commit changes in the worktree**, not in the main repository
- Verify location before committing: `git rev-parse --show-toplevel`

**Setup Requirements:**

Bootstrap the environment after creating or switching to a worktree:

```bash
just setup           # Install dependencies + enable git hooks
```

**Pre-commit Hooks:**

- **Fix all pre-commit failures** (never use `--no-verify`)
- Fix linting, formatting, and type errors shown by hooks
- Hooks enforce code quality and prevent broken commits

## Commands Reference

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `just ci`               | Lint/typecheck/format-check (both) |
| `just lint`             | Run ESLint on both        |
| `just typecheck`        | Type check both projects  |
| `just format`           | Prettier format both      |
| `just format-check`     | Check formatting          |
| `just test`             | Run frontend + backend tests |
| `just build`            | Build local images (both) |

## After Every Code Change

Run these commands after `feat`, `fix`, `refactor`, or `chore` changes:

```bash
just lint
just typecheck
just format-check
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
just format
```

Never commit unformatted code. The project's `.prettierrc` files define the exact formatting rules—respect them while developing and before creating commits.

### TypeScript (ESLint enforced)

- **NO EMOJIS** in code, logs, console output, error messages, or commits
- **No `any`** - use proper types or `unknown`
- **Explicit return types** on functions
- **Type imports** use `import type { X }` or `import { type X }`
- **JSDoc** for all public methods (frontend and backend)

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

Tests are available for both packages:

```bash
just test                     # Unit + integration (backend) + frontend tests
just test-unit                # Unit tests only
just test-integration         # Backend integration tests (requires Docker + backend)
just test-coverage            # Coverage reports
```

### Integration Test Rules

- Run backend integration tests from `backend/` directory to load `.env` file
- Ensure Docker infrastructure is running before integration tests (`just dev`)
- Always verify setup requests succeeded before using response data
- Track created resources for cleanup to prevent test pollution
- Test authorization boundaries (cross-user access should return 404)

### Test Code Quality

- Do NOT add explicit type annotations when type can be inferred from literal
- Use shared mock helpers instead of duplicating mock implementations
- Follow import order: test framework, reflect-metadata, external, internal

## Database

```bash
just db-shell                 # Open PostgreSQL shell
just db-generate              # Generate migration from schema changes
just db-studio                # Browse with Drizzle Studio
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

## Security Patterns

- Never return 403 Forbidden for cross-user resource access - use 404 Not Found instead
- This prevents attackers from discovering which resources exist
- Validate resource ownership in service layer, not controller
- Let domain errors bubble up to the global error handler

## Error Handling

- Use domain-specific error classes (NotFoundError, ConflictError, ValidationError)
- Never expose internal error details in API responses
- Database constraint violations should be translated to domain errors
- Drizzle ORM wraps database errors - check nested error structures

## Frontend Patterns

See [frontend/CLAUDE.md](frontend/CLAUDE.md) for detailed patterns on:

- shadcn/ui component usage and creation
- Custom hooks for queries and mutations
- Route loaders with `ensureQueryData`
- Optimistic updates
