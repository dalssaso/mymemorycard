import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router"
import { z } from "zod"
import { userPlatformsAPI } from "@/lib/api"

const PlatformDetail = lazyRouteComponent(() =>
  import("@/pages/PlatformDetail").then((module) => ({ default: module.PlatformDetail }))
)

const paramsSchema = z.object({
  id: z.string(),
})

export const Route = createFileRoute("/platforms/$id")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" })
    }
  },
  params: {
    parse: (params) => paramsSchema.parse(params),
  },
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["user-platform", params.id],
      queryFn: async () => {
        const response = await userPlatformsAPI.getOne(params.id)
        return response.data
      },
    })
  },
  component: PlatformDetail,
})
