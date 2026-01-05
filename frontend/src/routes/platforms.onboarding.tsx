import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { platformsAPI, userPlatformsAPI } from "@/lib/api";

const PlatformOnboarding = lazyRouteComponent(() =>
  import("@/pages/PlatformOnboarding").then((module) => ({ default: module.PlatformOnboarding }))
);

export const Route = createFileRoute("/platforms/onboarding")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: PlatformOnboarding,
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
});
