import { createFileRoute, redirect } from "@tanstack/react-router";
import { AICurator } from "@/pages/AICurator";

export const Route = createFileRoute("/ai-curator")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: AICurator,
});
