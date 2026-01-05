import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { preferencesAPI } from "@/lib/api";

const Settings = lazyRouteComponent(() =>
  import("@/pages/Settings").then((module) => ({ default: module.Settings }))
);

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Settings,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["preferences"],
      queryFn: async () => {
        const response = await preferencesAPI.get();
        return response.data;
      },
    });
  },
});
