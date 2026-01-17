import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { CredentialsService } from "@/shared/api/services";

const ImportIGDB = lazyRouteComponent(() =>
  import("@/pages/ImportIGDB").then((module) => ({ default: module.ImportIGDB }))
);

export const Route = createFileRoute("/import")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: ImportIGDB,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["credentials"],
      queryFn: () => CredentialsService.list(),
    });
  },
});
