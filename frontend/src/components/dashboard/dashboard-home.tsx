import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  ArrowUpRight, Sparkles, Zap, Plus, ArrowRight, Activity, Bot,
  CheckCircle2, Clock, AlertCircle, Truck, Rocket, Globe, Palette, Layers, FileText, ExternalLink,
  Heart, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteStore } from "@/lib/site-store";
import { useStoreData, useStoreStats } from "@/lib/store-data-store";
import { getTemplate } from "@/lib/templates-data";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useAllInventory } from "@/hooks/useProducts";
import type { AnalyticsData } from "@/api/analytics";
import type { Order } from "@/lib/store-data-store";

type Stat = { label: string; value: number; prefix?: string; suffix?: string; change: number; icon: any; tint: string; spark: number[] };

function useCountUp(target: number, dur = 1200) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, dur]);
  return { ref, value: v };
}

function Counter({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const { ref, value: v } = useCountUp(value);
  return <span ref={ref}>{prefix}{v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

function useLiveStats(analytics: AnalyticsData, productCount: number): Stat[] {
  return [
    { label: "Revenue",   value: analytics.revenue, prefix: "PKR ", change: analytics.revenueGrowth, icon: DollarSign, tint: "from-violet-500/30 to-fuchsia-500/10", spark: analytics.dailyRevenue.map((point) => point.value).slice(-12) },
    { label: "Orders",    value: analytics.orders,             change: analytics.ordersGrowth,  icon: ShoppingCart, tint: "from-cyan-500/30 to-sky-500/10",       spark: [analytics.orders] },
    { label: "Customers", value: analytics.totalCustomers,     change: analytics.customersGrowth, icon: Users,        tint: "from-emerald-500/30 to-teal-500/10",   spark: [analytics.totalCustomers] },
    { label: "Products",  value: productCount,                 change: 0, icon: Package,      tint: "from-rose-500/30 to-orange-500/10",    spark: [productCount] },
  ];
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const safe = (data ?? []).filter((value) => Number.isFinite(value));
  const w = 100, h = 32;

  if (!safe.length) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--muted)" strokeDasharray="3 4" opacity="0.5" />
      </svg>
    );
  }

  const max = Math.max(...safe), min = Math.min(...safe);
  const span = max - min || 1;
  const pts = safe.map((d, i) => {
    const x = safe.length === 1 ? w / 2 : (i / (safe.length - 1)) * w;
    const y = h - ((d - min) / span) * h;
    return `${x},${y}`;
  }).join(" ");
  const stroke = positive ? "var(--glow-2)" : "oklch(0.65 0.24 25)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <defs>
        <linearGradient id={`g-${positive}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.polyline
        fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        points={pts}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g-${positive})`} />
    </svg>
  );
}

function StatCard({ s, i }: { s: Stat; i: number }) {
  const positive = s.change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl glass-strong p-5 overflow-hidden shadow-card hover:shadow-glow transition-shadow duration-300"
    >
      <div className={cn("absolute -top-16 -right-16 h-40 w-40 rounded-full blur-3xl opacity-70 bg-gradient-to-br", s.tint)} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium tracking-wide">{s.label}</div>
          <div className="mt-1.5 font-display text-2xl md:text-3xl font-semibold tracking-tight">
            <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
          </div>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl glass border border-white/10 group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-300">
          <s.icon className="h-4 w-4 text-primary" />
        </span>
      </div>
      <div className="relative mt-3 flex items-center gap-2">
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium",
          positive ? "text-emerald-400" : "text-rose-400")}>
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {positive ? "+" : ""}{s.change}%
        </span>
        <span className="text-xs text-muted-foreground">vs last week</span>
      </div>
      <div className="relative mt-3"><Sparkline data={s.spark} positive={positive} /></div>
    </motion.div>
  );
}

