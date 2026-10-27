import { motion, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search, Bell, Mail, Moon, Sun, Monitor, Globe, Bot, Plus, HelpCircle, UserCircle,
  Menu, Command, LogOut, Settings, Sparkles, Store as StoreIcon, ChevronsUpDown, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingLayer } from "@/components/ui/floating-menu";
import { useCreate } from "./create-modal";
import { useTheme } from "@/lib/theme-provider";
import { useLocale } from "@/lib/locale-store";
import { LANGUAGES } from "@/lib/locale-data";
import { useT } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { useStoreData } from "@/lib/store-data-store";
import { useSiteStore } from "@/lib/site-store";
import { logout } from "@/api/auth";


export function TopNav({ onMobileOpen }: { onMobileOpen: () => void }) {
  const { theme, resolved, toggle } = useTheme();
  const t = useT();
  const langCode = useLocale(s => s.language);
  const currentLang = LANGUAGES.find(l => l.code === langCode);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const storeBtnRef = useRef<HTMLButtonElement>(null);
  const create = useCreate();
  const navigate = useNavigate();
  const ThemeIcon = theme === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  const themeLabel = theme === "system" ? t("top.theme.system") : resolved === "dark" ? t("top.theme.dark") : t("top.theme.light");

  const user = useAuthStore((s) => s.user);
  const stores = useAuthStore((s) => s.stores);
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const switchStore = useAuthStore((s) => s.switchStore);
  const signOut = useAuthStore((s) => s.signOut);
  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null;

  // FloatingLayer handles outside-click and ESC.


  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 h-16 border-b border-white/[0.06] glass-strong px-4 md:px-6 flex items-center gap-3"
    >
      <button
        onClick={onMobileOpen}
        className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/5"
      >
        <Menu className="h-4.5 w-4.5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder={t("common.searchPlaceholder")}
          className={cn(
            "w-full h-10 pl-10 pr-16 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm",
            "placeholder:text-muted-foreground/60 outline-none",
            "focus:border-primary/40 focus:bg-white/[0.05] focus:shadow-glow transition-all duration-300"
          )}
        />
        <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5 ml-auto">
        <IconBtn icon={Sparkles} label={t("top.aiAssistant")} glow to="/dashboard/ai" />
        <IconBtn icon={Bot} label={t("top.workspace")} hideMobile to="/dashboard/workspace" />
        <Link
          to="/dashboard/language"
          aria-label={`${t("lang.language")}: ${currentLang?.label ?? langCode}`}
          className="hidden md:inline-flex relative h-9 items-center gap-1.5 rounded-xl px-2 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Globe className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{langCode}</span>
          {currentLang?.flag && <span className="text-sm leading-none">{currentLang.flag}</span>}
        </Link>
        <IconBtn icon={ThemeIcon} label={themeLabel} onClick={toggle} altTo="/dashboard/appearance" rotateKey={theme + resolved} />
        <IconBtn icon={Mail} label={t("top.messages")} badge={3} hideMobile to="/dashboard/inbox" />
        <IconBtn icon={Bell} label={t("nav.notifications")} badge={7} to="/dashboard/notifications" />
        <IconBtn icon={HelpCircle} label={t("top.help")} hideMobile onClick={() => { if (activeStoreId) navigate({ to: "/store/$storeId/settings/$", params: { storeId: activeStoreId, _splat: "help" } }); else navigate({ to: "/stores" }); }} />


        <button
          onClick={() => create.open()}
          className="hidden md:inline-flex items-center gap-1.5 h-10 px-3.5 ml-1 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium shadow-glow hover:shadow-[0_0_40px_-6px_var(--glow)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
          <Plus className="h-4 w-4" /> {t("common.create")}
        </button>
        <button
          onClick={() => create.open()}
          aria-label={t("common.create")}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" />
        </button>

        {/* Store switcher */}
        {activeStore && (
          <div className="ml-1 hidden sm:block">
            <button
              ref={storeBtnRef}
              onClick={() => setStoreSwitcherOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl h-9 pl-1.5 pr-2.5 hover:bg-white/5 transition-colors border border-white/[0.06]"
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary-gradient text-primary-foreground">
                <StoreIcon className="h-3 w-3" />
              </span>
              <span className="text-xs font-medium max-w-[110px] truncate">{activeStore.name}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <FloatingLayer open={storeSwitcherOpen} onClose={() => setStoreSwitcherOpen(false)} anchorRef={storeBtnRef} align="end" className="w-72 p-2">
              <div className="px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Your stores</div>
              <div className="max-h-64 overflow-auto">
                {stores.map((s) => {
                  const active = s.id === activeStoreId;
                  return (
                    <button key={s.id}
                      onClick={() => { switchStore(s.id); setStoreSwitcherOpen(false); navigate({ to: "/store/$storeId", params: { storeId: s.id } }); }}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-white/5 transition-colors", active && "bg-white/[0.05]")}>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary-gradient text-primary-foreground text-xs font-semibold">
                        {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-full w-full rounded-md object-cover" /> : s.name[0]}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="truncate">{s.name}</div>
                        <div className="truncate text-[10px] text-muted-foreground">/{s.slug}</div>
                      </div>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              <div className="my-1 h-px bg-white/[0.06]" />
              <Link to="/stores" onClick={() => setStoreSwitcherOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
                <StoreIcon className="h-4 w-4" /> All stores
              </Link>
              <Link to="/stores" onClick={() => setStoreSwitcherOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Plus className="h-4 w-4" /> Create new store
              </Link>
            </FloatingLayer>
          </div>
        )}

        {/* Profile */}
        <div className="ml-1">
          <button
            ref={profileBtnRef}
            onClick={() => setProfileOpen(o => !o)}
            className="flex items-center gap-2 rounded-xl p-1 pl-1 pr-2 hover:bg-white/5 transition-colors"
          >
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-gradient text-primary-foreground font-semibold text-[13px]">
              {(user?.name ?? "AL").slice(0, 2).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
            </span>
          </button>
          <FloatingLayer open={profileOpen} onClose={() => setProfileOpen(false)} anchorRef={profileBtnRef} align="end" className="w-64 p-2">
            <div className="p-3 border-b border-white/[0.06] mb-1">
              <div className="text-sm font-medium">{user?.name ?? "Ada Lovelace"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email ?? "ada@aether.co"}</div>
            </div>
            <Link to="/dashboard/profile" onClick={() => setProfileOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <UserCircle className="h-4 w-4" /> {t("top.profile", "Account")}
            </Link>
            <Link to="/stores" onClick={() => setProfileOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <StoreIcon className="h-4 w-4" /> Store switcher
            </Link>
            <button
              onClick={() => { setProfileOpen(false); create.open(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
              <Plus className="h-4 w-4" /> Create store
            </button>
            {activeStoreId && (
              <Link to="/store/$storeId/settings" params={{ storeId: activeStoreId }} onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <Settings className="h-4 w-4" /> Store settings
              </Link>
            )}
            <div className="my-1 h-px bg-white/[0.06]" />
            <button
              onClick={async () => {
                setProfileOpen(false);
                // CRITICAL: Clear tenant data before signing out
                useStoreData.getState().resetAll();
                useSiteStore.getState().resetTenant();
                // Sign out from auth
                signOut();
                // Clear all Zustand persisted localStorage keys to prevent stale data
                try {
                  localStorage.removeItem("aether.auth.v2");
                  localStorage.removeItem("aether.site.v2");
                  localStorage.removeItem("aether.data.v2");
                } catch (err) {
                  console.error("Failed to clear localStorage:", err);
                }
                // Logout from backend
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
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4 w-4" /> {t("common.signOut")}
            </button>
          </FloatingLayer>
        </div>

      </div>
    </motion.header>
  );
}

function IconBtn({
  icon: Icon, label, badge, onClick, glow, hideMobile, to, altTo, rotateKey,
}: { icon: any; label: string; badge?: number; onClick?: () => void; glow?: boolean; hideMobile?: boolean; to?: string; altTo?: string; rotateKey?: string }) {
  const cls = cn(
    "relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground",
    "hover:text-foreground hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5",
    glow && "text-foreground bg-primary-gradient/10 hover:shadow-glow",
    hideMobile && "hidden md:inline-flex"
  );
  const iconEl = rotateKey ? (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={rotateKey}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex"
      >
        <Icon className="h-4 w-4" />
      </motion.span>
    </AnimatePresence>
  ) : (
    <Icon className="h-4 w-4" />
  );
  const inner = (
    <>
      {iconEl}
      {badge != null && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary-gradient text-[9px] font-semibold text-primary-foreground flex items-center justify-center shadow-glow">
          {badge}
        </span>
      )}
    </>
  );
  if (to) return <Link to={to} aria-label={label} className={cls}>{inner}</Link>;
  return (
    <button
      onClick={onClick}
      onDoubleClick={altTo ? () => window.location.assign(altTo) : undefined}
      aria-label={label}
      className={cls}
    >{inner}</button>
  );
}
