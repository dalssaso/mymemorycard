import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { platformsAPI, userPlatformsAPI } from "@/lib/api";

const Platforms = lazyRouteComponent(() =>
  import("@/pages/Platforms").then((module) => ({ default: module.Platforms }))
);

export const Route = createFileRoute("/platforms/")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData({
        queryKey: ["platforms"],
        queryFn: async () => {
          const response = await platformsAPI.getAll();
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
  component: Platforms,
});
