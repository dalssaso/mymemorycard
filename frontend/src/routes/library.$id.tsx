import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router"
import { z } from "zod"
import { gamesAPI, userPlatformsAPI } from "@/lib/api"

const GameDetail = lazyRouteComponent(() =>
  import("@/pages/GameDetail").then((module) => ({ default: module.GameDetail }))
)

const searchSchema = z.object({
  tab: z.enum(["main", "dlc", "full", "completionist"]).optional(),
})

const paramsSchema = z.object({
  id: z.string(),
})

export type GameDetailSearchParams = z.infer<typeof searchSchema>

export const Route = createFileRoute("/library/$id")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" })
    }
  },
  params: {
    parse: (params) => paramsSchema.parse(params),
  },
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["game", params.id],
        queryFn: async () => {
          const response = await gamesAPI.getOne(params.id)
          return response.data
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["user-platforms"],
        queryFn: async () => {
          const response = await userPlatformsAPI.getAll()
          return response.data
        },
      }),
    ])
  },
  component: GameDetail,
})
