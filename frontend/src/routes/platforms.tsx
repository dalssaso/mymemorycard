import { createFileRoute, redirect } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/platforms")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  component: Outlet,
});
