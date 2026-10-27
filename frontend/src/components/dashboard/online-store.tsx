import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Monitor, Laptop, Smartphone, Tablet, Gauge, Activity, Layers,
  Eye, Palette, Send, Copy, Pencil, Trash2, Download, Plus, Sparkles,
  CheckCircle2, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useSiteStore } from "@/lib/site-store";
import { getTemplate, TEMPLATES } from "@/lib/templates-data";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { TemplatesMarketplace } from "@/components/templates/templates-marketplace";
import { pushToast } from "@/routes/dashboard.$";

/* ----------------------------- Draft themes store ----------------------------- */

export type DraftTheme = {
  id: string;
  name: string;
  templateId: string;
  themeColorId?: string;
  version: string;
  createdAt: number;
};

type DraftState = {
  drafts: DraftTheme[];
  add: (d: Omit<DraftTheme, "id" | "createdAt">) => string;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => void;
};

export const useDraftThemes = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      add: (d) => {
        const id = `dft_${Math.random().toString(36).slice(2, 9)}`;
        set((s) => ({ drafts: [{ ...d, id, createdAt: Date.now() }, ...s.drafts] }));
        return id;
      },
      remove: (id) => set((s) => ({ drafts: s.drafts.filter((x) => x.id !== id) })),
      rename: (id, name) => set((s) => ({ drafts: s.drafts.map((x) => x.id === id ? { ...x, name } : x) })),
      duplicate: (id) => {
        const src = get().drafts.find((x) => x.id === id);
        if (!src) return;
        const newId = `dft_${Math.random().toString(36).slice(2, 9)}`;
        set((s) => ({ drafts: [{ ...src, id: newId, name: `${src.name} copy`, createdAt: Date.now() }, ...s.drafts] }));
      },
    }),
    { name: "aether-draft-themes" }
  )
);

/* ---------------------------------- Page ---------------------------------- */

export function OnlineStorePage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8 py-6 md:py-10 space-y-10">
        <Header />
        <PerformanceSection />
        <SessionsSection />
        <ActiveThemeSection />
        <DraftThemesSection />
        <AiGeneratorSection />
        <DiscoverThemesSection />
      </div>
    </div>
  );
}

function Header() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Online Store
      </div>
      <h1 className="mt-1 font-display text-2xl md:text-4xl font-semibold tracking-tight">Storefront</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Monitor store health, manage themes and design your customer experience.
      </p>
    </motion.div>
  );
}

/* ------------------------------ Section shell ------------------------------ */

