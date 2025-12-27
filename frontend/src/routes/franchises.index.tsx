import { createFileRoute } from '@tanstack/react-router'
import { Franchises } from '@/pages/Franchises'

export const Route = createFileRoute('/franchises/')({
  component: Franchises,
})
