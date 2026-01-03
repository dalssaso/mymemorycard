# Frontend CLAUDE.md

Frontend-specific instructions for Claude Code. See also the root [CLAUDE.md](../CLAUDE.md).

## Tech Stack

- **Runtime**: Node.js 20+ with npm
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routes)
- **State**: TanStack Query (server state), React Context (auth/theme)
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS with Catppuccin Mocha dark theme
- **Build**: Vite
- **Testing**: Vitest + Testing Library

## Commands

```bash
npm run dev           # Dev server on :5173
npm run build         # Production build (tsc + vite)
npm test              # Run vitest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (90% threshold)
npm run typecheck     # TypeScript checking
```

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

## Key Patterns

### API Client

All API calls go through `lib/api.ts`:

```typescript
import api, { gamesAPI, collectionsAPI } from '@/lib/api'

// Use the organized API methods
const games = await gamesAPI.getAll({ status: 'playing' })
const game = await gamesAPI.getOne(id)
```

The client automatically:
- Adds Bearer token from localStorage
- Redirects to /login on 401 responses
- Proxies /api requests to backend in dev mode

### TanStack Router

Routes are file-based in `src/routes/`. The route tree is auto-generated.

```typescript
// src/routes/library.tsx
export const Route = createFileRoute('/library')({
  component: Library,
})
```

### TanStack Query

Use for all server state:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['games', filters],
  queryFn: () => gamesAPI.getAll(filters),
})
```

### Styling

Use Tailwind with Catppuccin theme colors (`ctp-*` prefix):

```tsx
<div className="bg-ctp-base text-ctp-text border-ctp-surface0">
  <span className="text-ctp-green">Success</span>
</div>
```

Status colors:
- backlog: `ctp-overlay0` (gray)
- playing: `ctp-teal` (cyan)
- finished: `ctp-green`
- completed: `ctp-yellow`
- dropped: `ctp-red`

## UI Components

### Location: `components/ui/`

| Component | Description |
|-----------|-------------|
| Button | Standard button with variants (primary, secondary, danger) |
| Card | Container with consistent padding and border styling |
| Badge | Small status/label indicators |
| Input | Text inputs with styling and error states |
| Checkbox | Styled checkbox |
| Select | Custom dropdown with keyboard nav, color coding, metadata |
| ScrollFade | Scrollable container with fade effects |
| Toast | Notification system via useToast hook |
| Skeleton | Loading state placeholders |

### Location: `components/filters/`

| Component | Description |
|-----------|-------------|
| SortControl | Sort dropdown (11 options) |
| GenreFilter | Genre buttons with counts |
| CollectionFilter | Collection dropdown |
| FranchiseFilter | Franchise dropdown |
| ActiveFilterPills | Removable badges for active filters |

### Component Guidelines

1. Always define TypeScript interface for props
2. Include ARIA attributes for interactive elements
3. Use `ctp-*` theme colors for consistency
4. Use `@/*` path alias for imports
5. No emojis in code or logs

## Reference Files

When implementing UI features:
- **Detail pages**: `pages/GameDetail.tsx`, `pages/CollectionDetail.tsx`
- **Sidebars**: `components/sidebar/`
- **Base components**: `components/ui/`
