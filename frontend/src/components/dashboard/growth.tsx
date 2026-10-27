import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, ExternalLink, Rocket, Plus, Download, Search, SlidersHorizontal,
  ArrowUpRight, ArrowDownRight, Globe, Mail, MessageSquare, Users, Target,
  Facebook, Instagram, ChevronDown, X, Play, Pause, Archive, Calendar,
  TrendingUp, DollarSign, ShoppingBag, MousePointerClick, Eye,
} from "lucide-react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { useStoreStats } from "@/lib/store-data-store";
import { useAuthStore } from "@/lib/auth-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/* ================================================================
 *  TYPES + STORE (backend-ready — swap persist for API layer later)
 * ================================================================ */

export type CampaignType =
  | "Email" | "Google Ads" | "Facebook Ads" | "Instagram Ads" | "TikTok Ads"
  | "Organic" | "Referral" | "Affiliate" | "SMS" | "Offline";

export type CampaignStatus = "Draft" | "Scheduled" | "Running" | "Paused" | "Completed" | "Archived";

export type TrafficSource =
  | "Direct" | "Google Search" | "Facebook" | "Instagram"
  | "Email" | "Referral" | "Unknown" | "Other";

export type Campaign = {
  id: string;
  storeId: string;
  name: string;
  type: CampaignType;
  description?: string;
  objective?: string;
  budget: number;
  spent: number;
  revenue: number;
  sessions: number;
  orders: number;
  clicks: number;
  impressions: number;
  startDate: number;
  endDate?: number;
  status: CampaignStatus;
  audience?: string;
  trafficSource: TrafficSource;
  landingPage?: string;
  discountCode?: string;
  createdAt: number;
};

