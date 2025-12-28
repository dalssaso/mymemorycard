import { createFileRoute, redirect } from '@tanstack/react-router'
import { GameDetail } from '@/pages/GameDetail'

export interface GameDetailSearchParams {
  tab?: 'main' | 'dlc' | 'full' | 'completionist'
}

export const Route = createFileRoute('/library/$id')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  validateSearch: (search: Record<string, unknown>): GameDetailSearchParams => {
    const validTabs = ['main', 'dlc', 'full', 'completionist']
    return {
      tab: typeof search.tab === 'string' && validTabs.includes(search.tab)
        ? (search.tab as GameDetailSearchParams['tab'])
        : undefined,
    }
  },
  component: GameDetail,
})
