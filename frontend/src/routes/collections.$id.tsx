import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { z } from "zod"
import { collectionsAPI, gamesAPI } from "@/lib/api"

const CollectionDetail = lazyRouteComponent(() =>
  import("@/pages/CollectionDetail").then((module) => ({ default: module.CollectionDetail }))
)

const paramsSchema = z.object({
  id: z.string(),
})

export const Route = createFileRoute("/collections/$id")({
  params: {
    parse: (params) => paramsSchema.parse(params),
  },
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["collection", params.id],
        queryFn: async () => {
          const response = await collectionsAPI.getOne(params.id)
          return response.data
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["library-games"],
        queryFn: async () => {
          const response = await gamesAPI.getAll()
          return response.data
        },
      }),
    ])
  },
  component: CollectionDetail,
})