type GrowthState = {
  campaigns: Campaign[];
  createCampaign: (storeId: string, patch: Partial<Campaign> & { name: string; type: CampaignType }) => Campaign;
  updateCampaign: (id: string, patch: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
};

export const useGrowth = create<GrowthState>()(
  persist(
    (set) => ({
      campaigns: [],
      createCampaign: (storeId, patch) => {
        const c: Campaign = {
          id: `cmp_${Math.random().toString(36).slice(2, 10)}`,
          storeId,
          name: patch.name,
          type: patch.type,
          description: patch.description,
          objective: patch.objective,
          budget: patch.budget ?? 0,
          spent: patch.spent ?? 0,
          revenue: patch.revenue ?? 0,
          sessions: patch.sessions ?? 0,
          orders: patch.orders ?? 0,
          clicks: patch.clicks ?? 0,
          impressions: patch.impressions ?? 0,
          startDate: patch.startDate ?? Date.now(),
          endDate: patch.endDate,
          status: patch.status ?? "Draft",
          audience: patch.audience,
          trafficSource: patch.trafficSource ?? "Direct",
          landingPage: patch.landingPage,
          discountCode: patch.discountCode,
          createdAt: Date.now(),
        };
        set((s) => ({ campaigns: [c, ...s.campaigns] }));
        return c;
      },
      updateCampaign: (id, patch) =>
        set((s) => ({ campaigns: s.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),
    }),
    { name: "aether.growth.v1" },
  ),
);

/* ================================================================
 *  Deterministic mock attribution data (per-store, stable per day)
 * ================================================================ */

const SOURCES: TrafficSource[] = [
  "Direct", "Google Search", "Facebook", "Instagram", "Email", "Referral", "Unknown", "Other",
];

const SOURCE_ICON: Record<TrafficSource, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "Direct": Globe as any, "Google Search": Search as any, "Facebook": Facebook as any, "Instagram": Instagram as any,
  "Email": Mail as any, "Referral": ExternalLink as any, "Unknown": Eye as any, "Other": Sparkles as any,
};

const SOURCE_COLOR: Record<TrafficSource, string> = {
  "Direct":        "hsl(210 90% 65%)",
  "Google Search": "hsl(150 70% 55%)",
  "Facebook":      "hsl(220 85% 60%)",
  "Instagram":     "hsl(320 80% 65%)",
  "Email":         "hsl(45 90% 60%)",
  "Referral":      "hsl(275 75% 65%)",
  "Unknown":       "hsl(0 0% 55%)",
  "Other":         "hsl(190 70% 55%)",
};

function seed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

type SourceRow = {
  source: TrafficSource;
  sessions: number;
  revenue: number;
  orders: number;
  cost: number;
  clicks: number;
  impressions: number;
  newCustomerOrders: number;
  returningCustomerOrders: number;
};

function useAttribution(storeId: string, days: number) {
  return useMemo(() => {
    const rnd = seed(`${storeId}:${days}`);
    // per-day series
    const series: Array<Record<string, number | string>> = [];
    const totals: Record<TrafficSource, SourceRow> = Object.fromEntries(
      SOURCES.map((s) => [s, {
        source: s, sessions: 0, revenue: 0, orders: 0, cost: 0,
        clicks: 0, impressions: 0, newCustomerOrders: 0, returningCustomerOrders: 0,
      }]),
    ) as Record<TrafficSource, SourceRow>;
    const base: Record<TrafficSource, number> = {
      "Direct": 120, "Google Search": 260, "Facebook": 90, "Instagram": 140,
      "Email": 60, "Referral": 40, "Unknown": 30, "Other": 25,
    };
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const row: Record<string, number | string> = { date: d.toISOString().slice(5, 10) };
      for (const s of SOURCES) {
        const noise = 0.55 + rnd() * 0.9;
        const wave = 1 + Math.sin((days - i) / 4) * 0.15;
        const sessions = Math.round(base[s] * noise * wave);
        row[s] = sessions;
        const ordersHere = Math.round(sessions * (0.012 + rnd() * 0.04));
        const revHere = Math.round(ordersHere * (45 + rnd() * 110));
        const cost = s.includes("Ads") || s === "Google Search" || s === "Facebook" || s === "Instagram"
          ? Math.round(sessions * (0.25 + rnd() * 0.6)) : 0;
        const clicks = Math.round(sessions * (0.7 + rnd() * 0.3));
        const impr = Math.round(clicks * (8 + rnd() * 20));
        totals[s].sessions += sessions;
        totals[s].orders += ordersHere;
        totals[s].revenue += revHere;
        totals[s].cost += cost;
        totals[s].clicks += clicks;
        totals[s].impressions += impr;
        totals[s].newCustomerOrders += Math.round(ordersHere * (0.55 + rnd() * 0.3));
      }
      series.push(row);
    }
    for (const s of SOURCES) {
      totals[s].returningCustomerOrders = Math.max(0, totals[s].orders - totals[s].newCustomerOrders);
    }
    const rows = SOURCES.map((s) => totals[s]);
    const totalSessions = rows.reduce((n, r) => n + r.sessions, 0);
    const totalRevenue = rows.reduce((n, r) => n + r.revenue, 0);
    const totalOrders = rows.reduce((n, r) => n + r.orders, 0);
    const totalCost = rows.reduce((n, r) => n + r.cost, 0);
    return { series, rows, totalSessions, totalRevenue, totalOrders, totalCost };
  }, [storeId, days]);
}

/* ================================================================
 *  Shared UI helpers
 * ================================================================ */

const fmtCurrency = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtNum = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

function GrowthHeader({
  title, subtitle, action, badge,
}: { title: string; subtitle: string; action?: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight truncate">{title}</h1>
          {badge}
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      </div>
      {action && <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>}
    </motion.div>
  );
}

function EarlyAccessBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
      <Sparkles className="h-3 w-3" /> Early access
    </span>
  );
}

