import { createFileRoute, redirect } from "@tanstack/react-router";
import { Platforms } from "@/pages/Platforms";

export const Route = createFileRoute("/platforms/")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Platforms,
});
