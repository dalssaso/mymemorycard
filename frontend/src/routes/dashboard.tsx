import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { gamesAPI } from "@/lib/api";

const Dashboard = lazyRouteComponent(() =>
  import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard }))
);

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
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
