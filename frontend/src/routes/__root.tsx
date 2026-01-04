import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  beforeLoad: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;
    return { auth: { token, user } };
  },
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
