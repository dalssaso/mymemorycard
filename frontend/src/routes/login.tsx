import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { getToken } from "@/lib/auth-storage";

const Login = lazyRouteComponent(() =>
  import("@/pages/Login").then((module) => ({ default: module.Login }))
);

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // Check localStorage directly (source of truth)
    const token = getToken();
    if (token) {
      throw redirect({ to: "/dashboard", replace: true });
    }
  },
  component: Login,
});
