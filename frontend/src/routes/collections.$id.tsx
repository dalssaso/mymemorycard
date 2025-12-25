import { createFileRoute } from '@tanstack/react-router'
import { CollectionDetail } from '@/pages/CollectionDetail'

export const Route = createFileRoute('/collections/$id')({
  component: CollectionDetail,
})
