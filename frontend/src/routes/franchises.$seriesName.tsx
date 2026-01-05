import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { franchisesAPI, userPlatformsAPI } from "@/lib/api";

const FranchiseDetail = lazyRouteComponent(() =>
  import("@/pages/FranchiseDetail").then((module) => ({ default: module.FranchiseDetail }))
);

const paramsSchema = z.object({
  seriesName: z.string(),
});

export const Route = createFileRoute("/franchises/$seriesName")({
  params: {
    parse: (params) => paramsSchema.parse(params),
  },
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["franchise", params.seriesName],
        queryFn: async () => {
          const response = await franchisesAPI.getOne(params.seriesName);
          return response.data;
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["user-platforms"],
        queryFn: async () => {
          const response = await userPlatformsAPI.getAll();
          return response.data;
        },
      }),
    ]);
  },
  component: FranchiseDetail,
});
