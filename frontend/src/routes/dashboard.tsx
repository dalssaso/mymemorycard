import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { gamesAPI } from "@/lib/api";
import { hasUserPlatforms } from "@/lib/onboarding";

const Dashboard = lazyRouteComponent(() =>
  import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard }))
);

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    // Root guard already ensures token exists, no need to check again
    // Check if user needs onboarding
    const hasPlatforms = await hasUserPlatforms(context.queryClient);
    if (!hasPlatforms) {
      throw redirect({ to: "/platforms/onboarding" });
    }
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["games"],
        queryFn: async () => {
          const response = await gamesAPI.getAll();
          return response.data;
        },
      }),
      context.queryClient.ensureQueryData({
        queryKey: ["genreStats"],
        queryFn: async () => {
          const response = await gamesAPI.getGenreStats();
          return response.data;
        },
      }),
    ]);
  },
  component: Dashboard,
});