function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start md:items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{title}</div>
          {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------- Performance ------------------------------ */

type PerfMetric = { key: string; label: string; value: string; unit: string; status: "good" | "needs" | "poor"; icon: any; hint: string };

const PERF: PerfMetric[] = [
  { key: "lcp", label: "LCP P75", value: "1.9", unit: "s", status: "good", icon: Gauge, hint: "Largest Contentful Paint" },
  { key: "inp", label: "INP P75", value: "182", unit: "ms", status: "needs", icon: Activity, hint: "Interaction to Next Paint" },
  { key: "cls", label: "CLS", value: "0.06", unit: "", status: "good", icon: Layers, hint: "Cumulative Layout Shift" },
];

function PerformanceSection() {
  return (
    <Section title="Store Performance" subtitle="Core web vitals sampled across the last 28 days.">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERF.map((m, i) => (
          <motion.div key={m.key}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.3 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl glass border border-white/10 p-5 hover:border-white/20 hover:shadow-glow transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{m.label}</div>
                <div className="mt-3 font-display text-3xl font-semibold tracking-tight">
                  {m.value}<span className="text-sm text-muted-foreground ml-1">{m.unit}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
              </div>
              <div className="h-9 w-9 rounded-xl grid place-items-center bg-primary-gradient/15">
                <m.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <StatusBadge status={m.status} />
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className={cn("h-full",
                  m.status === "good" && "bg-emerald-400 w-[85%]",
                  m.status === "needs" && "bg-amber-400 w-[55%]",
                  m.status === "poor" && "bg-rose-400 w-[30%]",
                )} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function StatusBadge({ status }: { status: "good" | "needs" | "poor" }) {
  const map = {
    good: { label: "Good", cls: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
    needs: { label: "Needs improvement", cls: "text-amber-300 bg-amber-400/10 border-amber-400/20" },
    poor: { label: "Poor", cls: "text-rose-300 bg-rose-400/10 border-rose-400/20" },
  }[status];
  return <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", map.cls)}>{map.label}</span>;
}

/* ------------------------------- Sessions ------------------------------- */

const DEVICES = [
  { key: "desktop", label: "Desktop", icon: Monitor, sessions: 12480, share: 48, delta: "+6.2%" },
  { key: "laptop", label: "Laptop", icon: Laptop, sessions: 4210, share: 16, delta: "+1.4%" },
  { key: "mobile", label: "Mobile", icon: Smartphone, sessions: 8140, share: 31, delta: "+9.8%" },
  { key: "tablet", label: "Tablet", icon: Tablet, sessions: 1280, share: 5, delta: "-2.1%" },
];

function SessionsSection() {
  const data = DEVICES.map((d) => ({ name: d.label, sessions: d.sessions }));
  return (
    <Section title="Sessions by Device" subtitle="Last 7 days across your published storefront.">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="grid grid-cols-2 gap-3">
          {DEVICES.map((d, i) => (
            <motion.div key={d.key}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.3 }}
              className="rounded-2xl glass border border-white/10 p-4 hover:border-white/20 transition"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg grid place-items-center bg-primary-gradient/15">
                  <d.icon className="h-4 w-4 text-primary" />
                </div>
                <span className={cn("text-[10px] font-medium", d.delta.startsWith("-") ? "text-rose-300" : "text-emerald-300")}>
                  {d.delta}
                </span>
              </div>
              <div className="mt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{d.label}</div>
              <div className="mt-1 font-display text-xl font-semibold">{d.sessions.toLocaleString()}</div>
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-primary-gradient" style={{ width: `${d.share}%` }} />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">{d.share}% share</div>
            </motion.div>
          ))}
        </div>
        <div className="rounded-2xl glass border border-white/10 p-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-2">Sessions</div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{ background: "rgba(20,20,30,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="sessions" fill="url(#gradSessions)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ Active theme ------------------------------ */

function ActiveThemeSection() {
  const navigate = useNavigate();
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const installed = useSiteStore((s) => s.installed);
  const templateId = useSiteStore((s) => s.templateId);
  const publishStatus = useSiteStore((s) => s.publishStatus);
  const lastSavedAt = useSiteStore((s) => s.lastSavedAt);
  const storeName = useSiteStore((s) => s.storeName);
  const publish = useSiteStore((s) => s.publish);
  const addDraft = useDraftThemes((s) => s.add);

  const tpl = templateId ? getTemplate(templateId) : null;

  if (!installed || !tpl) {
    return (
      <Section title="Active Theme" subtitle="No theme applied yet. Choose one below to get started.">
        <div className="rounded-2xl glass border border-white/10 p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary-gradient/20 grid place-items-center mb-3">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm font-medium">Pick a starting theme</div>
          <div className="text-xs text-muted-foreground mt-1">Browse Discover Themes below and apply one to your store.</div>
        </div>
      </Section>
    );
  }

  const goBuilder = () => navigate({ to: "/builder" });
  const goPreview = () => navigate({ to: "/builder" });
  const doPublish = () => { publish(); pushToast("success", "Publishing your storefront…"); };
  const doDuplicate = () => {
    addDraft({ name: `${tpl.name} copy`, templateId: tpl.id, version: "1.0.0" });
    pushToast("success", "Theme duplicated to drafts");
  };
  const doRename = () => {
    const next = window.prompt("Rename storefront", storeName || tpl.name);
    if (next) useSiteStore.getState().setStoreInfo({ storeName: next });
  };
  const doExport = () => {
    const state = useSiteStore.getState();
    const payload = { templateId: state.templateId, themeColorId: state.themeColorId, pages: state.pages, nav: state.nav };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${tpl.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Section title="Active Theme" subtitle="Currently applied to your storefront.">
      <div className="rounded-2xl glass border border-white/10 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          <div className={cn("relative aspect-[4/3] md:aspect-auto md:h-full bg-gradient-to-br", tpl.tint)}>
            <div className="absolute inset-0 p-5">
              <div className="h-3 w-1/4 rounded-full bg-white/25" />
              <div className="mt-4 h-6 w-3/5 rounded-md bg-white/40" />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((k) => <div key={k} className="aspect-[4/5] rounded-lg bg-white/25" />)}
              </div>
            </div>
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-emerald-400/90 text-emerald-950">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          </div>
          <div className="p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm text-muted-foreground">{tpl.category}</div>
                <div className="font-display text-xl md:text-2xl font-semibold">{tpl.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">by {tpl.author} · Version 1.0.0</div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className={cn("px-2 py-0.5 rounded-full border font-medium",
                  publishStatus === "published" ? "text-emerald-300 bg-emerald-400/10 border-emerald-400/20"
                    : publishStatus === "publishing" ? "text-amber-300 bg-amber-400/10 border-amber-400/20"
                    : "text-muted-foreground bg-white/[0.04] border-white/10")}>
                  {publishStatus}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last saved {lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionBtn onClick={goBuilder} icon={Palette} primary>Customize</ActionBtn>
              <ActionBtn onClick={goPreview} icon={Eye}>Preview</ActionBtn>
              <ActionBtn onClick={doPublish} icon={Send}>Publish</ActionBtn>
              <ActionBtn onClick={doDuplicate} icon={Copy}>Duplicate</ActionBtn>
              <ActionBtn onClick={doRename} icon={Pencil}>Rename</ActionBtn>
              <ActionBtn onClick={doExport} icon={Download}>Export</ActionBtn>
            </div>
          </div>
        </div>
      </div>
      {activeStoreId && <span className="hidden" />}
    </Section>
  );
}

function ActionBtn({ children, icon: Icon, onClick, primary }: { children: React.ReactNode; icon: any; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn("h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-medium transition",
        primary
          ? "bg-primary-gradient text-primary-foreground shadow-glow hover:brightness-110"
          : "glass border border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
      )}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

/* ------------------------------ Draft themes ------------------------------ */

function DraftThemesSection() {
  const drafts = useDraftThemes((s) => s.drafts);
  const remove = useDraftThemes((s) => s.remove);
  const duplicate = useDraftThemes((s) => s.duplicate);
  const rename = useDraftThemes((s) => s.rename);
  const applyTemplate = useSiteStore((s) => s.applyTemplate);
  const navigate = useNavigate();

  if (drafts.length === 0) {
    return (
      <Section title="Draft Themes" subtitle="Themes you're working on but haven't published yet.">
        <div className="rounded-2xl glass border border-white/10 p-8 text-center">
          <div className="text-sm">No drafts yet</div>
          <div className="mt-1 text-xs text-muted-foreground">Duplicate the active theme or apply a new one to create a draft.</div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Draft Themes" subtitle={`${drafts.length} theme${drafts.length === 1 ? "" : "s"} in progress.`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((d) => {
          const tpl = getTemplate(d.templateId);
          if (!tpl) return null;
          const doPreview = () => navigate({ to: "/templates/$id", params: { id: tpl.id } });
          const doCustomize = () => { applyTemplate(tpl.id, d.themeColorId); navigate({ to: "/builder" }); };
          const doPublish = () => { applyTemplate(tpl.id, d.themeColorId); useSiteStore.getState().publish(); remove(d.id); pushToast("success", "Publishing draft…"); };
          const doRename = () => { const n = window.prompt("Rename draft", d.name); if (n) rename(d.id, n); };
          return (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl overflow-hidden glass border border-white/10 hover:border-white/20 hover:shadow-glow transition"
            >
              <div className={cn("relative aspect-[4/3] bg-gradient-to-br", tpl.tint)}>
                <div className="absolute inset-0 p-4">
                  <div className="h-2.5 w-1/4 rounded-full bg-white/25" />
                  <div className="mt-3 h-5 w-2/3 rounded bg-white/40" />
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map((k) => <div key={k} className="aspect-[4/5] rounded bg-white/25" />)}
                  </div>
                </div>
                <span className="absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/90 text-neutral-900">Draft</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">v{d.version} · {new Date(d.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <MiniBtn onClick={doPreview} icon={Eye}>Preview</MiniBtn>
                  <MiniBtn onClick={doCustomize} icon={Palette}>Customize</MiniBtn>
                  <MiniBtn onClick={doPublish} icon={Send} primary>Publish</MiniBtn>
                  <MiniBtn onClick={() => duplicate(d.id)} icon={Copy}>Duplicate</MiniBtn>
                  <MiniBtn onClick={doRename} icon={Pencil}>Rename</MiniBtn>
                  <MiniBtn onClick={() => remove(d.id)} icon={Trash2}>Delete</MiniBtn>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}

function MiniBtn({ children, icon: Icon, onClick, primary }: { children: React.ReactNode; icon: any; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick}
      className={cn("h-7 px-2 rounded-md inline-flex items-center gap-1 text-[11px] transition",
        primary
          ? "bg-primary-gradient text-primary-foreground shadow-glow"
          : "glass border border-white/10 hover:border-white/20 hover:bg-white/[0.06] text-muted-foreground hover:text-foreground"
      )}>
      <Icon className="h-3 w-3" /> {children}
    </button>
  );
}

/* ---------------------------- AI generator ---------------------------- */

function AiGeneratorSection() {
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const applyTemplate = useSiteStore((s) => s.applyTemplate);
  const addDraft = useDraftThemes((s) => s.add);
  const navigate = useNavigate();

  const suggest = useMemo(() => {
    if (!desc.trim()) return null;
    const q = desc.toLowerCase();
    return TEMPLATES.find((t) =>
      t.tags.some((x) => q.includes(x.toLowerCase())) ||
      q.includes(t.category.toLowerCase()) ||
      q.includes(t.industry.toLowerCase())
    ) ?? TEMPLATES[0];
  }, [desc]);

  const generate = async () => {
    if (!desc.trim() || !suggest) return;
    setLoading(true);
    // Backend-ready hook — real generation would call the AI gateway here.
    await new Promise((r) => setTimeout(r, 900));
    addDraft({ name: `AI · ${desc.slice(0, 32) || suggest.name}`, templateId: suggest.id, version: "0.1.0" });
    applyTemplate(suggest.id);
    setLoading(false);
    pushToast("success", "Storefront generated from your description");
    navigate({ to: "/builder" });
  };

  return (
    <Section title="Generate Custom Storefront" subtitle="Crafted with AI. You can customize everything later.">
      <div className="rounded-2xl glass border border-white/10 p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="e.g. Minimal luxury jewelry brand from Milan, focused on lab-grown diamonds and slow storytelling."
            className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm outline-none focus:border-primary/40 focus:shadow-glow transition resize-none"
          />
          <button
            onClick={generate}
            disabled={loading || !desc.trim()}
            className={cn("h-11 px-5 rounded-xl inline-flex items-center gap-2 text-sm font-semibold transition self-start md:self-stretch",
              loading || !desc.trim()
                ? "bg-white/[0.05] text-muted-foreground cursor-not-allowed"
                : "bg-primary-gradient text-primary-foreground shadow-glow hover:brightness-110"
            )}>
            <Sparkles className={cn("h-4 w-4", loading && "animate-spin")} />
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
        {suggest && (
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className={cn("h-8 w-12 rounded-md bg-gradient-to-br", suggest.tint)} />
            Best-match base: <span className="text-foreground font-medium">{suggest.name}</span>
          </div>
        )}
      </div>
    </Section>
  );
}

/* --------------------------- Discover themes --------------------------- */

function DiscoverThemesSection() {
  return (
    <Section
      title="Discover Themes"
      subtitle="Explore professionally designed free and premium themes."
      action={
        <Link to="/templates" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          Open full marketplace <Plus className="h-3 w-3" />
        </Link>
      }
    >
      <div className="rounded-2xl glass border border-white/10 p-4 md:p-5">
        <TemplatesMarketplace embed />
      </div>
    </Section>
  );
}
