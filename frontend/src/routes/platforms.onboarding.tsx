import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { platformsAPI, userPlatformsAPI } from "@/lib/api";
import { getToken } from "@/lib/auth-storage";
import { hasUserPlatforms } from "@/lib/onboarding";

const PlatformOnboarding = lazyRouteComponent(() =>
  import("@/pages/PlatformOnboarding").then((module) => ({ default: module.PlatformOnboarding }))
);

export const Route = createFileRoute("/platforms/onboarding")({
  beforeLoad: async ({ context }) => {
    const token = getToken() ?? context.auth.token;
    if (!token) {
      throw redirect({ to: "/login" });
    }
    const hasPlatforms = await hasUserPlatforms(context.queryClient);
    if (hasPlatforms) {
      throw redirect({ to: "/dashboard" });
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
