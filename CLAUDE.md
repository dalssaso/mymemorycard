# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MyMemoryCard is a self-hosted game library aggregator built with:
- **Backend**: Bun runtime, TypeScript, PostgreSQL 16+, Redis, Drizzle ORM
- **Frontend**: React 19, Vite, TanStack (Router, Query, Table), Tailwind CSS

## Development Commands

### Quick Start
```bash
docker compose up -d          # Start PostgreSQL (port 5433) + Redis (port 6380)
cd backend && bun run dev     # Backend on :3000
cd frontend && npm run dev    # Frontend on :5173
```

### Backend (Bun)
```bash
bun run dev                   # Dev server with hot reload
bun run typecheck             # TypeScript checking
bun run db:generate           # Generate migration from schema changes
```

### Frontend (npm)
```bash
npm run dev                   # Dev server
npm run build                 # Production build
npm test                      # Run vitest tests
npm run test:coverage         # Tests with coverage
npm run typecheck             # TypeScript checking
```

### Root Commands
```bash
npm test                      # Frontend tests
npm run typecheck             # Type check both projects
npm run format                # Prettier all files
make help                     # Show all make commands
```

## Architecture

### Backend Structure (`backend/src/`)
- **routes/**: API route handlers (games.ts, collections.ts, auth.ts, etc.)
- **services/**: db.ts (PostgreSQL), redis.ts, rawg.ts (game metadata API)
- **middleware/**: auth.ts (JWT), cors.ts
- **db/schema.ts**: Drizzle ORM schema - migrations auto-run on startup
- **lib/router.ts**: Custom lightweight router with path parameters

### Frontend Structure (`frontend/src/`)
- **pages/**: Route components (Library, GameDetail, Collections, Dashboard, etc.)
- **components/**: UI components and layout (sidebar/, ui/)
- **lib/api.ts**: Axios client with Bearer token and organized API methods
- **routes/**: TanStack Router file-based routes (auto-generates routeTree.gen.ts)

### Key Patterns
- Path alias: `@/*` maps to `src/*` in both projects
- API proxy: Frontend dev server proxies /api to backend port 3000
- State: TanStack Query for server state, React Context for auth
- Styling: Tailwind with Catppuccin Mocha dark theme

## Code Style

### Critical Rules
- **NO EMOJIS** in code, logs, console output, error messages, or commits (UI only exception)
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

## Testing

**Frontend only** - backend tests currently disabled due to stability issues.

```bash
cd frontend && npm test       # Run all tests
npm run test:coverage         # With coverage (90% threshold)
```

Backend changes should be verified with `bun run typecheck` and manual testing.

## Database

- PostgreSQL on port 5433 (Docker), Redis on port 6380
- Connection: `postgresql://mymemorycard:devpassword@localhost:5433/mymemorycard`
- Use Drizzle ORM for queries (schema in `backend/src/db/schema.ts`)
- Transactions for multi-statement operations

```bash
make db-generate              # Generate migration after schema changes
make db-studio                # Browse data with Drizzle Studio
```

## Commit Format

```
type: short description

Optional longer description
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

**Commit only after user tests and confirms changes work.**

## UI Reference Files

When implementing UI features, reference these patterns:
- **Detail pages**: `GameDetail.tsx`, `CollectionDetail.tsx`
- **Sidebars**: `components/sidebar/`
- **UI components**: `components/ui/Button.tsx`, `Card.tsx`

Status colors: backlog (gray), playing (cyan), finished (green), completed (yellow), dropped (red)

## UI Components

### When to Create Components

Create reusable components when:
- Pattern used 3+ times across codebase
- Complex interaction logic (dropdowns, modals, forms)
- Consistent behavior is critical

### Existing Components

**Location**: `frontend/src/components/ui/`

- **Button**: Standard button with variants (primary, secondary, danger)
- **Card**: Container with consistent padding and border styling
- **Badge**: Small status/label indicators
- **Input**: Text inputs with consistent styling and error states
- **Checkbox**: Checkbox with Catppuccin styling
- **Select**: Custom dropdown with color coding, metadata, keyboard nav
  - Use instead of native `<select>` for better UX
  - Supports color-coded options (status colors)
  - Supports metadata display (counts, icons)
  - Full ARIA support and keyboard navigation
  - Example: `<Select id="filter" value={val} onChange={handleChange} options={opts} />`
- **ScrollFade**: Scrollable container with fade effects
- **Toast**: Notification system via useToast hook
- **Skeleton**: Loading state placeholders

**Location**: `frontend/src/components/filters/`

- **SortControl**: Sort dropdown for library view (11 sort options)
- **GenreFilter**: Genre selection buttons with counts
- **CollectionFilter**: Collection dropdown filter
- **FranchiseFilter**: Franchise/series dropdown filter
- **ActiveFilterPills**: Removable pill badges for active filters

### Component Guidelines

1. **Prop naming**: Use descriptive names, avoid abbreviations
2. **TypeScript**: Always define interface for props
3. **Accessibility**: Include ARIA attributes for interactive elements
4. **Tailwind**: Use theme colors (ctp-*) for consistency
5. **No emojis**: Never use emojis in component code/logs
6. **Imports**: Use `@/*` path alias for all internal imports
