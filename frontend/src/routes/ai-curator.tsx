import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { aiAPI, collectionsAPI } from "@/lib/api";

const AICurator = lazyRouteComponent(() =>
  import("@/pages/AICurator").then((module) => ({ default: module.AICurator }))
);

export const Route = createFileRoute("/ai-curator")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AICurator,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["ai-settings"],
        queryFn: async () => {
          const response = await aiAPI.getSettings();
          return response.data;
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["collections"],
        queryFn: async () => {
          const response = await collectionsAPI.getAll();
          return response.data;
        },
      }),
    ]);
  },
});
