import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronDown, ShoppingBag, Heart } from "lucide-react";
import { useSiteStore, type NavItem } from "@/lib/site-store";
import { useStoreData } from "@/lib/store-data-store";
import { useSiteUI } from "@/lib/site-ui-store";
import { renderSection } from "@/components/site/sections";
import { CartDrawer, SiteToaster } from "@/components/site/cart-drawer";
import { cn } from "@/lib/utils";

type Props = {
  pageId?: string;
  onSelectSection?: (id: string) => void;
  selectedSectionId?: string | null;
  onNavigatePage?: (pageId: string) => void;
  overrideMain?: React.ReactNode;
};

export function SiteRender({ pageId, onSelectSection, selectedSectionId, onNavigatePage, overrideMain }: Props) {
  const s = useSiteStore();
  const activePageId = pageId ?? s.currentPageId;
  const page = s.pages.find((p) => p.id === activePageId);

  if (!s.installed || !page) {
    return (
      <div className="min-h-[400px] grid place-items-center text-muted-foreground text-sm">
        No template installed yet.
      </div>
    );
  }

  const ctx = { accent: s.accent, fontDisplay: s.fontDisplay, fontBody: s.fontBody, mode: s.mode, radius: s.radius };

  return (
    <div className={cn("@container", s.mode === "light" ? "bg-white text-black" : "bg-[#0a0a0a] text-white")}
      style={{ fontFamily: s.fontBody, ["--radius" as any]: `${s.radius}px` }}
    >
      <SiteHeader onNavigatePage={onNavigatePage} />

      <main>
        {overrideMain ?? page.sections.filter((sec) => sec.visible).map((sec) => {
          const selectable = !!onSelectSection;
          const Wrapper: any = selectable ? "button" : "div";
          const wrapperProps: any = selectable
            ? {
                type: "button",
                onClick: (e: React.MouseEvent) => { e.preventDefault(); onSelectSection?.(sec.id); },
                className: cn(
                  "block w-full text-left relative outline-none transition",
                  selectedSectionId === sec.id ? "ring-2 ring-inset ring-primary/60" : "hover:ring-1 hover:ring-inset hover:ring-white/15",
                ),
              }
            : { className: "relative" };
          return (
            <Wrapper key={sec.id} {...wrapperProps}>
              {selectable && selectedSectionId === sec.id && (
                <span className="absolute top-2 left-2 z-20 h-6 px-2 rounded-md text-[10px] font-semibold inline-flex items-center"
                  style={{ background: s.accent, color: "#000" }}>
                  {sec.type}
                </span>
              )}
              <SectionErrorBoundary type={sec.type}>
                {renderSection(sec, ctx)}
              </SectionErrorBoundary>
            </Wrapper>
          );
        })}

      </main>

      <SiteFooter />
      <CartDrawer />
      <SiteToaster />
    </div>
  );
}

