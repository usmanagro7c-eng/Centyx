import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronsLeft, Sparkles, X, Settings } from "lucide-react";
import { NAV, SETTINGS_ITEM, type NavItem } from "./nav-config";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

function useSlugAndBase() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeStoreId = useAuthStore((s) => s.activeStoreId);

  return useMemo(() => {
    // /store/$id/settings/...  → treat separately
    const storeMatch = pathname.match(/^\/store\/([^/]+)(?:\/(.*))?$/);
    if (storeMatch) {
      const rest = storeMatch[2] ?? "";
      if (rest.startsWith("settings")) return { activeSlug: "settings", base: `/store/${storeMatch[1]}`, inSettings: true };
      return { activeSlug: rest, base: `/store/${storeMatch[1]}`, inSettings: false };
    }
    if (pathname.startsWith("/templates")) {
      return { activeSlug: "online-store", base: activeStoreId ? `/store/${activeStoreId}` : "/dashboard", inSettings: false };
    }
    if (pathname.startsWith("/builder")) {
      return { activeSlug: "builder", base: activeStoreId ? `/store/${activeStoreId}` : "/dashboard", inSettings: false };
    }
    // legacy /dashboard/*
    const rest = pathname.replace(/^\/dashboard\/?/, "");
    return {
      activeSlug: rest,
      base: activeStoreId ? `/store/${activeStoreId}` : "/dashboard",
      inSettings: false,
    };
  }, [pathname, activeStoreId]);
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const t = useT();
  const { activeSlug, base } = useSlugAndBase();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const activeStore = useAuthStore((s) => s.stores.find((x) => x.id === s.activeStoreId) ?? null);
  const ensureDefaultStore = useAuthStore((s) => s.ensureDefaultStore);

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-xl lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 272 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen shrink-0",
          "glass-strong border-r border-white/[0.06]",
          "flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300"
        )}
      >
        <div className="pointer-events-none absolute -top-20 -left-10 h-64 w-64 rounded-full blur-3xl opacity-30"
             style={{ background: "var(--glow)" }} />

        {/* Logo + Store */}
        <div className="relative flex items-center justify-between px-4 h-16 border-b border-white/[0.06]">
          <Link to="/stores" className="flex items-center gap-2.5 font-display font-semibold min-w-0">
            <motion.span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-gradient shadow-glow"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </motion.span>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  className="min-w-0"
                >
                  <div className="truncate text-[15px] leading-tight">Aether</div>
                  {activeStore && (
                    <div className="truncate text-[10px] text-muted-foreground/80 uppercase tracking-[0.14em]">
                      {activeStore.name}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-none">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.title && !collapsed && (
                <div className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/70">
                  {group.titleKey ? t(group.titleKey, group.title) : group.title}
                </div>
              )}
              {group.title && collapsed && (
                <div className="mx-3 mb-2 h-px bg-white/[0.06]" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavRow key={item.slug || "home"} item={item} collapsed={collapsed} activeSlug={activeSlug} base={base} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: Store Settings + Collapse */}
        <div className="border-t border-white/[0.06] p-3 space-y-1">
          <SettingsFooterLink
            collapsed={collapsed}
            activeStoreId={activeStoreId}
            ensureDefaultStore={ensureDefaultStore}
            label={t("nav.storeSettings", SETTINGS_ITEM.label)}
          />
          <button
            onClick={onToggle}
            className={cn(
              "hidden lg:flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs text-muted-foreground",
              "hover:bg-white/5 hover:text-foreground transition-colors"
            )}
          >
            <motion.span animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronsLeft className="h-4 w-4" />
            </motion.span>
            {!collapsed && <span>{t("common.collapse", "Collapse")}</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function SettingsFooterLink({
  collapsed, activeStoreId, ensureDefaultStore, label,
}: { collapsed: boolean; activeStoreId: string | null; ensureDefaultStore: () => { id: string }; label: string }) {
  const navigate = useNavigate();
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    const id = activeStoreId ?? ensureDefaultStore().id;
    navigate({ to: "/store/$storeId/settings", params: { storeId: id } });
  };
  return (
    <a
      href="#"
      onClick={go}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
        "text-muted-foreground hover:text-foreground transition-colors",
      )}
    >
      <Settings className="h-[18px] w-[18px] shrink-0 group-hover:rotate-45 transition-transform duration-300" />
      {!collapsed && <span className="truncate">{label}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1.5 text-xs opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-elegant z-50">
          {label}
        </span>
      )}
    </a>
  );
}

function NavRow({ item, collapsed, activeSlug, base }: { item: NavItem; collapsed: boolean; activeSlug: string; base: string }) {
  const t = useT();
  const label = item.labelKey ? t(item.labelKey, item.label) : item.label;
  const hasKids = !!item.children?.length;
  const isActive = activeSlug === item.slug;
  const isDescendantActive = hasKids && item.children!.some((c) => activeSlug === c.slug || activeSlug.startsWith(c.slug + "/"));
  const [open, setOpen] = useState(isActive || isDescendantActive || (item.slug !== "" && activeSlug.startsWith(item.slug + "/")));

  useEffect(() => { if (isDescendantActive || isActive) setOpen(true); }, [isDescendantActive, isActive]);

  const linkTo = (slug: string) => {
    if (base.startsWith("/store/")) {
      const storeId = base.split("/")[2];
      if (!slug) return { to: "/store/$storeId", params: { storeId } } as const;
      return { to: "/store/$storeId/$", params: { storeId, _splat: slug } } as const;
    }
    if (!slug) return { to: "/dashboard" } as const;
    return { to: "/dashboard/$", params: { _splat: slug } } as const;
  };

  const target = item.href ? { to: item.href } as const : linkTo(item.slug);

  return (
    <li>
      <div className="relative group">
        <Link
          {...(target as any)}
          className={cn(
            "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
            "text-muted-foreground hover:text-foreground",
            "transition-colors duration-200",
            (isActive || isDescendantActive) && "text-foreground",
          )}
        >
          {(isActive || isDescendantActive) && (
            <motion.span
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl bg-primary-gradient opacity-[0.14] shadow-glow"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          )}
          {isActive && (
            <motion.span
              layoutId="nav-active-bar"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-gradient shadow-glow"
            />
          )}
          <item.icon className={cn("relative h-[18px] w-[18px] shrink-0 transition-transform duration-200",
            "group-hover:scale-110 group-hover:rotate-[-4deg]",
            (isActive || isDescendantActive) && "text-primary")} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="relative flex-1 truncate">
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && hasKids && (
            <button
              type="button"
              aria-label={open ? "Collapse section" : "Expand section"}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
              className="relative -mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-white/10"
            >
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg glass-strong px-2.5 py-1.5 text-xs opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-elegant z-50">
              {label}
            </span>
          )}
        </Link>
      </div>

      {hasKids && !collapsed && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden ml-3.5 mt-1 border-l border-white/[0.06] pl-3 space-y-0.5"
            >
              {item.children!.map((c) => {
                const cActive = activeSlug === c.slug;
                const childTarget = linkTo(c.slug);
                return (
                  <li key={c.slug}>
                    <Link
                      {...(childTarget as any)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px]",
                        "text-muted-foreground/80 hover:text-foreground hover:bg-white/[0.04]",
                        "transition-colors duration-200",
                        cActive && "text-foreground bg-white/[0.05]"
                      )}
                    >
                      <c.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{c.labelKey ? t(c.labelKey, c.label) : c.label}</span>
                      {cActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />}
                    </Link>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </li>
  );
}
