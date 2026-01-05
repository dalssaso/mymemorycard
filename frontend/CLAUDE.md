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

### Status Configuration System

Centralized status management with consistent styling and icons:

```typescript
// lib/constants/status.ts
import { getStatusConfig } from '@/lib/constants/status'

// Get configuration for a status
const config = getStatusConfig('playing')
// { id: 'playing', label: 'Playing', icon: '...', color: 'ctp-teal', ... }
```

**StatusButton Component** - Reusable status button with two modes:

```tsx
import { StatusButton } from '@/components/ui/status-button'

// Collapsed mode (icon-only with tooltip)
<StatusButton
  id="playing"
  mode="collapsed"
  onClick={() => navigate('/library?status=playing')}
/>

// Expanded mode (icon + label + count)
<StatusButton
  id="playing"
  mode="expanded"
  isActive={activeStatus === 'playing'}
  count={42}
  onClick={() => setActiveStatus('playing')}
/>
```

**Available Status IDs:**
- `total` - Total games (mauve)
- `playing` - Currently playing (teal)
- `completed` - Finished games (green)
- `backlog` - Unplayed games (gray)
- `dropped` - Abandoned games (red)
- `favorites` - Favorite games (red with filled heart)

**Benefits:**
- Consistent styling across all status buttons
- Animated count transitions via `useAnimatedNumber`
- Color-mixed backgrounds using CSS variables
- Single source of truth for status metadata

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

### API Layer Modularization

API layer is organized into domain-based modules in `lib/api/`:

```typescript
// lib/api/games.ts
import { api } from "./axios"

export const gamesAPI = {
  getAll: (params?: { platform?: string; status?: string; ... }) =>
    api.get("/games", { params }),
  getOne: (id: string) => api.get(`/games/${id}`),
  delete: (id: string, platformId: string) =>
    api.delete(`/games/${id}`, { params: { platform_id: platformId } }),
  updateStatus: (id: string, platformId: string, status: string) =>
    api.patch(`/games/${id}/status`, { platform_id: platformId, status }),
  // ... more methods
}
```

**Barrel Export Pattern** (`lib/api/index.ts`):

```typescript
export { api } from "./axios"
export { authAPI } from "./auth"
export { gamesAPI } from "./games"
export { collectionsAPI } from "./collections"
export { franchisesAPI } from "./franchises"
// ... export types
export type { CompletionType } from "./completion-logs"
export type { GameAddition, AdditionType } from "./additions"
```

**Existing API Modules:**
- `auth.ts` - Login, register, me
- `games.ts` - Game CRUD, status, favorites, custom fields
- `collections.ts` - Collection management
- `franchises.ts` - Franchise data
- `platforms.ts` - Platform metadata
- `user-platforms.ts` - User's connected platforms
- `sessions.ts` - Play session tracking
- `stats.ts` - Achievement stats, activity feed, heatmap
- `preferences.ts` - User preferences
- `import.ts` - Game import operations
- `ai.ts` - AI curator endpoints
- `ownership.ts` - Game ownership/edition data
- `display-edition.ts` - Display edition management
- `completion-logs.ts` - Completion tracking
- `additions.ts` - DLC/expansions

**Guidelines:**
- One file per domain
- Export typed API object: `export const gamesAPI = { ... }`
- Export related types from same file
- Update barrel export in `index.ts`

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

**Query Hooks** (Data Fetching):

```typescript
// src/hooks/useGames.ts
export function useGames(filters: LibraryFilters): UseQueryResult<GamesResponse> {
  return useQuery({
    queryKey: ["games", filters],
    queryFn: async () => {
      const response = await gamesAPI.getAll(filters)
      return response.data as GamesResponse
    },
  })
}
```

**Existing Query Hooks:**
- `useGames` - Fetch games with filters
- `useGameSummaries` - Game summary data
- `useCollections` - Fetch collections
- `useFranchises` - Franchise data
- `usePlatforms` - Platform data
- `useUserPlatforms` - User's connected platforms
- `useUserPreferences` - User preferences
- `useAchievementStats` - Achievement statistics
- `useActivityFeed` - Activity feed data
- `useGenreStats` - Genre statistics
- `useAIModels` - AI model list
- `useAISettings` - AI configuration
- `usePreferences` - General preferences
- `useSearchData` - Global search (see Search section)

**Mutation Hooks** (Data Modification):

```typescript
// src/hooks/useGameMutations.ts
export function useToggleFavorite(): UseMutationResult<...> {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async ({ gameId, platformId, isFavorite }) => {
      const response = await gamesAPI.toggleFavorite(gameId, platformId, isFavorite)
      return response.data
    },
    onMutate: async (variables) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: ["games"] })

      // Snapshot previous state
      const previousGames = queryClient.getQueryData(["games"])

      // Optimistically update cache
      queryClient.setQueriesData({ queryKey: ["games"] }, (old) => ({
        ...old,
        games: old.games.map((g) =>
          g.id === variables.gameId ? { ...g, is_favorite: variables.isFavorite } : g
        ),
      }))

      return { previousGames } // Context for rollback
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(["games"], context?.previousGames)
      showToast("Failed to update favorite status", "error")
    },
    onSuccess: (_, variables) => {
      showToast(variables.isFavorite ? "Added to favorites" : "Removed from favorites", "success")
    },
    onSettled: () => {
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ["games"] })
    },
  })
}
```

**Existing Mutation Hooks:**