function SiteHeader({ onNavigatePage }: { onNavigatePage?: (pageId: string) => void }) {
  const s = useSiteStore();
  const visibleNav = s.nav.filter((n) => n.visible);
  const home = s.pages.find((p) => p.slug === "home");
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const goto = (n: NavItem | { pageId: string | null; url?: string }) => {
    if (n.pageId) onNavigatePage?.(n.pageId);
    else if (n.url) window.open(n.url, "_blank");
    setOpen(false);
    setOpenMenu(null);
  };

  const isLight = s.mode === "light";
  const borderColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const activePageId = s.currentPageId;

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor, background: isLight ? "rgba(255,255,255,0.7)" : "rgba(10,10,10,0.65)" }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-10 h-14 flex items-center gap-4 sm:gap-6">
        <button onClick={() => home && onNavigatePage?.(home.id)} className="flex items-center gap-2 min-w-0 shrink-0" style={{ fontFamily: s.fontDisplay }}>
          {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-7 w-7 rounded object-cover shrink-0" /> : null}
          <span className="text-base font-semibold tracking-tight truncate">{s.storeName || "Brand"}</span>
        </button>

        <nav className="hidden @5xl:flex items-center gap-5 text-sm ml-2 min-w-0">
          {visibleNav.map((n) => {
            const kids = n.children ?? [];
            if (kids.length === 0) {
              return (
                <button key={n.id} onClick={() => goto(n)} className="text-muted-foreground hover:text-foreground transition whitespace-nowrap">
                  {n.label}
                </button>
              );
            }
            return (
              <div key={n.id} className="relative" onMouseEnter={() => setOpenMenu(n.id)} onMouseLeave={() => setOpenMenu(null)}>
                <button onClick={() => goto(n)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition whitespace-nowrap">
                  {n.label} <ChevronDown className="h-3 w-3" />
                </button>
                <AnimatePresence>
                  {openMenu === n.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 pt-2 min-w-[200px] z-50"
                    >
                      <div className="rounded-xl border shadow-2xl overflow-hidden"
                        style={{ background: isLight ? "#fff" : "#0f0f10", borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)" }}>
                        {kids.map((c) => (
                          <button key={c.id} onClick={() => goto(c)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <WishlistButton accent={s.accent} isLight={isLight} />
          <CartButton accent={s.accent} isLight={isLight} />
          <button className="hidden @5xl:inline-flex h-8 px-3 rounded-full text-xs font-medium items-center" style={{ background: s.accent, color: "#000" }}>Get started</button>
          {/* Animated Hamburger */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="@5xl:hidden relative h-10 w-10 rounded-lg grid place-items-center border transition-colors"
            style={{ borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)" }}
          >
            <span className="relative block h-4 w-5">
              <motion.span
                className="absolute left-0 right-0 h-[2px] rounded-full bg-current"
                animate={open ? { top: "50%", y: "-50%", rotate: 45 } : { top: 0, y: 0, rotate: 0 }}
                transition={{ duration: 0.25 }}
              />
              <motion.span
                className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-current"
                animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute left-0 right-0 h-[2px] rounded-full bg-current"
                animate={open ? { bottom: "50%", y: "50%", rotate: -45 } : { bottom: 0, y: 0, rotate: 0 }}
                transition={{ duration: 0.25 }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile drawer — portaled to body so `fixed` escapes the @container ancestor */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[9999]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ fontFamily: s.fontBody }}
            >
              <motion.div
                className="absolute inset-0 backdrop-blur-xl"
                style={{ background: isLight ? "rgba(15,15,20,0.35)" : "rgba(0,0,0,0.6)" }}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              />
              <motion.aside
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                className="absolute right-0 top-0 h-full w-[88%] max-w-sm flex flex-col shadow-2xl"
                style={{ background: isLight ? "rgba(255,255,255,0.98)" : "rgba(10,10,10,0.98)", borderLeft: `1px solid ${borderColor}`, color: isLight ? "#0a0a0a" : "#fff" }}
              >
                <div className="h-14 px-5 flex items-center justify-between border-b shrink-0" style={{ borderColor }}>
                  <div className="flex items-center gap-2 min-w-0">
                    {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-6 w-6 rounded object-cover shrink-0" /> : null}
                    <span className="font-semibold truncate" style={{ fontFamily: s.fontDisplay }}>{s.storeName || "Brand"}</span>
                  </div>
                  <button aria-label="Close" onClick={() => setOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                  {visibleNav.map((n, i) => {
                    const kids = n.children ?? [];
                    const isActive = n.pageId && n.pageId === activePageId;
                    const isOpen = !!expanded[n.id];
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.22 }}
                      >
                        <div className="flex items-stretch">
                          <button
                            onClick={() => goto(n)}
                            className={cn(
                              "flex-1 text-left px-4 py-3 rounded-lg text-base font-medium transition-colors",
                              isActive ? "bg-black/5 dark:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5"
                            )}
                            style={isActive ? { color: s.accent } : undefined}
                          >
                            {n.label}
                          </button>
                          {kids.length > 0 && (
                            <button
                              aria-label="Toggle submenu"
                              onClick={() => setExpanded((e) => ({ ...e, [n.id]: !e[n.id] }))}
                              className="px-3 grid place-items-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="h-4 w-4" />
                              </motion.span>
                            </button>
                          )}
                        </div>
                        <AnimatePresence initial={false}>
                          {kids.length > 0 && isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden pl-4 ml-4 border-l"
                              style={{ borderColor }}
                            >
                              {kids.map((c) => (
                                <button key={c.id} onClick={() => goto(c)} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                                  {c.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </nav>
                <div className="p-4 border-t shrink-0" style={{ borderColor }}>
                  <button className="w-full h-11 rounded-full text-sm font-semibold" style={{ background: s.accent, color: "#000" }}>Get started</button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}

function CartButton({ accent, isLight }: { accent: string; isLight: boolean }) {
  const cart = useStoreData((s) => s.cart);
  const openCart = useSiteUI((u) => u.openCart);
  const count = cart.reduce((n, c) => n + c.qty, 0);
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (count === 0) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 350);
    return () => clearTimeout(t);
  }, [count]);
  return (
    <button type="button" onClick={openCart} aria-label={`Open cart (${count} items)`}
      className="relative h-10 w-10 rounded-lg grid place-items-center border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      style={{ borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)" }}>
      <motion.span animate={pulse ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
        <ShoppingBag className="h-4 w-4" />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-black grid place-items-center"
            style={{ background: accent }}>{count}</motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function WishlistButton({ accent, isLight }: { accent: string; isLight: boolean }) {
  const count = useStoreData((s) => s.wishlist.length);
  const href = (() => {
    if (typeof window === "undefined") return "?view=wishlist";
    const u = new URL(window.location.href);
    u.searchParams.set("view", "wishlist");
    u.searchParams.delete("product");
    return u.pathname + u.search;
  })();
  return (
    <a href={href} aria-label={`Wishlist (${count} items)`}
      className="relative h-10 w-10 rounded-lg grid place-items-center border transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      style={{ borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)" }}>
      <Heart className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-black grid place-items-center"
          style={{ background: accent }}>{count}</span>
      ) : null}
    </a>
  );
}

function SiteFooter() {
  const s = useSiteStore();
  const nav = s.nav.filter((n) => n.visible);
  const f = s.footer;
  return (
    <footer className="border-t mt-6" style={{ borderColor: s.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-10 grid gap-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-semibold" style={{ fontFamily: s.fontDisplay }}>{s.storeName || "Brand"}</div>
          {f?.tagline && <div className="mt-2 text-sm text-muted-foreground max-w-sm">{f.tagline}</div>}
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            {f?.email && <div>{f.email}</div>}
            {f?.phone && <div>{f.phone}</div>}
            {f?.address && <div className="whitespace-pre-line">{f.address}</div>}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Explore</div>
          <ul className="space-y-1.5 text-sm">
            {nav.map((n) => <li key={n.id}>{n.label}</li>)}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Follow</div>
          <ul className="space-y-1.5 text-sm">
            {(f?.socials ?? []).map((sc, i) => <li key={i}><a href={sc.url} target="_blank" rel="noreferrer" className="hover:underline">{sc.label}</a></li>)}
          </ul>
        </div>
      </div>
      <div className="border-t px-6 md:px-10 py-4 text-xs text-muted-foreground" style={{ borderColor: s.mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
        {f?.copyright || `© ${new Date().getFullYear()}`}
      </div>
    </footer>
  );
}

class SectionErrorBoundary extends React.Component<
  { type: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[SiteRender] Section "${this.props.type}" failed:`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="px-6 py-10 text-center text-sm text-muted-foreground border border-dashed border-white/10 rounded-2xl m-4">
          Section <span className="font-mono">{this.props.type}</span> could not be rendered.
        </div>
      );
    }
    return this.props.children as any;
  }
}

