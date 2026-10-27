import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/topnav";
import { CreateModalProvider } from "@/components/dashboard/create-modal";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <CreateModalProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full blur-[140px] opacity-25"
               style={{ background: "var(--glow)" }} />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full blur-[140px] opacity-20"
               style={{ background: "var(--glow-2)" }} />
          <div className="absolute inset-0 grid-pattern opacity-40" />
        </div>

        <div className="flex">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed(c => !c)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />
          <div className="flex-1 min-w-0 flex flex-col min-h-screen">
            <TopNav onMobileOpen={() => setMobileOpen(true)} />
            <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </CreateModalProvider>
  );
}
