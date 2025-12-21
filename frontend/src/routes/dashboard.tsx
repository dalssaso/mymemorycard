import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '@/pages/Dashboard'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})
