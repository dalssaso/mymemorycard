# Frontend Architecture

## Overview

The frontend uses React 18 with Vite and TanStack Router + TanStack Query. UI components are built on shadcn/ui and styled with the Catppuccin palette via CSS variables.

## Structure

```
src/
  components/
    layout/        # AppShell, Navbar, Sidebar, MobileNav
    ui/            # shadcn primitives + thin wrappers
  contexts/        # Auth, Theme, Sidebar
  hooks/           # Data hooks (useSearchData, useLibraryFilters)
  lib/
    api/           # Axios instance + domain modules
    auth-storage   # Token helpers
  pages/           # Route-level pages
  routes/          # File-based routes
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

## UX and Responsiveness

- Desktop: keep content width constrained and reduce visual clutter.
- Mobile: prioritize critical actions, reduce dense navigation, and avoid overflow.
- Prefer `max-w-*` containers and responsive spacing for layout stability.
