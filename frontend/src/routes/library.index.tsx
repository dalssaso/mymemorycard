import { createFileRoute } from '@tanstack/react-router'
import { Library } from '@/pages/Library'

export interface LibrarySearchParams {
  status?: string
  platform?: string
  genre?: string
  favorites?: boolean
}

export const Route = createFileRoute('/library/')({
  component: Library,
  validateSearch: (search: Record<string, unknown>): LibrarySearchParams => {
    return {
      status: search.status as string | undefined,
      platform: search.platform as string | undefined,
      genre: search.genre as string | undefined,
      favorites: search.favorites === true || search.favorites === 'true',
    }
  },
})
