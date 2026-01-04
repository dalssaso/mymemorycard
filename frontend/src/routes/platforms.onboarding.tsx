import { createFileRoute, redirect } from "@tanstack/react-router";
import { PlatformOnboarding } from "@/pages/PlatformOnboarding";

export const Route = createFileRoute("/platforms/onboarding")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: PlatformOnboarding,
});
