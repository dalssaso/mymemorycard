import { createFileRoute, redirect } from '@tanstack/react-router'
import { GameDetail } from '@/pages/GameDetail'

export const Route = createFileRoute('/library/$id')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  component: GameDetail,
})
