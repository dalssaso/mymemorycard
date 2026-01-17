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
  features/         # Feature modules (credentials, import, library)
  hooks/            # Custom hooks (useLibraryFilters, useAnimatedNumber)
  lib/              # Utilities (api.ts - Axios client)
  pages/            # Page components (Library, GameDetail, Collections, etc.)
  routes/           # TanStack Router file-based routes
  shared/           # Shared utilities, types, API services, stores
    api/            # API client, services, and generated SDK
    types/          # Canonical shared types
    stores/         # Zustand stores
  test/             # Test utilities and shared mocks
  routeTree.gen.ts  # Auto-generated route tree (do not edit)
```

## Type Safety

Trust generated types. When the OpenAPI SDK guarantees a field exists, access it directly. Remove defensive checks and type assertions that duplicate what the types already enforce.

Use shared canonical types from `@/shared/types` instead of defining local duplicates. Keep shared types aligned with generated API types (use `string | null` for nullable fields, matching the SDK).

Import types explicitly:

```typescript
import type { CredentialService, GameSearchResult } from "@/shared/types"
```

## API Services

Use generated SDK functions from `@/shared/api/generated` for `/api/v1` endpoints. Call SDK functions with `throwOnError: true` to let errors propagate. Reserve the raw `apiClient` for endpoints the SDK does not cover.

Wrap SDK calls in service methods within `@/shared/api/services.ts`. Keep API access out of components; access data through services and hooks.

## Design System

Use semantic design tokens from `tailwind.config.js`. Map status states to tokens:

| State | Token Pattern |
|-------|---------------|
| Error | `bg-destructive/30 border-destructive text-destructive` |
| Warning | `bg-status-completed/30 border-status-completed text-status-completed` |
| Success | `bg-status-playing/30 border-status-playing text-status-playing` |
| Info | `bg-accent/30 border-accent text-accent` |

Raw Tailwind color classes (`bg-red-900`, `text-blue-300`) violate the design system. Replace them with semantic tokens.

## Testing

Use shared mock helpers from `@/test/mocks` instead of duplicating mocks across test files. Create mock functions once and export them for reuse.

Control time-dependent tests with Vitest fake timers. Wrap timer advancements and React state updates in `act()`:

```typescript
vi.useFakeTimers()

// Render hook
const { result } = renderHook(() => useHookWithDebounce(value, delay))

// Advance timers within act
await act(async () => {
  await vi.advanceTimersByTimeAsync(delay)
})

// Flush pending async operations
await act(async () => {
  await vi.runAllTimersAsync()
})

vi.useRealTimers()
```

## Data Fetching

Use TanStack Query for server state. Use route loaders with `ensureQueryData` for prefetching. Keep optimistic updates in mutation hooks.

## Error Handling

Display error states with retry actions. Extract error state from query hooks (`isError`, `error`, `refetch`) and render actionable feedback. Always provide a way for users to recover from failures.

## Auth + Layout

Auth state is cached under `["auth", "me"]` and backed by `auth-storage`. `AuthRedirectListener` handles 401 redirects across routes. Use `LayoutContext` to customize page layout and sidebars.

## UI Components

Base primitives live in `components/ui/` and import from `@/components/ui`. Filters and complex patterns live in `components/filters/`.

## API Standards

All new DI routes live under `/api/v1`. JSON and query payloads use `snake_case`. OpenAPI generates the SDK; the frontend consumes it for type-safe API calls.
