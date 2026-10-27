import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useState, useEffect } from "react";
import {
  Plus, Search, Sparkles, Store as StoreIcon, ArrowRight, Grid, List, Trash2,
  Check, Pause, Play, ExternalLink, Rocket, Settings2, LogOut,
} from "lucide-react";
import { useAuthStore, type Store } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { logout } from "@/api/auth";
import { getMyStores, createWebsite } from "@/api/stores";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Choose a store — Aether" },
      { name: "description", content: "Select or create a store to manage." },
    ],
  }),
  component: StoresPage,
});

function StoresPage() {
  const t = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const switchStore = useAuthStore((s) => s.switchStore);
  const createStore = useAuthStore((s) => s.createStore);
  const setStores = useAuthStore((s) => s.setStores);
  const deleteStore = useAuthStore((s) => s.deleteStore);
  const updateStore = useAuthStore((s) => s.updateStore);
  const signOut = useAuthStore((s) => s.signOut);

  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ISSUE 1 FIX: Fetch stores from backend on mount to ensure latest data
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        const backendStores = await getMyStores();
        
        // Convert backend Website format to Store format
        const convertedStores = backendStores.map((ws) => ({
          id: ws.name,
          name: ws.title || ws.name,
          slug: ws.slug || ws.name,
          logoUrl: null,
          url: `/site/${ws.slug || ws.name}`,
          status: "active" as const,
          plan: "starter" as const,
          updatedAt: new Date(ws.modified || ws.creation || Date.now()).getTime(),
          createdAt: new Date(ws.creation || Date.now()).getTime(),
          revenue: 0,
          currency: "USD",
        }));
        
        setStores(convertedStores);
      } catch (error) {
        console.error("Failed to fetch stores:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStores();
  }, [setStores]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return stores;
    return stores.filter((s) => s.name.toLowerCase().includes(needle) || s.slug.toLowerCase().includes(needle));
  }, [stores, q]);

  const enter = (id: string) => { switchStore(id); navigate({ to: "/store/$storeId", params: { storeId: id } }); };
  const handleCreate = async (name: string) => {
    try {
      // ISSUE 1 FIX: Create store on backend first
      const createdWebsite = await createWebsite({ title: name });
      
      // Convert to Store format
      const newStore = {
        id: createdWebsite.name,
        name: createdWebsite.title || createdWebsite.name,
        slug: createdWebsite.slug || createdWebsite.name,
        logoUrl: null,
        url: `/site/${createdWebsite.slug || createdWebsite.name}`,
        status: "trial" as const,
        plan: "starter" as const,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        revenue: 0,
        currency: "USD",
      };
      
      // Add to local state
      createStore({ name: newStore.name, slug: newStore.slug });
      
      setShowCreate(false);
      enter(newStore.id);
    } catch (error) {
      console.error("Failed to create store:", error);
      alert("Failed to create store. Please try again.");
    }
  };

  // Never bounce to the landing page from the store switcher — this page is the
  // signed-in "home". If the visitor is unauthenticated we still render so they
  // can see and create stores; auth gating is handled at the app boundary.

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full blur-[140px] opacity-25" style={{ background: "var(--glow)" }} />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full blur-[140px] opacity-20" style={{ background: "var(--glow-2)" }} />
        <div className="absolute inset-0 grid-pattern opacity-40" />
      </div>

      <header className="relative border-b border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient shadow-glow">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            Aether
          </Link>
          <div className="flex items-center gap-3">
            {user && <span className="hidden sm:inline text-xs text-muted-foreground">{user.email}</span>}
            <button onClick={async () => { 
              signOut(); 
              // Clear all Zustand persisted localStorage keys to prevent stale data
              try {
                localStorage.removeItem("aether.auth.v2");
                localStorage.removeItem("aether.site.v2");
                localStorage.removeItem("aether.data.v2");
              } catch (err) {
                console.error("Failed to clear localStorage:", err);
              }
              try {
                await logout();
              } catch (err) {
                console.error("Logout error:", err);
              }
              // Small delay to ensure async operations complete
              setTimeout(() => {
                navigate({ to: "/" }); 
              }, 300);
            }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
              <LogOut className="h-3.5 w-3.5" /> {t("common.signOut", "Sign out")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
              {t("stores.title", "Your stores")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              {t("stores.subtitle", "Choose a store to manage or create a new one. Each store has its own catalog, orders and settings.")}
            </p>
          </div>
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">
            <Plus className="h-4 w-4" /> {t("stores.new", "New store")}
          </motion.button>
        </motion.div>

        <div className="mt-6 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={t("stores.search", "Search stores…")}
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40" />
          </div>
          <div className="flex items-center gap-1 rounded-xl glass border border-white/[0.08] p-1">
            <button onClick={() => setView("grid")} className={cn("h-8 w-8 grid place-items-center rounded-lg", view === "grid" && "bg-primary-gradient text-primary-foreground")}>
              <Grid className="h-4 w-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("h-8 w-8 grid place-items-center rounded-lg", view === "list" && "bg-primary-gradient text-primary-foreground")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : view === "grid" ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((s, i) => (
              <StoreCard key={s.id} store={s} index={i} active={s.id === activeStoreId}
                onEnter={() => enter(s.id)}
                onPause={() => updateStore(s.id, { status: s.status === "paused" ? "active" : "paused" })}
                onDelete={() => { if (confirm(`Delete "${s.name}"? This cannot be undone.`)) deleteStore(s.id); }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
            {list.map((s, i) => (
              <StoreRow key={s.id} store={s} index={i} active={s.id === activeStoreId} onEnter={() => enter(s.id)} />
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateStoreModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}

function StoreCard({ store, index, active, onEnter, onPause, onDelete }: {
  store: Store; index: number; active: boolean;
  onEnter: () => void; onPause: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl glass-strong border border-white/[0.08] p-5",
        active && "ring-1 ring-primary/40 shadow-glow"
      )}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-25 group-hover:opacity-40 transition"
           style={{ background: "var(--glow)" }} />
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
          {store.logoUrl ? <img src={store.logoUrl} className="h-full w-full rounded-2xl object-cover" alt="" /> : <StoreIcon className="h-5 w-5 text-primary-foreground" />}
        </span>
        <div className="min-w-0">
          <div className="font-display text-base font-semibold truncate">{store.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">/{store.slug}</div>
        </div>
        <span className={cn(
          "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
          store.status === "active" && "bg-emerald-400/10 text-emerald-300",
          store.status === "paused" && "bg-amber-400/10 text-amber-300",
          store.status === "trial" && "bg-primary/10 text-primary",
          store.status === "suspended" && "bg-rose-400/10 text-rose-300",
        )}>{store.status}</span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">Plan</div>
          <div className="text-foreground capitalize">{store.plan}</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2.5 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.12em] opacity-70">Updated</div>
          <div className="text-foreground">{new Date(store.updatedAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onEnter}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow">
          {t_enter()} <ArrowRight className="h-3.5 w-3.5" />
        </motion.button>
        <button onClick={onPause} title={store.status === "paused" ? "Resume" : "Pause"}
          className="h-9 w-9 grid place-items-center rounded-xl glass hover:bg-white/10">
          {store.status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
        <a href={store.url} target="_blank" rel="noreferrer" title="View live"
          className="h-9 w-9 grid place-items-center rounded-xl glass hover:bg-white/10">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button onClick={onDelete} title="Delete"
          className="h-9 w-9 grid place-items-center rounded-xl glass hover:bg-rose-500/20 text-rose-300">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function t_enter() { return "Enter store"; }

function StoreRow({ store, index, active, onEnter }: { store: Store; index: number; active: boolean; onEnter: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.02 }}
      onClick={onEnter}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] text-left transition",
        active && "bg-white/[0.05]"
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient">
        <StoreIcon className="h-4 w-4 text-primary-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium truncate">{store.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">/{store.slug} · {store.plan}</div>
      </div>
      <span className="text-[11px] text-muted-foreground capitalize">{store.status}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </motion.button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-10 text-center rounded-3xl glass-strong border border-white/[0.08] p-12">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow mb-4">
        <Rocket className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-semibold">Launch your first store</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Every store gets its own catalog, orders, customers and settings. Create one to enter the dashboard.
      </p>
      <button onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow">
        <Plus className="h-4 w-4" /> Create store
      </button>
    </motion.div>
  );
}

function CreateStoreModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/70 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-3xl glass-strong border border-white/10 p-6 shadow-glow">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-display text-lg font-semibold">Create a new store</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Give your store a name. You can change everything later.</p>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onCreate(name.trim()); }}
          placeholder="e.g. Aurora Studio"
          className="w-full h-11 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40" />
        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
          <button disabled={!name.trim()} onClick={() => onCreate(name.trim())}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow disabled:opacity-50">
            <Check className="h-3.5 w-3.5" /> Create store
          </button>
        </div>
      </motion.div>
    </div>
  );
}