`useGameMutations.ts`:
- `useToggleFavorite()` - With optimistic updates
- `useUpdateGameStatus()` - With optimistic updates
- `useDeleteGame()` - With optimistic updates
- `useBulkDeleteGames()` - Batch deletion
- `useUpdateGameRating()` - Rating updates

`useCollectionMutations.ts`:
- `useCreateCollection()`
- `useUpdateCollection()`
- `useDeleteCollection()`
- `useAddGamesToCollection()`
- `useRemoveGameFromCollection()` - With optimistic updates
- `useBulkRemoveGamesFromCollection()` - With optimistic updates

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

### Utilities

**`cn()` - Tailwind Class Merger:**

```typescript
import { cn } from '@/lib/utils'

// Merge Tailwind classes intelligently (prevents conflicts)
<div className={cn(
  "bg-red-500 text-white",  // Base classes
  isActive && "bg-blue-500", // Conditional (overrides bg-red-500)
  className                   // External className prop
)} />
```

Uses `clsx` + `tailwind-merge` to:
- Merge conditional class names
- Resolve Tailwind class conflicts (last wins)
- Handle arrays and objects

**Prettier + Tailwind Class Sorting:**

Classes are auto-sorted by `prettier-plugin-tailwindcss`:

```tsx
// Before save
<div className="text-white bg-blue-500 p-4 rounded">

// After save (auto-sorted)
<div className="rounded bg-blue-500 p-4 text-white">
```

Configured in `.prettierrc` to work with `cn()`, `clsx()`, and `cva()`.

### Layout Context Pattern

Pages can customize the sidebar and layout dynamically:

```typescript
import { useLayout } from '@/components/layout/LayoutContext'
import { useEffect } from 'react'

function CustomPage() {
  const { setLayout, resetLayout } = useLayout()

  useEffect(() => {
    // Set custom sidebar for this page
    setLayout({
      sidebar: <CustomSidebar />,
      customCollapsed: false,
      showBackButton: true,
    })

    // Cleanup: reset to default on unmount
    return () => resetLayout()
  }, [setLayout, resetLayout])

  return <div>Page content</div>
}
```

**Layout State:**
- `sidebar` - Custom sidebar component (or null for default)
- `customCollapsed` - Force sidebar collapsed state
- `showBackButton` - Show/hide back button in navbar

**Used by:** Game detail, collection detail, franchise pages

### Global Search Architecture

Search uses a cached index for instant client-side filtering:

```typescript
import { useSearchData } from '@/hooks/useSearchData'

function SearchComponent() {
  const [query, setQuery] = useState('')
  const { sections, totalCount } = useSearchData(query)

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {sections.map((section) => (
        <div key={section.label}>
          <h3>{section.label}</h3>
          {section.items.map((item) => (
            <a key={item.id} href={item.href}>{item.name}</a>
          ))}
        </div>
      ))}
    </div>
  )
}
```

**How it works:**
1. Fetches search index (games, collections, franchises, platforms)
2. Caches for 5 minutes (stale time)
3. Filters client-side for instant results
4. Returns structured sections with items

**Search Index Updates:**
- Automatically refreshed every 5 minutes
- Manually invalidated on data mutations
- Shared across all search instances

### Auth Flow

**Token Management** (`lib/auth-storage.ts`):

```typescript
import { getToken, setToken, clearToken, subscribe } from '@/lib/auth-storage'

// Get token
const token = getToken()

// Set token (triggers subscribers)
setToken('new-token')

// Clear token (triggers subscribers)
clearToken()

// Subscribe to token changes (cross-tab sync)
const unsubscribe = subscribe((newToken) => {
  console.log('Token changed:', newToken)
})
// Later: unsubscribe()
```

**AuthRedirectListener Component:**

Handles 401 responses globally:

```typescript
// Listens for auth:unauthorized events from Axios interceptor
// Automatically redirects to /login
// Prevents redirect loops on auth pages
```

Rendered in `__root.tsx` for all routes.

**Onboarding Flow:**

```typescript
// Dashboard checks if user has connected platforms
import { hasUserPlatforms } from '@/lib/onboarding'

// In route loader
if (!(await hasUserPlatforms(queryClient))) {
  throw redirect({ to: '/platforms' })
}
```

**Auth Context:**
- User data in TanStack Query cache (`["auth", "me"]` query)
- Token in localStorage via `auth-storage`
- `login()` and `register()` update query cache directly
- `logout()` clears token and cancels queries

## UI Components

### Location: `components/ui/`

| Component | Description |
|-----------|-------------|
| Button | Standard button with variants (primary, secondary, danger) |
| StatusButton | Reusable status button (collapsed/expanded modes, config-driven) |
| Card | Container with consistent padding and border styling |
| Badge | Small status/label indicators |
| Input | Text inputs with styling and error states |
| Textarea | Multi-line text inputs |
| Label | Form labels with accessibility |
| Checkbox | Styled checkbox |
| Switch | Toggle switches |
| Select | Custom dropdown with keyboard nav, color coding, metadata |
| Combobox | Searchable select built on Command + Popover |
| ScrollFade | Scrollable container with fade effects |
| Toast | Notification system via useToast hook |
| Skeleton | Loading state placeholders |
| Dialog | Modal dialogs (shadcn) |
| AlertDialog | Confirmation dialogs (shadcn) |
| DropdownMenu | Context menus (shadcn) |
| Popover | Floating popovers (shadcn) |
| Tooltip | Hover tooltips (shadcn) |
| Tabs | Tab navigation (shadcn) |
| Command | Command palette/combobox (shadcn) |
| Alert | Alert banners (shadcn) |
| Form/FormField | Form field wrapper with validation (shadcn) |

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
