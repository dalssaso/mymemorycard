# Frontend Architecture

## Overview

The frontend uses React 18 with Vite and TanStack Router + TanStack Query. UI components are built on shadcn/ui and styled with the Catppuccin palette via CSS variables.

## Structure

```
src/
  components/
    layout/           # AppShell, LayoutContext, Navbar, Sidebar, MobileNav
    sidebar/          # Sidebar components (DashboardSidebar, LibrarySidebar, etc.)
    filters/          # Library filter components (Sort, Genre, Collection, etc.)
    ui/               # shadcn primitives (20+ components)
                      # - button, input, textarea, label, checkbox, switch
                      # - dialog, alert-dialog, popover, tooltip
                      # - combobox, select, tabs, command
                      # - card, badge, skeleton, alert
                      # - status-button (custom)
  contexts/           # Auth, Theme, Sidebar
  hooks/              # Custom hooks organized by purpose:
                      # Query hooks: useGames, useCollections, useFranchises, etc.
                      # Mutation hooks: useGameMutations, useCollectionMutations
                      # Special hooks: useSearchData, useLibraryFilters, useAnimatedNumber
  lib/
    api/              # Domain-based modules (15+ files)
                      # - axios.ts (shared instance)
                      # - games, collections, franchises, platforms
                      # - auth, sessions, stats, preferences
                      # - import, ai, ownership, additions, etc.
                      # - index.ts (barrel exports)
    constants/        # Status configs, etc.
    auth-storage.ts   # Token management with subscriptions
    onboarding.ts     # Onboarding helpers
    cn.ts             # Tailwind merge utility
    utils.ts          # General utilities
  pages/              # Route-level pages (Library, GameDetail, Collections, etc.)
  routes/             # File-based routes (TanStack Router)
  styles/
    theme.css         # Catppuccin theme mapping
  components.json     # shadcn/ui configuration
```

## UI Conventions

- Prefer shadcn/ui primitives (`Button`, `Card`, `Input`, `Select`, `Dialog`, `Command`).
- Use the Catppuccin CSS variables in `src/styles/theme.css` to keep a consistent palette.
- Avoid global utility classes for primitives; keep styles close to components.

## Routing

- Use file-based routes in `src/routes/`.
- Dynamic routes should validate params/search using `zod`.
- AppShell is rendered from the root layout for authenticated routes.

## Data Fetching

- Use TanStack Query for server state.
- Include all filter/search parameters in `queryKey`.
- Preload data in route loaders with `queryClient.ensureQueryData()` when needed.

## API

- Shared Axios instance in `src/lib/api/axios.ts`.
- Domain modules under `src/lib/api/` export typed methods (auth, games, collections, etc).
- Avoid navigation inside interceptors; handle auth transitions in contexts.

## Forms

- Use `react-hook-form` and `zod` for validation.
- Prefer reusable `FormField` for inputs and error messages.

## API Architecture

### Domain-Based Modules

API layer is organized into focused modules in `lib/api/`:

**Structure:**

- One file per domain (games, collections, franchises, etc.)
- Export const API object with methods
- Export related TypeScript types
- Barrel export via `lib/api/index.ts`

**Example:**

```typescript
// lib/api/games.ts
export const gamesAPI = {
  getAll: (params?) => api.get("/games", { params }),
  getOne: (id) => api.get(`/games/${id}`),
  delete: (id, platformId) => api.delete(`/games/${id}`, { params: { platform_id: platformId } }),
};

// lib/api/index.ts
export { gamesAPI } from "./games";
export { collectionsAPI } from "./collections";
export type { Game } from "./games";
```

**Axios Instance** (`lib/api/axios.ts`):

- Shared instance with auth interceptor
- Adds Bearer token from localStorage
- Handles 401 responses (emits `auth:unauthorized` event)
- Base URL proxies to backend in dev mode

## State Management

### Server State (TanStack Query)

All backend data managed via TanStack Query:

**Query Hooks:**

- `useGames`, `useCollections`, `useFranchises`, `usePlatforms`
- `useAchievementStats`, `useActivityFeed`, `useGenreStats`
- Include filters in `queryKey` for proper caching

**Mutation Hooks:**

- `useToggleFavorite`, `useUpdateGameStatus`, `useDeleteGame`
- `useCreateCollection`, `useRemoveGameFromCollection`
- Use optimistic updates for instant UI feedback

**Optimistic Updates Pattern:**

1. Cancel ongoing queries
2. Snapshot previous state
3. Update cache optimistically
4. Rollback on error
5. Invalidate to refetch on settled

