# Contributing to MyMemoryCard

Thanks for contributing. This guide reflects current workflow and migration standards.

## Quick References

- Project rules: `CLAUDE.md`
- Backend rules: `backend/CLAUDE.md`
- Frontend rules: `frontend/CLAUDE.md`
- Architecture + API standards: `docs/architecture/guidelines.md`

## Getting Started

Prerequisites:

- Bun 1.x+
- Node.js 20+
- Docker + Docker Compose
- `just` task runner

Setup:

```bash
just setup
cp backend/.env.example backend/.env

# edit with the file with values you want to change
```

Run locally:

```bash
just dev            # Postgres + Redis
just dev-backend    # :3000
just dev-frontend   # :5173
```

## Development Workflow

1. Create a feature branch.
2. Implement changes in the relevant package(s).
3. Add or update tests for new behavior.
4. Run checks before committing:
   - `just lint`
   - `just typecheck`
   - `just format-check`
5. If you touch `/api/v1` routes or schemas:
   - `cd backend && bun run generate:openapi`
   - `cd frontend && npm run generate:api`
   - Commit generated artifacts.

Pre-commit hooks run automatically. Fix failures instead of bypassing.

## Code Standards

- **No emojis** in code, logs, console output, or error messages.
- **No `any`**. Use proper types or `unknown`.
- **Explicit return types** for functions.
- **Type imports** use `import type { X }`.
- **JSDoc** for all public methods (frontend and backend).

Formatting:

- 2 spaces
- No semicolons
- 100 character line width
- Trailing commas (ES5)
- Arrow function parens: always `(x) => x`

Do not modify lint/format/tsconfig settings without approval.

## API + DI Migration Standards

- All new DI routes live under `/api/v1`.
- Legacy routes remain under `/api` until migration is complete.
- JSON and query payloads use `snake_case`.
- Error payloads use `snake_case` (for example, `request_id`).
- OpenAPI is generated from the DI app and the generated client is committed.
- Frontend uses the generated client for `/api/v1`; adapters (if needed) live at the API boundary only.

See `docs/architecture/guidelines.md` for the full policy and migration rules.

## Testing

Run full tests:

```bash
just test
```

Backend integration tests require Docker and the backend services:

```bash
just dev
just test-integration
```

## Commit Guidelines

Use conventional commits:

```
type: short description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
Keep the subject lowercase and under 100 characters.
