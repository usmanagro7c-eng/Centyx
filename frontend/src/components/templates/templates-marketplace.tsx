import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Star, Download, Sparkles, ArrowLeft, Filter, X,
  Monitor, Eye, ArrowRight, Flame, Clock, Award,
} from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, STYLES, TEMPLATES, type Template } from "@/lib/templates-data";
import { cn } from "@/lib/utils";

export type Sort = "popular" | "newest" | "recent";
export type PriceFilter = "all" | "free" | "premium";

export function TemplatesMarketplace({ embed = false }: { embed?: boolean } = {}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceFilter>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [openMobileFilters, setOpenMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = TEMPLATES.slice();
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some(x => x.toLowerCase().includes(q))
      );
    }
    if (activeCat) list = list.filter(t => t.category === activeCat);
    if (activeStyle) list = list.filter(t => t.style === activeStyle);
    if (price === "free") list = list.filter(t => t.price === "Free");
    if (price === "premium") list = list.filter(t => t.price === "Premium");
    if (sort === "popular") list.sort((a, b) => b.downloads - a.downloads);
    if (sort === "newest") list.sort((a, b) => a.addedDaysAgo - b.addedDaysAgo);
    if (sort === "recent") list.sort((a, b) => a.addedDaysAgo - b.addedDaysAgo);
    return list;
  }, [query, activeCat, activeStyle, price, sort]);

  return (
    <div className={cn("relative text-foreground", embed ? "" : "min-h-screen bg-background")}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[420px] w-[420px] rounded-full blur-3xl opacity-40" style={{ background: "var(--glow)" }} />
        <div className="absolute -bottom-40 right-1/4 h-[420px] w-[420px] rounded-full blur-3xl opacity-30" style={{ background: "var(--glow-2)" }} />
      </div>

      {!embed && (
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8 h-16 flex items-center gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm transition">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground ml-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Marketplace
            </div>
            <div className="relative flex-1 max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search 200+ templates, industries, tags…"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition"
              />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <SegPrice value={price} onChange={setPrice} />
              <SortSelect value={sort} onChange={setSort} />
            </div>
            <button
              onClick={() => setOpenMobileFilters(true)}
              className="md:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm"
            >
              <Filter className="h-4 w-4" /> Filters
            </button>
          </div>
        </header>
      )}

      <div className={cn("mx-auto max-w-[1400px] relative", embed ? "px-0" : "px-4 md:px-8 py-8 md:py-12")}> 
        {/* Hero */}
        {!embed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <Award className="h-3.5 w-3.5 text-primary" /> Curated by Aether
            </div>
            <h1 className="mt-2 font-display text-3xl md:text-5xl font-semibold tracking-tight">Browse Templates</h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
              Choose a professionally designed template and customize it for your business.
            </p>
          </motion.div>
        )}

        {embed && (
          <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search themes, industries, tags…"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <SegPrice value={price} onChange={setPrice} />
              <SortSelect value={sort} onChange={setSort} />
              <button
                onClick={() => setOpenMobileFilters(true)}
                className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm"
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8">
          <aside className="hidden lg:block sticky top-24 self-start space-y-6">
            <FilterBlock title="Industry">
              <div className="space-y-1">
                <ChipRow label="All" active={!activeCat} onClick={() => setActiveCat(null)} />
                {CATEGORIES.map(c => (
                  <ChipRow key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(activeCat === c ? null : c)} />
                ))}
              </div>
            </FilterBlock>
            <FilterBlock title="Style">
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map(s => (
                  <button key={s}
                    onClick={() => setActiveStyle(activeStyle === s ? null : s)}
                    className={cn(
                      "px-2.5 h-7 rounded-full text-[11px] border transition",
                      activeStyle === s
                        ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow"
                        : "glass border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
                    )}
                  >{s}</button>
                ))}
              </div>
            </FilterBlock>
            <FilterBlock title="Price">
              <div className="grid grid-cols-3 gap-1.5">
                {(["all","free","premium"] as PriceFilter[]).map(p => (
                  <button key={p} onClick={() => setPrice(p)}
                    className={cn(
                      "h-8 rounded-lg text-[11px] capitalize transition border",
                      price === p ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "glass border-white/10 text-muted-foreground hover:text-foreground"
                    )}
                  >{p}</button>
                ))}
              </div>
            </FilterBlock>
            <FilterBlock title="Layout">
              <div className="grid grid-cols-2 gap-1.5">
                {["Single column","Split","Sidebar","Grid"].map(l => (
                  <button key={l} className="h-8 rounded-lg text-[11px] glass border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition">{l}</button>
                ))}
              </div>
            </FilterBlock>
          </aside>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-muted-foreground">
                Showing <span className="text-foreground font-medium">{filtered.length}</span> of {TEMPLATES.length}
              </div>
              <div className="flex md:hidden">
                <SortSelect value={sort} onChange={setSort} />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState onReset={() => { setQuery(""); setActiveCat(null); setActiveStyle(null); setPrice("all"); }} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                {filtered.map((t, i) => <TemplateCard key={t.id} t={t} i={i} />)}
              </div>
            )}
          </section>
        </div>
      </div>

      <AnimatePresence>
        {openMobileFilters && (
          <motion.div className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" onClick={() => setOpenMobileFilters(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl glass-strong border-t border-white/10 p-5 pb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium">Filters</div>
                <button onClick={() => setOpenMobileFilters(false)} className="h-8 w-8 rounded-full glass grid place-items-center"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-5">
                <FilterBlock title="Industry">
                  <div className="flex flex-wrap gap-1.5">
                    <ChipRow label="All" active={!activeCat} onClick={() => setActiveCat(null)} />
                    {CATEGORIES.map(c => <ChipRow key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(activeCat === c ? null : c)} />)}
                  </div>
                </FilterBlock>
                <FilterBlock title="Style">
                  <div className="flex flex-wrap gap-1.5">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => setActiveStyle(activeStyle === s ? null : s)}
                        className={cn("px-2.5 h-8 rounded-full text-xs border transition",
                          activeStyle === s ? "bg-primary-gradient text-primary-foreground border-transparent shadow-glow" : "glass border-white/10 text-muted-foreground"
                        )}>{s}</button>
                    ))}
                  </div>
                </FilterBlock>
                <FilterBlock title="Price"><SegPrice value={price} onChange={setPrice} /></FilterBlock>
              </div>
              <button onClick={() => setOpenMobileFilters(false)} className="mt-6 h-11 w-full rounded-xl bg-primary-gradient text-primary-foreground text-sm font-semibold shadow-glow">
                Show {filtered.length} templates
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TemplateCard({ t, i }: { t: Template; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 + Math.min(i, 12) * 0.03, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl glass border border-white/10 hover:border-white/20 hover:shadow-glow transition-all duration-300"
    >
      <Link to="/templates/$id" params={{ id: t.id }} className="block">
        <div className={cn("relative aspect-[4/3] overflow-hidden bg-gradient-to-br", t.tint)}>
          <div className="absolute inset-0 p-5 md:p-6">
            <div className="h-3 w-1/4 rounded-full bg-white/25" />
            <div className="mt-4 h-7 w-3/5 rounded-md bg-white/40" />
            <div className="mt-2 h-3 w-2/5 rounded-full bg-white/20" />
          </div>
        </div>
        <div className="p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-primary"><Star className="h-3.5 w-3.5" /></span>
            <span>{t.category}</span>
            <span className="text-muted-foreground">·</span>
            <span>{t.price}</span>
          </div>
          <div className="text-lg font-semibold">{t.name}</div>
          <div className="text-sm text-muted-foreground line-clamp-3">{t.description}</div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.downloads} downloads</span>
            <span>{t.addedDaysAgo} days ago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary">
            <Download className="h-4 w-4" /> Purchase
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3">
      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function ChipRow({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      "w-full text-left rounded-full px-3 py-2 text-sm transition",
      active ? "bg-primary-gradient text-primary-foreground shadow-glow" : "glass border border-white/10 text-muted-foreground hover:text-foreground"
    )}>
      {label}
    </button>
  );
}

function SegPrice({ value, onChange }: { value: PriceFilter; onChange: (next: PriceFilter) => void }) {
  return (
    <div className="inline-flex rounded-full bg-white/[0.04] p-1 border border-white/10">
      {(["all","free","premium"] as PriceFilter[]).map(option => (
        <button key={option} onClick={() => onChange(option)}
          className={cn("px-3 py-2 text-xs rounded-full transition", value === option ? "bg-white text-foreground" : "text-muted-foreground hover:bg-white/10")}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: Sort; onChange: (value: Sort) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value as Sort)}
      className="h-9 rounded-xl bg-white/[0.03] border border-white/10 px-3 text-sm text-foreground outline-none focus:border-primary/40 transition">
      <option value="popular">Popular</option>
      <option value="newest">Newest</option>
      <option value="recent">Recent</option>
    </select>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
      <div className="text-xl font-semibold">No templates found</div>
      <div className="mt-3 text-sm text-muted-foreground">Try resetting your filters or adjusting your search.</div>
      <button onClick={onReset} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
        Reset filters
      </button>
    </div>
  );
}
