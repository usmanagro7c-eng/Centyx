import { createFileRoute, Outlet, Link, useParams, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Menu, X, Sparkles, Search, Store as StoreIcon } from "lucide-react";
import { SETTINGS_NAV } from "@/components/dashboard/nav-config";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { TopNav } from "@/components/dashboard/topnav";
import { CreateModalProvider } from "@/components/dashboard/create-modal";

export const Route = createFileRoute("/store_/$storeId/settings")({
  head: () => ({
    meta: [
      { title: "Store Settings — Aether" },
      { name: "description", content: "Configure your store details, plan, billing, users and operations." },
    ],
  }),
  component: SettingsLayout,
});

function SettingsLayout() {
  const { storeId } = useParams({ from: "/store_/$storeId/settings" });
  const navigate = useNavigate();
  const stores = useAuthStore((s) => s.stores);
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const switchStore = useAuthStore((s) => s.switchStore);
  const store = stores.find((s) => s.id === storeId) ?? null;

  useEffect(() => {
    if (!store) { navigate({ to: "/stores" }); return; }
    if (activeStoreId !== storeId) switchStore(storeId);
  }, [store, activeStoreId, storeId, navigate, switchStore]);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeSlug = useMemo(() => {
    const m = pathname.match(/\/settings\/(.+)$/);
    return m ? m[1] : "store-details";
  }, [pathname]);

  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useT();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SETTINGS_NAV;
    return SETTINGS_NAV.filter((it) => it.label.toLowerCase().includes(q));
  }, [query]);

  if (!store) return null;

  return (
    <CreateModalProvider>
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full blur-[140px] opacity-25" style={{ background: "var(--glow)" }} />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full blur-[140px] opacity-20" style={{ background: "var(--glow-2)" }} />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      <TopNav onMobileOpen={() => setMobileOpen(true)} />

      <motion.div
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-16 z-20 border-b border-white/[0.06] glass"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-12 flex items-center gap-3">
          <Link to="/store/$storeId" params={{ storeId }}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {t("settings.exit", "Back to dashboard")}
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <StoreIcon className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{store.name}</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground truncate">Store Settings</span>
            {activeSlug && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="text-foreground truncate">
                  {SETTINGS_NAV.find((s) => s.slug === activeSlug)?.label ?? ""}
                </span>
              </>
            )}
          </div>
          <button onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg glass hover:bg-white/10">
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex gap-6">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-xl lg:hidden"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              key="mobile-nav"
              initial={{ x: -320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed z-50 left-4 top-28 bottom-4 w-72 overflow-auto rounded-2xl glass-strong border border-white/[0.06] p-3 lg:hidden"
            >
              <SettingsNav filtered={filtered} query={query} setQuery={setQuery} activeSlug={activeSlug} storeId={storeId} onNav={() => setMobileOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className="hidden lg:block w-72 shrink-0 rounded-2xl glass-strong border border-white/[0.06] p-3 h-fit sticky top-32">
          <SettingsNav filtered={filtered} query={query} setQuery={setQuery} activeSlug={activeSlug} storeId={storeId} />
        </aside>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlug}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </CreateModalProvider>
  );
}

function SettingsNav({
  filtered, query, setQuery, activeSlug, storeId, onNav,
}: {
  filtered: typeof SETTINGS_NAV; query: string; setQuery: (v: string) => void;
  activeSlug: string; storeId: string; onNav?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-2 pb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Settings</div>
      </div>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full h-8 pl-8 pr-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs outline-none focus:border-primary/40" />
      </div>
      <ul className="space-y-0.5">
        {filtered.map((it) => {
          const active = activeSlug === it.slug;
          return (
            <li key={it.slug}>
              <Link
                to="/store/$storeId/settings/$" params={{ storeId, _splat: it.slug }}
                onClick={onNav}
                className={cn(
                  "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] hover:translate-x-0.5",
                  active && "text-foreground bg-white/[0.05]"
                )}
              >
                {active && <motion.span layoutId="settings-active-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-primary-gradient shadow-glow" />}
                <it.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                <span className="truncate">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
