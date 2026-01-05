import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";
import { collectionsAPI } from "@/lib/api";

const SeriesDetail = lazyRouteComponent(() =>
  import("@/pages/SeriesDetail").then((module) => ({ default: module.SeriesDetail }))
);

const paramsSchema = z.object({
  seriesName: z.string(),
});

export const Route = createFileRoute("/collections/series/$seriesName")({
  params: {
    parse: (params) => paramsSchema.parse(params),
  },
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["series", params.seriesName],
      queryFn: async () => {
        const response = await collectionsAPI.getSeriesGames(params.seriesName);
        return response.data;
      },
    });
  },
  component: SeriesDetail,
});
