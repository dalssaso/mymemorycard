import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { getToken } from "@/lib/auth-storage";

const Register = lazyRouteComponent(() =>
  import("@/pages/Register").then((module) => ({ default: module.Register }))
);

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    // Check localStorage directly (source of truth)
    const token = getToken();
    if (token) {
      throw redirect({ to: "/dashboard", replace: true });
    }
  },
  component: Register,
});
