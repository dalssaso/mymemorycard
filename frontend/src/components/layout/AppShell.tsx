import { type ReactNode } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useSidebar } from "@/contexts/SidebarContext";
import { BackToTopButton } from "./BackToTopButton";
import { LayoutProvider, useLayout } from "./LayoutContext";
import { MobileNav } from "./MobileNav";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): JSX.Element {
  return (
    <LayoutProvider>
      <AppShellContent>{children}</AppShellContent>
    </LayoutProvider>
  );
}

function AppShellContent({ children }: AppShellProps): JSX.Element {
  const { isCollapsed } = useSidebar();
  const { sidebar, customCollapsed, showBackButton } = useLayout();

  return (
    <div className="min-h-screen bg-ctp-base text-ctp-text">
      <GlobalSearch />
      <Navbar />
      <Sidebar customCollapsed={customCollapsed} showBackButton={showBackButton}>
        {sidebar}
      </Sidebar>
      <main
        className={`min-h-[calc(100vh-4rem)] min-w-0 overflow-x-hidden pb-16 pt-16 transition-all duration-300 md:pb-0 ${
          isCollapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 pt-4 sm:px-6">{children}</div>
      </main>
      <MobileNav />
      <BackToTopButton />
    </div>
  );
}
