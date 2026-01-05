# Frontend CLAUDE.md

Frontend-specific instructions for Claude Code. See also the root [CLAUDE.md](../CLAUDE.md).

## Tech Stack

- **Runtime**: Node.js 20+ with npm
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routes)
- **State**: TanStack Query (server state), React Context (auth/theme)
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS with Catppuccin Mocha dark theme
- **UI Components**: shadcn/ui (Radix primitives)
- **Build**: Vite
- **Testing**: Vitest + Testing Library

## Documentation Lookup

Use **Context7 MCP** (if available) for up-to-date docs:

```
resolve-library-id: "shadcn ui"
query-docs: libraryId="/shadcn-ui/ui", query="dialog component"
```

## Commands

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

Run these commands after any modifications:

```bash
npm run lint && npm run typecheck
```

Fix any type errors before committing.

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

## shadcn/ui Components

### Adding New Components

```bash
# Install a shadcn component
npx shadcn@latest add dialog

# This creates: src/components/ui/dialog.tsx
# Configuration: components.json
```

### Component Standards

1. **Use shadcn components** for all UI primitives (Button, Input, Dialog, etc.)
2. **Never use raw HTML** elements like `<button>` or `<input>` - import from `@/components/ui`
3. **Extend shadcn variants** in the component file when needed
4. **Catppuccin theming** is pre-configured via CSS variables

```tsx
// Good - use shadcn Button
import { Button } from "@/components/ui/Button"
<Button variant="secondary" size="sm">Click</Button>

// Bad - raw button
<button className="...">Click</button>
```

### Dialog/Modal Pattern

Use shadcn Dialog for all modals:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
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

### Custom Hooks

Encapsulate query/mutation logic in dedicated hooks under `src/hooks/`:

```typescript
// src/hooks/useGames.ts - Query hook
export function useGames(filters: LibraryFilters): UseQueryResult<GamesResponse> {
  return useQuery({
    queryKey: ["games", filters],
    queryFn: async () => {
      const response = await gamesAPI.getAll(filters)
      return response.data as GamesResponse
    },
  })
}

// src/hooks/useGameMutations.ts - Mutation hooks
export function useToggleFavorite(): UseMutationResult<...> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  return useMutation({ ... })
}
```

**Existing hooks:**
- `useGames`, `useCollections`, `useUserPlatforms` - Query hooks
- `useGameMutations` - Toggle favorite, update status, delete, rating
- `useCollectionMutations` - CRUD operations for collections
- `useAISettings`, `usePreferences`, `useActivityFeed`, `useAchievementStats`

### Route Loaders

Prefetch data in route loaders using `ensureQueryData`:

```typescript
// src/routes/library.index.tsx
export const Route = createFileRoute("/library/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["games"],
      queryFn: async () => {
        const response = await gamesAPI.getAll()
        return response.data
      },
    })
  },
  component: Library,
})
```

### Optimistic Updates

For mutations that update UI immediately:

```typescript
export function useToggleFavorite(): UseMutationResult<...> {
  return useMutation({
    mutationFn: async (variables) => { ... },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["games"] })
      const previousData = queryClient.getQueryData(["games"])

      // Optimistically update cache
      queryClient.setQueryData(["games"], (old) => ({
        ...old,
        games: old.games.map((g) =>
          g.id === variables.gameId ? { ...g, is_favorite: variables.isFavorite } : g
        ),
      }))

      return { previousData }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      queryClient.setQueryData(["games"], context?.previousData)
      showToast("Failed to update", "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] })
    },
  })
}
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
| Dialog | Modal dialogs (shadcn) |
| AlertDialog | Confirmation dialogs (shadcn) |
| DropdownMenu | Context menus (shadcn) |
| Tabs | Tab navigation (shadcn) |
| Command | Command palette/combobox (shadcn) |

### Location: `components/filters/`

| Component | Description |
|-----------|-------------|
| SortControl | Sort dropdown (11 options) |
| GenreFilter | Genre buttons with counts |
| CollectionFilter | Collection dropdown |
| FranchiseFilter | Franchise dropdown |
| ActiveFilterPills | Removable badges for active filters |

### Component Guidelines

1. Define TypeScript interface for props
2. Include ARIA attributes for interactive elements
3. Use `ctp-*` theme colors for consistency
4. Use `@/*` path alias for imports
5. Follow code style rules from root [CLAUDE.md](../CLAUDE.md)
6. Use shadcn/ui components - never raw HTML buttons/inputs
7. Use explicit return types on all functions (including hooks)

## Reference Files

When implementing UI features:
- **Detail pages**: `pages/GameDetail.tsx`, `pages/CollectionDetail.tsx`
- **Sidebars**: `components/sidebar/`
- **Base components**: `components/ui/`