### Client State (React Context)

**AuthContext:**

- User data in TanStack Query cache (`["auth", "me"]`)
- Token in localStorage via `auth-storage` module
- `login()` and `register()` update cache directly
- `logout()` clears token and cancels queries

**ThemeContext:**

- Light/dark mode toggle
- Persisted in localStorage

**SidebarContext:**

- Collapsed state management
- Mobile vs desktop behavior

**LayoutContext:**

- Page-specific sidebar content
- Custom collapse state
- Back button visibility

## Layout System

### AppShell Component

Single entry point for authenticated app layout:

```typescript
<AppShell>
  <GlobalSearch />
  <Navbar />
  <Sidebar />
  <main>{children}</main>
  <MobileNav />
  <BackToTopButton />
</AppShell>
```

**Conditional Rendering:**

- Auth routes (login/register) bypass AppShell
- Authenticated routes render via AppShell
- Controlled in `__root.tsx`

### LayoutContext

Pages can customize layout dynamically:

```typescript
const { setLayout, resetLayout } = useLayout()

useEffect(() => {
  setLayout({
    sidebar: <CustomSidebar />,
    customCollapsed: false,
    showBackButton: true,
  })
  return () => resetLayout()
}, [])
```

**Used by:** Game detail, collection detail, franchise pages

### Responsive Design

**Desktop:**

- Sidebar toggleable (collapsed/expanded)
- Content max-width constraints
- Hover interactions

**Mobile:**

- Bottom navigation bar (MobileNav)
- Sidebar as overlay drawer
- Touch-optimized targets
- CSS variable: `--mobile-nav-height: 4rem`

## Search

### Global Search Architecture

**useSearchData Hook:**

- Fetches search index (games, collections, franchises, platforms)
- Caches for 5 minutes (stale time)
- Client-side filtering for instant results
- Returns structured sections

**Implementation:**

```typescript
const { sections, totalCount } = useSearchData(query);

// sections = [
//   { label: "Games", items: [...] },
//   { label: "Collections", items: [...] },
//   { label: "Franchises", items: [...] },
//   { label: "Platforms", items: [...] },
// ]
```

**Search Index Updates:**

- Auto-refreshed every 5 minutes
- Manually invalidated on data mutations
- Shared across all search instances

## Authentication

### Token Management

**auth-storage Module:**

- `getToken()`, `setToken()`, `clearToken()`
- Subscription pattern for cross-tab sync
- Triggers subscribers on token changes

**AuthRedirectListener:**

- Listens for `auth:unauthorized` events
- Automatically redirects to `/login` on 401
- Prevents redirect loops on auth pages
- Rendered in `__root.tsx`

### Route Guards

**Root Route (`__root.tsx`):**

- `beforeLoad` enforces authentication globally
- Redirects to `/login` if no token
- Auth routes (login/register) bypass check

**Onboarding Flow:**

- Dashboard checks if user has connected platforms
- Redirects to `/platforms` if none connected
- Uses `hasUserPlatforms` helper

## Theming

### Catppuccin Palette

**CSS Variables** (`styles/theme.css`):

```css
:root {
  --ctp-base: #1e1e2e;
  --ctp-text: #cdd6f4;
  --ctp-mauve: #cba6f7;
  --ctp-teal: #94e2d5;
  --ctp-green: #a6e3a1;
  --ctp-red: #f38ba8;
  /* ... */
}
```

**shadcn Semantic Mapping:**

- `--background: var(--ctp-base)`
- `--foreground: var(--ctp-text)`
- `--primary: var(--ctp-mauve)`
- `--secondary: var(--ctp-teal)`
- `--destructive: var(--ctp-red)`

**Light/Dark Mode:**

- Light: Catppuccin Latte
- Dark: Catppuccin Mocha (default)
- Toggle via `.dark` class

### Tailwind Configuration

**Extended Colors:**

- shadcn semantic colors (`primary`, `secondary`, `destructive`, etc.)
- Direct Catppuccin colors (`ctp-*` prefix)
- Chart colors (1-5) for recharts

**Plugins:**

- `tailwindcss-animate` - Animation utilities
- `prettier-plugin-tailwindcss` - Auto-sorted classes

## UX and Responsiveness

- Desktop: keep content width constrained and reduce visual clutter.
- Mobile: prioritize critical actions, reduce dense navigation, and avoid overflow.
- Prefer `max-w-*` containers and responsive spacing for layout stability.