function SalesChart({ data, labels }: { data: number[]; labels: string[] }) {
  const chartData = data.length ? data : [0];
  const chartLabels = labels.length ? labels : ["—"];
  const max = Math.max(...chartData, 1);
  const w = 600, h = 220, pad = 24;
  const step = chartData.length > 1 ? (w - pad * 2) / (chartData.length - 1) : 0;
  const pts = chartData.map((d, i) => [pad + i * step, h - pad - (d / max) * (h - pad * 2)] as const);
  const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const area = `${path} L ${pts[pts.length-1][0]} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card lg:col-span-2">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm font-medium">Sales performance</div>
          <div className="text-xs text-muted-foreground mt-0.5">Revenue over the last 12 months</div>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {["1M","3M","12M","All"].map((t, i) => (
            <button key={t} className={cn(
              "px-2.5 py-1 rounded-lg transition-colors",
              i === 2 ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
            )}>{t}</button>
          ))}
        </div>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
          <defs>
            <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stroke-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--glow)" />
              <stop offset="100%" stopColor="var(--glow-2)" />
            </linearGradient>
          </defs>
          {[0,1,2,3].map(i => (
            <line key={i} x1={pad} x2={w - pad} y1={pad + i * ((h - pad*2)/3)} y2={pad + i * ((h - pad*2)/3)}
              stroke="oklch(1 0 0 / 0.05)" strokeDasharray="3 5" />
          ))}
          <motion.path d={area} fill="url(#area-fill)"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.8 }} />
          <motion.path d={path} fill="none" stroke="url(#stroke-grad)" strokeWidth="2.5" strokeLinecap="round"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: "easeOut" }} />
          {pts.map((p, i) => (
            <motion.circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--background)" stroke="url(#stroke-grad)" strokeWidth="2"
              initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.8 + i * 0.05 }} />
          ))}
        </svg>
        <div className="grid grid-cols-12 mt-1 px-6 text-[10px] text-muted-foreground/70">
          {chartLabels.map(l => <div key={l} className="text-center">{l}</div>)}
        </div>
      </div>
    </motion.div>
  );
}

function AIInsights() {
  const insights = [
    { icon: Zap, text: "Peak sales expected Fri 6–9 PM — schedule an email blast.", accent: "text-amber-300" },
    { icon: TrendingUp, text: '"Aurora Hoodie" sales up 34% — restock recommended.', accent: "text-emerald-300" },
    { icon: AlertCircle, text: "Checkout drop-off spiked on mobile in Germany.", accent: "text-rose-300" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative rounded-2xl p-5 md:p-6 overflow-hidden border border-white/10 shadow-card">
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 animate-gradient" />
      <div className="absolute inset-0 glass-strong" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient shadow-glow">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </span>
          <div>
            <div className="text-sm font-medium">AI Insights</div>
            <div className="text-[11px] text-muted-foreground">Updated just now</div>
          </div>
        </div>
        <ul className="space-y-2.5">
          {insights.map((i, idx) => (
            <motion.li key={idx}
              initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.2 + idx * 0.08 }}
              className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
              <i.icon className={cn("h-4 w-4 mt-0.5 shrink-0", i.accent)} />
              <span className="text-xs leading-relaxed text-foreground/90">{i.text}</span>
            </motion.li>
          ))}
        </ul>
        <button className="mt-4 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl glass hover:bg-white/[0.08] text-xs font-medium transition-colors">
          Open AI Assistant <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function RecentOrders({ orders }: { orders: Order[] }) {
  const toneMap: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    amber:   "bg-amber-500/15 text-amber-300 border-amber-500/20",
    rose:    "bg-rose-500/15 text-rose-300 border-rose-500/20",
    cyan:    "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-medium">Recent orders</div>
          <div className="text-xs text-muted-foreground mt-0.5">Latest transactions across your store</div>
        </div>
        <button className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors">
          View all <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-white/[0.05]">
        {orders.map((o, i) => (
          <motion.div key={o.id}
            initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_120px_120px] items-center gap-3 py-3 group">
            <div className="text-xs font-mono text-muted-foreground">{o.number || o.id}</div>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gradient text-primary-foreground text-[11px] font-semibold">
                {o.customerName.split(" ").map((namePart) => namePart[0]).join("")}
              </span>
              <span className="text-sm truncate">{o.customerName}</span>
            </div>
            <span className={cn("hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium", toneMap[o.status === "Cancelled" || o.status === "Refunded" ? "rose" : o.status === "Draft" || o.status === "Pending" ? "amber" : "emerald"])}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{o.status}
            </span>
            <div className="text-sm font-medium text-right">PKR {o.total.toLocaleString("en-PK", { maximumFractionDigits: 0 })}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TopProducts({ products }: { products: AnalyticsData["topProducts"] }) {
  const maxSold = Math.max(...products.map((product) => product.qty), 1);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card">
      <div className="text-sm font-medium mb-4">Top products</div>
      <ul className="space-y-3.5">
        {products.map((p, i) => (
          <li key={p.name}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="truncate">{p.name}</span>
              <span className="text-muted-foreground">{p.qty} sold</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div initial={{ width: 0 }} whileInView={{ width: `${(p.qty / maxSold) * 100}%` }} viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-primary-gradient shadow-glow" />
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function InventoryStatus({ products }: { products: Array<{ stock: number; lowStockThreshold?: number }> }) {
  const inStock = products.filter((product) => product.stock > (product.lowStockThreshold ?? 0)).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 0)).length;
  const outOfStock = products.filter((product) => product.stock <= 0).length;
  const total = products.length;
  const percent = (count: number) => total ? Math.round((count / total) * 100) : 0;
  const items = [
    { label: "In stock", count: inStock, pct: percent(inStock), tint: "text-emerald-300", bar: "bg-emerald-400" },
    { label: "Low stock", count: lowStock, pct: percent(lowStock), tint: "text-amber-300", bar: "bg-amber-400" },
    { label: "Out of stock", count: outOfStock, pct: percent(outOfStock), tint: "text-rose-300", bar: "bg-rose-400" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">Inventory status</div>
        <span className="text-[11px] text-muted-foreground">{total} total</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden mb-4">
        {items.map(i => (
          <motion.div key={i.label} initial={{ width: 0 }} whileInView={{ width: `${i.pct}%` }} viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className={i.bar} />
        ))}
      </div>
      <ul className="space-y-2.5">
        {items.map(i => (
          <li key={i.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2"><span className={cn("h-2 w-2 rounded-full", i.bar)} /> {i.label}</span>
            <span className={i.tint}>{i.count}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function QuickActions() {
  const actions = [
    { icon: Plus, label: "Add product" },
    { icon: Users, label: "Invite team" },
    { icon: ShoppingCart, label: "New order" },
    { icon: Sparkles, label: "AI campaign" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card">
      <div className="text-sm font-medium mb-4">Quick actions</div>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a, i) => (
          <motion.button key={a.label}
            whileHover={{ y: -2 }}
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group flex flex-col items-start gap-2 rounded-xl p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-glow transition-all">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient/20 group-hover:bg-primary-gradient transition-colors">
              <a.icon className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
            </span>
            <span className="text-xs font-medium">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

function ActivityFeed() {
  const items = [
    { icon: CheckCircle2, tone: "text-emerald-300", text: "Order #1042 was fulfilled", time: "2m ago" },
    { icon: Users,        tone: "text-cyan-300",   text: "New customer signup: Elena Rossi", time: "14m ago" },
    { icon: Truck,        tone: "text-violet-300", text: "Shipment #S-208 handed to carrier", time: "38m ago" },
    { icon: AlertCircle,  tone: "text-amber-300",  text: "Low stock: Nimbus Sneakers (5 left)", time: "1h ago" },
    { icon: Clock,        tone: "text-muted-foreground", text: "Draft order saved by Marcus", time: "2h ago" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl glass-strong p-5 md:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Latest activity
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span> Live
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((it, i) => (
          <motion.li key={i}
            initial={{ opacity: 0, x: -6 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <it.icon className={cn("h-3.5 w-3.5", it.tone)} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs">{it.text}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{it.time}</div>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function DashboardHome() {
  const now = new Date();
  const dateOnly = (date: Date) => date.toISOString().slice(0, 10);
  const from = new Date(now); from.setDate(from.getDate() - 365);
  const previousTo = new Date(from); previousTo.setDate(previousTo.getDate() - 1);
  const previousFrom = new Date(previousTo); previousFrom.setDate(previousFrom.getDate() - 365);
  const { data: analyticsData } = useAnalytics({ from: dateOnly(from), to: dateOnly(now), previousFrom: dateOnly(previousFrom), previousTo: dateOnly(previousTo) });
  const { data: ordersData = [] } = useOrders();
  const { data: inventoryData = [] } = useAllInventory();
  const analytics: AnalyticsData = analyticsData ?? {
    revenue: 0, previousRevenue: 0, revenueGrowth: 0, orders: 0, previousOrders: 0, ordersGrowth: 0,
    customers: 0, previousCustomers: 0, customersGrowth: 0, averageOrderValue: 0, dailyRevenue: [],
    channels: [], topProducts: [], invoiceCount: 0, orderCount: 0, refundAmount: 0, returnedOrders: 0,
    newCustomers: 0, returningCustomers: 0, totalCustomers: 0, repeatPurchaseRate: 0,
    orderStatusCounts: {}, payment: { available: false, paid: 0, unpaid: 0, methods: [] }, trafficAttributionAvailable: false,
  };
  const monthlyRevenue = [...analytics.dailyRevenue.reduce((months, point) => {
    const month = point.date.slice(0, 7);
    months.set(month, (months.get(month) ?? 0) + point.value);
    return months;
  }, new Map<string, number>())].slice(-12);
  const stats = useLiveStats(analytics, inventoryData.length);
  const site = useSiteStore();
  const dataStats = useStoreStats();
  const activeTemplate = site.templateId ? getTemplate(site.templateId) : null;
  const publishTone =
    site.publishStatus === "published" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
    site.publishStatus === "draft" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
    "bg-white/5 text-muted-foreground border-white/10";
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
          <h1 className="mt-1 font-display text-2xl md:text-3xl font-semibold tracking-tight">
            {site.storeName || "Welcome back"} <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTemplate ? <>Active template: <span className="text-foreground">{activeTemplate.name}</span> · </> : null}
            Website status: <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 border text-[10px] font-medium uppercase tracking-wider", publishTone)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />{site.publishStatus}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium transition-colors">
            <Activity className="h-3.5 w-3.5" /> {dataStats.totalVisitors} visitors
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow hover:-translate-y-0.5 transition-all">
            <Plus className="h-3.5 w-3.5" /> Create
          </button>
        </div>
      </motion.div>

      <WebsiteOverviewCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s, i) => <StatCard key={s.label} s={s} i={i} />)}
      </div>

      <CartWishlistOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SalesChart data={monthlyRevenue.map(([, value]) => value)} labels={monthlyRevenue.map(([month]) => month)} />
        <AIInsights />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentOrders orders={ordersData.slice(0, 5)} />
        <TopProducts products={analytics.topProducts.slice(0, 5)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InventoryStatus products={inventoryData} />
        <QuickActions />
        <ActivityFeed />
      </div>
    </div>
  );
}

function WebsiteOverviewCard() {
  const site = useSiteStore();
  const tpl = site.templateId ? getTemplate(site.templateId) : null;
  const totalSections = site.pages.reduce((n, p) => n + p.sections.length, 0);
  const slug = site.storeSlug || site.templateId || "my-site";
  const url = `/site/${slug}`;
  const isPublished = site.publishStatus === "published";
  const fmt = (t: number | null) => t ? new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  const toneMap: Record<string, string> = {
    published:   "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    publishing:  "bg-blue-500/15 text-blue-300 border-blue-500/30",
    draft:       "bg-amber-500/15 text-amber-300 border-amber-500/30",
    unpublished: "bg-white/5 text-muted-foreground border-white/10",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-xl bg-primary-gradient shadow-glow grid place-items-center">
            <Rocket className="h-4 w-4 text-primary-foreground" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-display text-base font-semibold">{site.storeName || "Your website"}</div>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 border text-[10px] font-medium uppercase tracking-wider", toneMap[site.publishStatus] ?? toneMap.unpublished)}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />{site.publishStatus}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isPublished ? <>Live at <a href={url} target="_blank" rel="noreferrer" className="text-foreground underline">{url}</a></> : <>Not published yet · Publish to make it live at <span className="text-foreground">{url}</span></>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <a href={url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> Visit site
            </a>
          )}
          {isPublished ? (
            <button onClick={() => site.unpublish()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
              Unpublish
            </button>
          ) : null}
          <a href="/builder"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
            <Rocket className="h-3.5 w-3.5" /> {isPublished ? "Republish" : "Publish website"}
          </a>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        <OverviewTile icon={Sparkles} label="Template" value={tpl?.name ?? "None"} />
        <OverviewTile icon={Palette}  label="Theme"    value={<span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: site.accent }} /> {site.themeColorId}</span>} />
        <OverviewTile icon={FileText} label="Pages"    value={site.pages.length} />
        <OverviewTile icon={Layers}   label="Sections" value={totalSections} />
        <OverviewTile icon={Globe}    label="Last published" value={fmt(site.publishedAt)} />
      </div>
    </motion.div>
  );
}

function OverviewTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-sm font-semibold truncate">{value}</div>
    </div>
  );
}

function CartWishlistOverview() {
  const s = useStoreStats();
  const cards: { label: string; value: React.ReactNode; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
    { label: "Active carts", value: s.activeCarts, icon: ShoppingCart, tone: "text-emerald-300" },
    { label: "Abandoned carts", value: s.abandonedCarts, icon: Clock, tone: "text-amber-300" },
    { label: "Cart items", value: s.cartCount, icon: Bookmark, tone: "text-blue-300" },
    { label: "Wishlist items", value: s.wishlistCount, icon: Heart, tone: "text-pink-300" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <c.icon className={cn("h-3.5 w-3.5", c.tone)} /> {c.label}
            </div>
            <div className="mt-2 font-display text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RankedList title="Most added to cart" empty="No products added yet" items={s.mostAdded} accent="text-emerald-300" />
        <RankedList title="Top wishlisted" empty="No wishlist activity yet" items={s.topWishlisted} accent="text-pink-300" />
      </div>
    </div>
  );
}

function RankedList({ title, items, empty, accent }: { title: string; items: { productId: string; name: string; count: number; image?: string }[]; empty: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={it.productId} className="flex items-center gap-3">
              <span className={cn("w-5 text-xs font-mono", accent)}>#{i + 1}</span>
              <div className="h-8 w-8 rounded-lg overflow-hidden bg-white/5 shrink-0">
                {it.image ? <img src={it.image} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1 min-w-0 text-sm truncate">{it.name}</div>
              <div className={cn("text-xs font-semibold", accent)}>{it.count}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
