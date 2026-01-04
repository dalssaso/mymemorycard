import { createFileRoute, redirect } from "@tanstack/react-router";
import { Import } from "@/pages/Import";

export const Route = createFileRoute("/import")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Import,
});
