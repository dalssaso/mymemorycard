import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { userPlatformsAPI } from "@/lib/api";

const Import = lazyRouteComponent(() =>
  import("@/pages/Import").then((module) => ({ default: module.Import }))
);

export const Route = createFileRoute("/import")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Import,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["user-platforms"],
      queryFn: async () => {
        const response = await userPlatformsAPI.getAll();
        return response.data;
      },
    });
  },
});
