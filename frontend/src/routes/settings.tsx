import { createFileRoute, redirect } from '@tanstack/react-router'
import { Settings } from '@/pages/Settings'

export const Route = createFileRoute('/settings')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  component: Settings,
})
