import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/library')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />,
})
