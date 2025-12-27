import { createFileRoute } from '@tanstack/react-router'
import { FranchiseDetail } from '@/pages/FranchiseDetail'

export const Route = createFileRoute('/franchises/$seriesName')({
  component: FranchiseDetail,
})
