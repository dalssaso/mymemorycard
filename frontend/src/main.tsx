import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { GlobalSearchProvider } from "@/components/GlobalSearch";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./index.css";

import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  context: {
    auth: undefined!,
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp(): JSX.Element {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth, queryClient }} />;
}

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <GlobalSearchProvider>
              <ErrorBoundary>
                <InnerApp />
              </ErrorBoundary>
            </GlobalSearchProvider>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      <Toaster richColors position="bottom-right" />
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
