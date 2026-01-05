import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";

const Register = lazyRouteComponent(() =>
  import("@/pages/Register").then((module) => ({ default: module.Register }))
);

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Register,
});
