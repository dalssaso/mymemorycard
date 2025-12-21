import { createFileRoute, redirect } from '@tanstack/react-router'
import { Register } from '@/pages/Register'

export const Route = createFileRoute('/register')({
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: Register,
})
