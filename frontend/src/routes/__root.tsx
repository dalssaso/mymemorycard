import {
  Outlet,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { AuthRedirectListener } from "@/components/AuthRedirectListener";
import { AppShell } from "@/components/layout";
import { getToken } from "@/lib/auth-storage";
import type { RouterContext } from "@/router-context";

function RootLayout(): JSX.Element {
  const locationPath = useRouterState({ select: (state) => state.location.pathname });
  const isAuthRoute = locationPath === "/login" || locationPath === "/register";

  if (isAuthRoute) {
    return (
      <>
        <AuthRedirectListener />
        <Outlet />
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </>
    );
  }

  return (
    <AppShell>
      <AuthRedirectListener />
      <Outlet />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ location }) => {
    const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";
    const token = getToken();

    // Handle root path - redirect to dashboard or login
    if (location.pathname === "/") {
      throw redirect({ to: token ? "/dashboard" : "/login", replace: true });
    }

    // Enforce authentication for protected routes
    if (!token && !isAuthRoute) {
      throw redirect({ to: "/login" });
    }
  },
  component: RootLayout,
});
