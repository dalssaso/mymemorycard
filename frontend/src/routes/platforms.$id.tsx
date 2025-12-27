import { createFileRoute, redirect } from '@tanstack/react-router'
import { PlatformDetail } from '@/pages/PlatformDetail'

export const Route = createFileRoute('/platforms/$id')({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: '/login' })
    }
  },
  component: PlatformDetail,
})
