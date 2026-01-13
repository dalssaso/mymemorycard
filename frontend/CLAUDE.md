# Frontend CLAUDE.md

Frontend instructions for Claude Code. See root [CLAUDE.md](../CLAUDE.md).

## Tech Stack

- **Runtime**: Node.js 20+ with npm
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routes)
- **State**: TanStack Query (server state), React Context (auth/theme)
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS with semantic design tokens
- **UI Components**: shadcn/ui (Radix primitives)
- **Build**: Vite
- **Testing**: Vitest + Testing Library

## Documentation Lookup

Use **Context7 MCP** for current docs:

```
resolve-library-id: "shadcn ui"
query-docs: libraryId="/shadcn-ui/ui", query="dialog component"
```

## Commands

Preferred (root):

```bash
just dev-frontend
just lint-frontend
just typecheck-frontend
just test-unit-frontend
just build-frontend
```

Direct (frontend directory):

```bash
npm run dev           # Dev server on :5173
npm run build         # Production build (tsc + vite)
npm test              # Run vitest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (90% threshold)
npm run typecheck     # TypeScript checking
npm run lint          # ESLint with zero warnings allowed
npm run lint:fix      # ESLint with auto-fix
```

## After Every Code Change

Run after modifications:

```bash
just lint-frontend && just typecheck-frontend
```

Fix type errors before committing.

## Directory Structure

```
src/
  components/       # Reusable UI components
    filters/        # Library filter components (Sort, Genre, Collection, etc.)
    layout/         # Layout components
    sidebar/        # Sidebar navigation components
    ui/             # Base UI primitives (Button, Card, Input, Select, etc.)
  contexts/         # React contexts (Auth, Sidebar, Theme)
  hooks/            # Custom hooks (useLibraryFilters, useAnimatedNumber)
  lib/              # Utilities (api.ts - Axios client)
  pages/            # Page components (Library, GameDetail, Collections, etc.)
  routes/           # TanStack Router file-based routes
  routeTree.gen.ts  # Auto-generated route tree (do not edit)
```

## UI + API Rules

- Use shadcn/ui primitives and import from `@/components/ui`.
- Prefer semantic design tokens over raw Tailwind classes.
- Keep components and hooks consuming `snake_case` fields.
- Use the generated API client for `/api/v1` endpoints.
- Avoid in-component API wiring; keep API access in `lib/api/`.

## Data Fetching

- Use TanStack Query for server state.
- Use route loaders with `ensureQueryData` for prefetching.
- Keep optimistic updates in mutation hooks.

## Auth + Layout

- Auth state is cached under `["auth", "me"]` and backed by `auth-storage`.
- `AuthRedirectListener` handles 401 redirects across routes.
- Use `LayoutContext` to customize page layout/sidebars.

## UI Components

- Base primitives live in `components/ui/`.
- Filters and complex patterns live in `components/filters/`.

## API Standards

- `/api/v1` for all new DI routes.
- JSON and query payloads use `snake_case`.
- OpenAPI is generated from the DI app and used for frontend codegen.
- Reference: `docs/architecture/guidelines.md`.
