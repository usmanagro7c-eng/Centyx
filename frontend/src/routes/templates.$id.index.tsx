import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, Heart, Share2, Monitor, Tablet, Smartphone, Star, Download,
  Sparkles, Zap, Search as SearchIcon, Check, Layers, Palette, Type, X,
} from "lucide-react";
import { z } from "zod";
import { getTemplate } from "@/lib/templates-data";
import { THEME_COLORS, getThemeColor } from "@/lib/theme-colors";
import { SitePreview, PREVIEW_PAGES, type PreviewPage } from "@/components/templates/site-preview";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  color: z.string().optional(),
  page: z.string().optional(),
});

export const Route = createFileRoute("/templates/$id/")({
  head: ({ params }) => {
    const t = getTemplate(params.id);
    return {
      meta: [
        { title: `${t.name} — Template preview` },
        { name: "description", content: t.description },
      ],
    };
  },
  validateSearch: (s: Record<string, unknown>): { color?: string; page?: string } => searchSchema.parse(s),
  component: TemplatePreview,
});

type Device = "desktop" | "tablet" | "mobile";

function TemplatePreview() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const t = getTemplate(id);
  const [device, setDevice] = useState<Device>("desktop");
  const [fav, setFav] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [colorId, setColorId] = useState<string>(search.color ?? "purple");
  const [page, setPage] = useState<PreviewPage>((search.page as PreviewPage) ?? "home");
  const theme = useMemo(() => getThemeColor(colorId), [colorId]);

  const frameW = device === "desktop" ? "100%" : device === "tablet" ? 820 : 380;

  const goApply = () =>
    navigate({ to: "/templates/$id/apply", params: { id: t.id }, search: { color: colorId } as any });

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[420px] w-[420px] rounded-full blur-3xl opacity-30" style={{ background: theme.accent }} />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1400px] px-4 md:px-8 h-16 flex items-center gap-3">
          <Link to="/templates" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm transition">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="ml-2 min-w-0">
            <div className="text-sm font-semibold truncate">{t.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">by {t.author} · {t.category} · <span style={{ color: theme.accent }}>{theme.name}</span></div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DeviceSwitch value={device} onChange={setDevice} />
            <button onClick={() => setFav(v => !v)}
              aria-label="Favorite"
              className={cn("h-9 w-9 rounded-xl glass border border-white/10 grid place-items-center transition",
                fav ? "text-rose-400" : "text-muted-foreground hover:text-foreground"
              )}>
              <Heart className={cn("h-4 w-4", fav && "fill-current")} />
            </button>
            <button aria-label="Share" className="h-9 w-9 rounded-xl glass border border-white/10 grid place-items-center text-muted-foreground hover:text-foreground transition">
              <Share2 className="h-4 w-4" />
            </button>
            <motion.button
              whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold shadow-glow"
              style={{ background: theme.accent, color: theme.ink }}
            >
              <Sparkles className="h-4 w-4" /> Use this template
            </motion.button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Live preview */}
        <div>
          {/* Page tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {PREVIEW_PAGES.map(p => (
              <button key={p.id} onClick={() => setPage(p.id)}
                className={cn("shrink-0 h-8 px-3 rounded-lg text-xs font-medium transition border",
                  page === p.id
                    ? "text-foreground border-transparent shadow-glow"
                    : "text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/5"
                )}
                style={page === p.id ? { background: theme.accent, color: theme.ink } : {}}
              >{p.label}</button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="rounded-3xl glass-strong border border-white/10 shadow-elegant overflow-hidden"
          >
            {/* Browser chrome */}
            <div className="h-10 flex items-center gap-2 px-4 border-b border-white/[0.06] bg-white/[0.02]">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 text-[11px] text-muted-foreground truncate">{t.id}.aether.co / {page}</span>
            </div>
            <div className="p-4 md:p-8 bg-black/20 min-h-[560px] flex justify-center">
              <motion.div
                key={device}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                style={{ width: frameW as any }}
                className="w-full max-w-full transition-all"
              >
                <SitePreview template={t} theme={theme} page={page} device={device} />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right rail */}
        <aside className="space-y-4">
          {/* Theme color selector */}
          <SidePanel title="Theme color">
            <div className="grid grid-cols-6 gap-1.5">
              {THEME_COLORS.map(c => (
                <button key={c.id} onClick={() => setColorId(c.id)}
                  title={c.name}
                  className={cn("relative h-8 w-8 rounded-lg border transition",
                    colorId === c.id ? "border-white ring-2 ring-offset-2 ring-offset-background" : "border-white/10 hover:scale-110"
                  )}
                  style={{ background: c.accent, ...(colorId === c.id ? { boxShadow: `0 0 0 2px ${c.accent}` } as any : {}) }}
                >
                  {colorId === c.id && <Check className="absolute inset-0 m-auto h-3.5 w-3.5" style={{ color: c.ink }} />}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">Selected</div>
              <div className="text-xs font-semibold" style={{ color: theme.accent }}>{theme.name}</div>
            </div>
          </SidePanel>

          <SidePanel>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-300 text-amber-300" /> <span className="font-semibold">{t.rating.toFixed(1)}</span></div>
              <span className="text-xs text-muted-foreground">·</span>
              <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Download className="h-3.5 w-3.5" /> {t.downloads.toLocaleString()}</div>
              <span className="ml-auto text-[10px] px-2 py-1 rounded-md font-semibold" style={{ background: theme.accent, color: theme.ink }}>{t.price}</span>
            </div>
          </SidePanel>

          <SidePanel title="Scorecard">
            <div className="grid grid-cols-2 gap-2">
              <ScoreTile icon={Zap} label="Performance" value={t.perfScore} accent={theme.accent} />
              <ScoreTile icon={SearchIcon} label="SEO" value={t.seoScore} accent={theme.accent} />
            </div>
          </SidePanel>

          <SidePanel title="Pages included">
            <div className="grid grid-cols-2 gap-1.5">
              {["Home","About","Shop","Product","Cart","Checkout","Wishlist","Account","Login","Register","Contact","FAQ","Blog","Article","Search","Privacy","Terms","404"].map(p => (
                <div key={p} className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg glass border border-white/10 text-[11px]">
                  <Check className="h-3 w-3" style={{ color: theme.accent }} /> {p}
                </div>
              ))}
            </div>
          </SidePanel>

          <SidePanel title="Design tokens">
            <div className="space-y-3">
              <Row icon={Palette} label="Palette">
                <div className="flex items-center gap-1.5">
                  {[theme.accent, theme.accentSoft, theme.ink, theme.surface].map((c, k) => (
                    <span key={k} className="h-5 w-5 rounded-md border border-white/10" style={{ background: c }} title={c} />
                  ))}
                </div>
              </Row>
              <Row icon={Type} label="Typography">
                <div className="text-xs text-muted-foreground truncate">{t.fontDisplay} · {t.fontBody}</div>
              </Row>
              <Row icon={Layers} label="Style">
                <span className="text-xs">{t.style}</span>
              </Row>
              <Row icon={Monitor} label="Responsive">
                <span className="text-xs" style={{ color: theme.accent }}>Yes</span>
              </Row>
            </div>
          </SidePanel>

          <motion.button
            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
            onClick={() => setConfirmOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-semibold shadow-glow"
            style={{ background: theme.accent, color: theme.ink }}
          >
            <Sparkles className="h-4 w-4" /> Apply {theme.name}
          </motion.button>
        </aside>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-background/70 backdrop-blur-2xl" onClick={() => setConfirmOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 w-full md:w-[min(480px,calc(100%-2rem))] glass-strong border border-white/10 rounded-3xl p-6 md:p-7 shadow-elegant"
              role="dialog" aria-modal="true"
            >
              <button onClick={() => setConfirmOpen(false)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full glass grid place-items-center hover:rotate-90 transition-all duration-300">
                <X className="h-4 w-4" />
              </button>
              <div className="h-14 w-14 rounded-2xl shadow-glow grid place-items-center" style={{ background: theme.accent }}>
                <Sparkles className="h-6 w-6" style={{ color: theme.ink }} />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">Apply this template?</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{t.name}</span> with the{" "}
                <span className="font-medium" style={{ color: theme.accent }}>{theme.name}</span> theme will be installed as your website starting point.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button onClick={() => setConfirmOpen(false)} className="h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm">Cancel</button>
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={goApply}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold shadow-glow"
                  style={{ background: theme.accent, color: theme.ink }}
                >
                  Apply template <Sparkles className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Bits ---------------- */

function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  const items: { v: Device; icon: any; label: string }[] = [
    { v: "desktop", icon: Monitor, label: "Desktop" },
    { v: "tablet", icon: Tablet, label: "Tablet" },
    { v: "mobile", icon: Smartphone, label: "Mobile" },
  ];
  return (
    <div className="inline-flex h-9 rounded-xl glass border border-white/10 p-0.5">
      {items.map(it => (
        <button key={it.v} onClick={() => onChange(it.v)} aria-label={it.label}
          className={cn("relative h-8 w-9 rounded-lg grid place-items-center transition",
            value === it.v ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
          )}>
          <it.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function SidePanel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="rounded-2xl glass border border-white/10 p-4">
      {title && <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{title}</div>}
      {children}
    </motion.div>
  );
}

function ScoreTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl glass border border-white/10 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="h-3.5 w-3.5" style={{ color: accent }} /> {label}</div>
      <div className="mt-1.5 flex items-end gap-1">
        <span className="font-display text-2xl font-semibold">{value}</span>
        <span className="text-[11px] text-muted-foreground mb-1">/100</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div className="h-full" style={{ background: accent }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5 text-primary" /> {label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
