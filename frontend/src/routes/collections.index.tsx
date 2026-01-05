import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { aiAPI, collectionsAPI } from "@/lib/api";

const Collections = lazyRouteComponent(() =>
  import("@/pages/Collections").then((module) => ({ default: module.Collections }))
);

export const Route = createFileRoute("/collections/")({
  component: Collections,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["collections"],
        queryFn: async () => {
          const response = await collectionsAPI.getAll();
          return response.data;
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["ai-settings"],
        queryFn: async () => {
          const response = await aiAPI.getSettings();
          return response.data;
        },
      }),
    ]);
  },
});
