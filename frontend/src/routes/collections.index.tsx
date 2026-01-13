import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { collectionsAPI } from "@/lib/api";

const Collections = lazyRouteComponent(() =>
  import("@/pages/Collections").then((module) => ({ default: module.Collections }))
);

export const Route = createFileRoute("/collections/")({
  component: Collections,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["collections"],
      queryFn: async () => {
        const response = await collectionsAPI.getAll();
        return response.data;
      },
    });
  },
});
