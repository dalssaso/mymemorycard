import { createFileRoute, redirect } from '@tanstack/react-router'
import { Activity } from '@/pages/Activity'

export interface ActivitySearchParams {
  page?: number
}

export const Route = createFileRoute('/activity')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  validateSearch: (search: Record<string, unknown>): ActivitySearchParams => {
    const pageParam = search.page
    const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : Number(pageParam)

    return {
      page: Number.isFinite(page) && page > 0 ? page : undefined,
    }
  },
  component: Activity,
})