function StatCard({ label, value, delta, trend, icon: Icon }: {
  label: string; value: string; delta?: string; trend?: "up" | "down"; icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl glass-strong border border-white/[0.06] p-4 sm:p-5 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-16 -right-10 h-32 w-32 rounded-full blur-3xl opacity-20"
           style={{ background: "var(--glow)" }} />
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <span className="truncate">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {delta && (
        <div className={cn("mt-1 inline-flex items-center gap-0.5 text-[11px]",
          trend === "down" ? "text-rose-300" : "text-emerald-300")}>
          {trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {delta}
        </div>
      )}
    </motion.div>
  );
}

/* ================================================================
 *  GROWTH DASHBOARD
 * ================================================================ */

export function GrowthDashboardPage() {
  const stats = useStoreStats();
  const storeId = useAuthStore((s) => s.activeStoreId ?? "default");
  const attr = useAttribution(storeId, 30);
  const allCampaigns = useGrowth((s) => s.campaigns);
  const campaigns = useMemo(() => allCampaigns.filter((c) => c.storeId === storeId), [allCampaigns, storeId]);
  const [showCreate, setShowCreate] = useState(false);

  const marketingRevenue = attr.rows
    .filter((r) => r.source !== "Direct" && r.source !== "Unknown")
    .reduce((n, r) => n + r.revenue, 0);
  const salesAttributed = attr.totalRevenue;
  const totalSessions = attr.totalSessions;
  const totalOrders = attr.totalOrders;
  const conv = totalSessions ? (totalOrders / totalSessions) * 100 : 0;
  const aov = totalOrders ? attr.totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-8">
      <GrowthHeader
        title="Growth"
        subtitle="Growth is the new home for Campaigns, Attribution, and Campaign Autopilot."
        badge={<EarlyAccessBadge />}
        action={
          <a href="https://help.shopify.com/en/manual/marketing" target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Learn more <ExternalLink className="h-3.5 w-3.5" />
          </a>
        }
      />

      {/* Autopilot Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl glass-strong border border-white/[0.08] p-6 sm:p-10"
      >
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full blur-[100px]" style={{ background: "var(--glow)" }} />
          <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full blur-[100px]" style={{ background: "var(--glow-2)" }} />
        </div>
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <Rocket className="h-3 w-3" /> Campaign Autopilot
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-4xl font-semibold tracking-tight">
              Run your marketing on autopilot
            </h2>
            <p className="mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
              Let Autopilot plan, launch and optimise your campaigns across Google, Meta and TikTok — using
              your live store data, product catalog and customer segments.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button className="bg-primary-gradient text-primary-foreground shadow-glow">
                Join Waitlist
              </Button>
              <Button variant="outline">Learn more</Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <AutopilotArt />
          </div>
        </div>
      </motion.div>

      {/* Performance */}
      <section className="space-y-4">
        <SectionTitle title="Performance" subtitle="Last 30 days" />
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Sales attributed to marketing" value={fmtCurrency(marketingRevenue)}
            delta="+12.4%" trend="up" icon={Target} />
          <StatCard label="Marketing revenue" value={fmtCurrency(salesAttributed)}
            delta="+8.1%" trend="up" icon={DollarSign} />
          <StatCard label="Sessions" value={fmtNum(totalSessions)} delta="+6.2%" trend="up" icon={Eye} />
          <StatCard label="Orders" value={fmtNum(totalOrders)} delta="+4.5%" trend="up" icon={ShoppingBag} />
          <StatCard label="Conversion rate" value={fmtPct(conv)} delta="+0.3pp" trend="up" icon={MousePointerClick} />
          <StatCard label="Average order value" value={fmtCurrency(aov)}
            delta={stats.avgOrderValue ? "vs store" : ""} trend="up" icon={TrendingUp} />
        </div>
      </section>

      {/* Traffic Sources */}
      <section className="space-y-4">
        <SectionTitle title="Traffic sources" subtitle="Sessions, revenue and conversion by channel" />
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {attr.rows.slice(0, 7).map((r) => (
            <TrafficSourceCard key={r.source} row={r} />
          ))}
        </div>
      </section>

      {/* Recent Campaigns */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle title="Recent campaigns" subtitle="Your latest marketing activity" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Learn more</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create campaign
            </Button>
          </div>
        </div>
        {campaigns.length === 0 ? (
          <EmptyCampaigns onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.slice(0, 6).map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </section>

      <CreateCampaignModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function TrafficSourceCard({ row }: { row: SourceRow }) {
  const Icon = SOURCE_ICON[row.source];
  const conv = row.sessions ? (row.orders / row.sessions) * 100 : 0;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl glass-strong border border-white/[0.06] p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `color-mix(in oklab, ${SOURCE_COLOR[row.source]} 20%, transparent)` }}>
          <Icon className="h-4 w-4" style={{ color: SOURCE_COLOR[row.source] }} />
        </span>
        <div className="font-medium truncate">{row.source}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <Metric label="Sessions" value={fmtNum(row.sessions)} />
        <Metric label="Revenue" value={fmtCurrency(row.revenue)} />
        <Metric label="Orders" value={fmtNum(row.orders)} />
        <Metric label="Conv." value={fmtPct(conv)} />
      </div>
    </motion.div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function EmptyCampaigns({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-8 sm:p-12 text-center"
    >
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
        <Megaphone />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">Centralize your campaign tracking</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
        Create campaigns to evaluate how marketing initiatives drive business goals.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={onCreate}><Plus className="h-4 w-4 mr-1" /> Create campaign</Button>
        <Button variant="outline">Learn more</Button>
      </div>
    </motion.div>
  );
}

function Megaphone() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8"
         strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
      <path d="M3 11v2a1 1 0 0 0 1 1h3l7 4V6L7 10H4a1 1 0 0 0-1 1z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  );
}

function AutopilotArt() {
  return (
    <div className="relative h-56 w-72">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          className="absolute rounded-2xl glass-strong border border-white/10 p-3"
          style={{
            top: 20 + i * 32, left: 30 + i * 30, width: 200,
            background: `linear-gradient(135deg, color-mix(in oklab, ${SOURCE_COLOR[SOURCES[i * 2]]} 25%, transparent), transparent)`,
          }}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Rocket className="h-3 w-3" /> Auto-optimising
          </div>
          <div className="mt-1 font-display text-sm">{["Google", "Meta", "TikTok"][i]} campaign</div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-primary-gradient"
              initial={{ width: "10%" }} animate={{ width: ["10%", "80%", "60%"] }}
              transition={{ duration: 5, repeat: Infinity }} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ================================================================
 *  ATTRIBUTION PAGE
 * ================================================================ */

const DATE_RANGES = [
  { label: "Last 7 days", value: 7 },
  { label: "Last 30 days", value: 30 },
  { label: "Last 90 days", value: 90 },
];

export function AttributionPage() {
  const storeId = useAuthStore((s) => s.activeStoreId ?? "default");
  const [days, setDays] = useState(30);
  const [visible, setVisible] = useState<Record<TrafficSource, boolean>>(
    Object.fromEntries(SOURCES.map((s) => [s, true])) as Record<TrafficSource, boolean>,
  );
  const [sourceFilter, setSourceFilter] = useState<"all" | TrafficSource>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<keyof SourceRow>("sessions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const data = useAttribution(storeId, days);

  const filtered = useMemo(() => {
    let rows = data.rows.slice();
    if (sourceFilter !== "all") rows = rows.filter((r) => r.source === sourceFilter);
    if (q.trim()) rows = rows.filter((r) => r.source.toLowerCase().includes(q.toLowerCase()));
    rows.sort((a, b) => {
      const va = a[sortKey] as number, vb = b[sortKey] as number;
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return rows;
  }, [data.rows, sourceFilter, q, sortKey, sortDir]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));

  const exportCsv = () => {
    const headers = ["Channel", "Sessions", "Sales", "Orders", "Conversion", "Cost", "ROAS", "CPA", "CTR", "AOV", "NewOrders", "ReturningOrders"];
    const lines = [headers.join(",")];
    for (const r of filtered) {
      const conv = r.sessions ? (r.orders / r.sessions) * 100 : 0;
      const roas = r.cost ? r.revenue / r.cost : 0;
      const cpa = r.orders ? r.cost / r.orders : 0;
      const ctr = r.impressions ? (r.clicks / r.impressions) * 100 : 0;
      const aov = r.orders ? r.revenue / r.orders : 0;
      lines.push([r.source, r.sessions, r.revenue, r.orders, conv.toFixed(2), r.cost,
        roas.toFixed(2), cpa.toFixed(2), ctr.toFixed(2), aov.toFixed(2),
        r.newCustomerOrders, r.returningCustomerOrders].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attribution-${days}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <GrowthHeader
        title="Attribution"
        subtitle="See which sources, campaigns and creatives drive revenue."
        badge={<EarlyAccessBadge />}
        action={
          <>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((r) => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All sources" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </>
        }
      />

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-strong border border-white/[0.06] p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setVisible((v) => ({ ...v, [s]: !v[s] }))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
                visible[s]
                  ? "border-white/10 bg-white/5 text-foreground"
                  : "border-white/[0.04] bg-transparent text-muted-foreground/50 line-through",
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_COLOR[s] }} />
              {s}
            </button>
          ))}
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer>
            <LineChart data={data.series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.95)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {SOURCES.filter((s) => visible[s]).map((s) => (
                <Line key={s} type="monotone" dataKey={s} stroke={SOURCE_COLOR[s]}
                      strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-strong border border-white/[0.06] overflow-hidden"
      >
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-white/[0.06]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search channel…" className="pl-8" />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setSortDir((d) => (d === "asc" ? "desc" : "asc")); }}>
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> Sort: {sortDir}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground border-b border-white/[0.06]">
                {[
                  ["source", "Channel"], ["source", "Type"], ["sessions", "Sessions"],
                  ["revenue", "Sales"], ["orders", "Orders"], ["orders", "Conv."],
                  ["cost", "Cost"], ["revenue", "ROAS"], ["cost", "CPA"],
                  ["clicks", "CTR"], ["revenue", "AOV"],
                  ["newCustomerOrders", "New"], ["returningCustomerOrders", "Returning"],
                ].map(([k, l], i) => (
                  <th key={i} className="px-3 py-3 whitespace-nowrap cursor-pointer hover:text-foreground"
                      onClick={() => setSortKey(k as keyof SourceRow)}>
                    {l} {sortKey === k && (sortDir === "asc" ? "↑" : "↓")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => {
                const Icon = SOURCE_ICON[r.source];
                const conv = r.sessions ? (r.orders / r.sessions) * 100 : 0;
                const roas = r.cost ? r.revenue / r.cost : 0;
                const cpa = r.orders ? r.cost / r.orders : 0;
                const ctr = r.impressions ? (r.clicks / r.impressions) * 100 : 0;
                const aov = r.orders ? r.revenue / r.orders : 0;
                const isPaid = ["Google Search", "Facebook", "Instagram"].includes(r.source);
                return (
                  <tr key={r.source} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                              style={{ background: `color-mix(in oklab, ${SOURCE_COLOR[r.source]} 20%, transparent)` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color: SOURCE_COLOR[r.source] }} />
                        </span>
                        <span className="font-medium">{r.source}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{isPaid ? "Paid" : "Organic"}</td>
                    <td className="px-3 py-3">{fmtNum(r.sessions)}</td>
                    <td className="px-3 py-3">{fmtCurrency(r.revenue)}</td>
                    <td className="px-3 py-3">{fmtNum(r.orders)}</td>
                    <td className="px-3 py-3">{fmtPct(conv)}</td>
                    <td className="px-3 py-3">{fmtCurrency(r.cost)}</td>
                    <td className="px-3 py-3">{roas.toFixed(2)}x</td>
                    <td className="px-3 py-3">{fmtCurrency(cpa)}</td>
                    <td className="px-3 py-3">{fmtPct(ctr)}</td>
                    <td className="px-3 py-3">{fmtCurrency(aov)}</td>
                    <td className="px-3 py-3">{fmtNum(r.newCustomerOrders)}</td>
                    <td className="px-3 py-3">{fmtNum(r.returningCustomerOrders)}</td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr><td colSpan={13} className="px-3 py-12 text-center text-muted-foreground">No channels match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-white/[0.06] text-xs text-muted-foreground">
          <span>Showing {paged.length} of {filtered.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <span className="px-2">Page {page} of {pageCount}</span>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================
 *  CAMPAIGNS PAGE
 * ================================================================ */

const STATUS_COLOR: Record<CampaignStatus, string> = {
  Draft: "bg-white/10 text-muted-foreground",
  Scheduled: "bg-amber-500/15 text-amber-300",
  Running: "bg-emerald-500/15 text-emerald-300",
  Paused: "bg-white/10 text-muted-foreground",
  Completed: "bg-primary/15 text-primary",
  Archived: "bg-white/[0.04] text-muted-foreground/70",
};

const TABS: Array<"All" | CampaignStatus> = ["All", "Running", "Scheduled", "Completed", "Archived"];

export function CampaignsPage() {
  const storeId = useAuthStore((s) => s.activeStoreId ?? "default");
  const allCampaigns = useGrowth((s) => s.campaigns);
  const campaigns = useMemo(() => allCampaigns.filter((c) => c.storeId === storeId), [allCampaigns, storeId]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const list = useMemo(() => {
    let items = campaigns;
    if (tab === "All") items = items.filter((c) => c.status !== "Archived");
    else if (tab === "Active" as any) items = items.filter((c) => c.status === "Running");
    else items = items.filter((c) => c.status === tab);
    if (q.trim()) items = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    if (type !== "all") items = items.filter((c) => c.type === type);
    if (source !== "all") items = items.filter((c) => c.trafficSource === source);
    return items;
  }, [campaigns, tab, q, type, source]);

  return (
    <div className="space-y-6">
      <GrowthHeader
        title="Campaigns"
        subtitle="Plan, launch and measure marketing campaigns end to end."
        badge={<EarlyAccessBadge />}
        action={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create campaign
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06]">
        {["All", "Active", "Scheduled", "Completed", "Archived"].map((t) => {
          const key = t as any;
          const active = tab === key || (t === "Active" && tab === "Running");
          return (
            <button key={t}
              onClick={() => setTab(t === "Active" ? "Running" : (t as any))}
              className={cn(
                "relative px-4 py-2.5 text-sm whitespace-nowrap transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
              {active && (
                <motion.span layoutId="campaign-tab" className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-primary-gradient" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campaigns…" className="pl-8" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(["Email","Google Ads","Facebook Ads","Instagram Ads","TikTok Ads","Organic","Referral","Affiliate","SMS","Offline"] as CampaignType[])
              .map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyCampaigns onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {list.map((c) => <CampaignCard key={c.id} c={c} />)}
          </AnimatePresence>
        </div>
      )}

      <CreateCampaignModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function CampaignCard({ c }: { c: Campaign }) {
  const update = useGrowth((s) => s.updateCampaign);
  const del = useGrowth((s) => s.deleteCampaign);
  const roas = c.spent ? c.revenue / c.spent : 0;
  const ctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
  const conv = c.sessions ? (c.orders / c.sessions) * 100 : 0;
  const budgetPct = c.budget ? Math.min(100, (c.spent / c.budget) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl glass-strong border border-white/[0.06] p-5 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]",
              STATUS_COLOR[c.status])}>{c.status}</span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{c.type}</span>
          </div>
          <div className="mt-2 font-display text-lg font-semibold truncate">{c.name}</div>
          {c.description && <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</div>}
        </div>
        <div className="flex gap-1 shrink-0">
          {c.status === "Running" ? (
            <button onClick={() => update(c.id, { status: "Paused" })}
              className="h-7 w-7 rounded-md hover:bg-white/5 inline-flex items-center justify-center" title="Pause">
              <Pause className="h-3.5 w-3.5" />
            </button>
          ) : c.status === "Paused" || c.status === "Draft" || c.status === "Scheduled" ? (
            <button onClick={() => update(c.id, { status: "Running" })}
              className="h-7 w-7 rounded-md hover:bg-white/5 inline-flex items-center justify-center" title="Start">
              <Play className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button onClick={() => update(c.id, { status: "Archived" })}
            className="h-7 w-7 rounded-md hover:bg-white/5 inline-flex items-center justify-center" title="Archive">
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => del(c.id)}
            className="h-7 w-7 rounded-md hover:bg-rose-500/10 hover:text-rose-300 inline-flex items-center justify-center" title="Delete">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric label="Budget" value={fmtCurrency(c.budget)} />
        <Metric label="Spent" value={fmtCurrency(c.spent)} />
        <Metric label="Revenue" value={fmtCurrency(c.revenue)} />
        <Metric label="ROAS" value={`${roas.toFixed(2)}x`} />
        <Metric label="CTR" value={fmtPct(ctr)} />
        <Metric label="Conv." value={fmtPct(conv)} />
        <Metric label="Sessions" value={fmtNum(c.sessions)} />
        <Metric label="Orders" value={fmtNum(c.orders)} />
        <Metric label="Clicks" value={fmtNum(c.clicks)} />
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <span>Budget used</span><span>{budgetPct.toFixed(0)}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div className="h-full bg-primary-gradient"
            initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }} transition={{ duration: 0.6 }} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Calendar className="h-3 w-3" />
        {new Date(c.startDate).toLocaleDateString()}
        {c.endDate ? ` — ${new Date(c.endDate).toLocaleDateString()}` : ""}
      </div>
    </motion.div>
  );
}

/* ================================================================
 *  CREATE CAMPAIGN MODAL
 * ================================================================ */

function CreateCampaignModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const storeId = useAuthStore((s) => s.activeStoreId ?? "default");
  const create = useGrowth((s) => s.createCampaign);
  const [form, setForm] = useState<Partial<Campaign> & { name: string; type: CampaignType }>({
    name: "", type: "Email", status: "Draft", budget: 0, trafficSource: "Email",
    startDate: Date.now(),
  });

  useEffect(() => { if (open) setForm({ name: "", type: "Email", status: "Draft", budget: 0, trafficSource: "Email", startDate: Date.now() }); }, [open]);

  const submit = () => {
    if (!form.name.trim()) return;
    create(storeId, form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create campaign</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Campaign name" full>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Autumn launch 2026" />
          </Field>
          <Field label="Campaign type">
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CampaignType }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Email","Google Ads","Facebook Ads","Instagram Ads","TikTok Ads","Organic","Referral","Affiliate","SMS","Offline"] as CampaignType[])
                  .map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CampaignStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["Draft","Scheduled","Running","Paused","Completed","Archived"] as CampaignStatus[])
                  .map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" full>
            <Textarea rows={2} value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Objective">
            <Input value={form.objective ?? ""} placeholder="Drive traffic, sales…"
              onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} />
          </Field>
          <Field label="Budget (USD)">
            <Input type="number" value={form.budget ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, budget: Number(e.target.value) }))} />
          </Field>
          <Field label="Start date">
            <Input type="date" value={form.startDate ? new Date(form.startDate).toISOString().slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, startDate: new Date(e.target.value).getTime() }))} />
          </Field>
          <Field label="End date">
            <Input type="date" value={form.endDate ? new Date(form.endDate).toISOString().slice(0, 10) : ""}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value ? new Date(e.target.value).getTime() : undefined }))} />
          </Field>
          <Field label="Target audience">
            <Input value={form.audience ?? ""} placeholder="All customers / Segment"
              onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} />
          </Field>
          <Field label="Traffic source">
            <Select value={form.trafficSource} onValueChange={(v) => setForm((f) => ({ ...f, trafficSource: v as TrafficSource }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Landing page URL">
            <Input value={form.landingPage ?? ""} placeholder="/collections/autumn"
              onChange={(e) => setForm((f) => ({ ...f, landingPage: e.target.value }))} />
          </Field>
          <Field label="Discount code (optional)">
            <Input value={form.discountCode ?? ""} placeholder="AUTUMN20"
              onChange={(e) => setForm((f) => ({ ...f, discountCode: e.target.value }))} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name.trim()}>Create campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
