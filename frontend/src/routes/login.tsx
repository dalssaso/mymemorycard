import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";

const Login = lazyRouteComponent(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login }))
);

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.auth.token) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Login,
});
