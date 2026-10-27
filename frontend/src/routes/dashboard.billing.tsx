import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard, Download, Plus, Sparkles, Check, Search, ArrowUpDown,
  Printer, X, Receipt, Wallet, TrendingUp, ChevronLeft, ChevronRight,
  Settings2, Trash2, Pencil, Star, Filter, ChevronDown, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Breadcrumb, Header, GlassCard } from "@/components/dashboard/glass-form";
import {
  useBillingStore, formatMoney, formatDate, brandLabel,
  type Invoice, type PaymentBrand, type PaymentMethod,
} from "@/lib/billing-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/billing")({
  head: () => ({ meta: [{ title: "Billing — Aether" }] }),
  component: BillingPage,
});

/* -------------------------------------------------------------------------- */
/*  Small primitives                                                          */
/* -------------------------------------------------------------------------- */

const GhostBtn = ({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={cn("inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg glass hover:bg-white/10 text-xs font-medium transition-colors", className)} />
);
const PrimaryBtn = ({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} {...(p as any)}
    className={cn("inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow hover:shadow-[0_0_50px_-10px_var(--glow)] transition-all", className)} />
);

const StatusPill = ({ status }: { status: string }) => {
  const s = status.toLowerCase();
  const cls =
    s === "paid" || s === "succeeded" || s === "active"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : s === "unpaid" || s === "pending" || s === "past_due"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
      : s === "refunded"
      ? "bg-sky-500/15 text-sky-300 border-sky-500/20"
      : s === "failed" || s === "canceled" || s === "void"
      ? "bg-rose-500/15 text-rose-300 border-rose-500/20"
      : "bg-white/5 text-muted-foreground border-white/10";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium capitalize", cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace("_", " ")}
    </span>
  );
};

const BrandBadge = ({ brand }: { brand: PaymentBrand }) => {
  const map: Record<PaymentBrand, { text: string; g: string }> = {
    visa:       { text: "VISA",   g: "from-indigo-500 to-fuchsia-500" },
    mastercard: { text: "MC",     g: "from-orange-500 to-rose-500" },
    amex:       { text: "AMEX",   g: "from-sky-500 to-blue-600" },
    paypal:     { text: "PP",     g: "from-blue-500 to-indigo-600" },
    stripe:     { text: "STRIPE", g: "from-violet-500 to-purple-600" },
    bank:       { text: "BANK",   g: "from-slate-500 to-slate-700" },
  };
  const b = map[brand];
  return (
    <div className={cn("h-9 w-14 rounded-lg bg-gradient-to-br shadow-glow flex items-center justify-center text-[10px] font-bold text-white tracking-wider shrink-0", b.g)}>
      {b.text}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Section: Upcoming bill                                                    */
/* -------------------------------------------------------------------------- */

function UpcomingBillCard({ onView }: { onView: () => void }) {
  const { upcoming, plan } = useBillingStore();
  const daysUntil = Math.max(0, Math.ceil((new Date(upcoming.nextBillingDate).getTime() - Date.now()) / 86400000));
  const thresholdPct = Math.min(100, ((upcoming.billingThreshold - upcoming.remainingThreshold) / upcoming.billingThreshold) * 100);

  return (
    <GlassCard className="lg:col-span-2">
      <div className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40" style={{ background: "var(--glow)" }} />
        <div className="relative flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg glass"><Receipt className="h-4 w-4 text-primary" /></span>
              <div>
                <div className="text-sm font-medium">Upcoming bill</div>
                <div className="text-xs text-muted-foreground">Next bill in {daysUntil} days or when threshold is reached.</div>
              </div>
            </div>
            <StatusPill status={plan.status} />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-gradient">
                {formatMoney(upcoming.amount, upcoming.currency)}
              </span>
              <span className="text-sm text-muted-foreground">{upcoming.currency}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Estimated for {formatDate(upcoming.nextBillingDate)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {formatMoney(upcoming.remainingThreshold, upcoming.currency)} remaining until threshold
              </span>
              <span className="font-medium">{formatMoney(upcoming.billingThreshold, upcoming.currency)}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${thresholdPct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-primary-gradient shadow-glow" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {upcoming.availableDiscounts > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                <Sparkles className="h-3 w-3" /> {formatMoney(upcoming.availableDiscounts, upcoming.currency)} in discounts available
              </span>
            )}
            <div className="ml-auto flex gap-2">
              <PrimaryBtn onClick={onView}><FileText className="h-3.5 w-3.5" /> View breakdown</PrimaryBtn>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function BreakdownDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { upcoming } = useBillingStore();
  const total = upcoming.lines.reduce((s, l) => s + l.amount, 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upcoming bill breakdown</DialogTitle>
          <DialogDescription>Estimated for {formatDate(upcoming.nextBillingDate)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {upcoming.lines.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-2 text-sm border-b border-white/5 last:border-0">
              <span className={l.amount < 0 ? "text-emerald-300" : "text-muted-foreground"}>{l.label}</span>
              <span className="font-mono">{formatMoney(l.amount, upcoming.currency)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/10">
            <span className="text-sm font-semibold">Total</span>
            <span className="font-display text-lg font-semibold text-gradient">{formatMoney(total, upcoming.currency)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Payment method                                                    */
/* -------------------------------------------------------------------------- */

function PaymentMethodSection({ onAdd, onEdit }: { onAdd: () => void; onEdit: (pm: PaymentMethod) => void }) {
  const { paymentMethods, setDefaultPaymentMethod, removePaymentMethod } = useBillingStore();
  return (
    <GlassCard title="Payment methods" desc="Cards and payout methods used for subscription and invoices.">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {paymentMethods.map(pm => (
            <motion.div key={pm.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }}
              className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl glass border border-white/[0.08]"
            >
              <BrandBadge brand={pm.brand} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {brandLabel(pm.brand)}{pm.last4 ? ` •••• ${pm.last4}` : pm.email ? ` — ${pm.email}` : pm.bankName ? ` — ${pm.bankName}` : ""}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {pm.expMonth && pm.expYear
                    ? `Expires ${String(pm.expMonth).padStart(2, "0")} / ${pm.expYear}`
                    : pm.holder || "—"}
                </div>
              </div>
              {pm.isDefault && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">Default</span>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                {!pm.isDefault && (
                  <GhostBtn onClick={() => setDefaultPaymentMethod(pm.id)} title="Set as default"><Star className="h-3.5 w-3.5" /></GhostBtn>
                )}
                <GhostBtn onClick={() => onEdit(pm)}><Pencil className="h-3.5 w-3.5" /> Edit</GhostBtn>
                <GhostBtn onClick={() => removePaymentMethod(pm.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></GhostBtn>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={onAdd}
          className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl glass border border-dashed border-white/15 hover:border-white/30 hover:bg-white/5 text-xs font-medium transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add payment method
        </button>
      </div>
    </GlassCard>
  );
}

function PaymentMethodDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: PaymentMethod | null }) {
  const { addPaymentMethod, updatePaymentMethod } = useBillingStore();
  const [brand, setBrand] = useState<PaymentBrand>(editing?.brand ?? "visa");
  const [last4, setLast4] = useState(editing?.last4 ?? "");
  const [holder, setHolder] = useState(editing?.holder ?? "");
  const [expMonth, setExpMonth] = useState(editing?.expMonth?.toString() ?? "");
  const [expYear, setExpYear] = useState(editing?.expYear?.toString() ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [bankName, setBankName] = useState(editing?.bankName ?? "");

  const isCard = brand === "visa" || brand === "mastercard" || brand === "amex" || brand === "stripe";

  const submit = async () => {
    const payload: any = { brand, holder };
    if (isCard) { payload.last4 = last4.slice(-4); payload.expMonth = +expMonth; payload.expYear = +expYear; }
    if (brand === "paypal") payload.email = email;
    if (brand === "bank") payload.bankName = bankName;
    if (editing) await updatePaymentMethod(editing.id, payload);
    else await addPaymentMethod(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} payment method</DialogTitle>
          <DialogDescription>Securely stored via your payment processor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Provider</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value as PaymentBrand)}
              className="mt-1 w-full h-10 px-3 rounded-lg glass border border-white/10 bg-transparent text-sm">
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          {isCard && (
            <>
              <Field label="Cardholder"><input value={holder} onChange={e => setHolder(e.target.value)} className={inputCls} placeholder="Jane Cooper" /></Field>
              <Field label="Card number (last 4)"><input value={last4} maxLength={4} onChange={e => setLast4(e.target.value.replace(/\D/g, ""))} className={inputCls} placeholder="2554" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Exp. month"><input value={expMonth} onChange={e => setExpMonth(e.target.value)} className={inputCls} placeholder="08" /></Field>
                <Field label="Exp. year"><input value={expYear} onChange={e => setExpYear(e.target.value)} className={inputCls} placeholder="2028" /></Field>
              </div>
            </>
          )}
          {brand === "paypal" && (
            <Field label="PayPal email"><input value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@paypal.com" /></Field>
          )}
          {brand === "bank" && (
            <>
              <Field label="Account holder"><input value={holder} onChange={e => setHolder(e.target.value)} className={inputCls} /></Field>
              <Field label="Bank name"><input value={bankName} onChange={e => setBankName(e.target.value)} className={inputCls} /></Field>
            </>
          )}
        </div>
        <DialogFooter>
          <GhostBtn onClick={() => onOpenChange(false)}>Cancel</GhostBtn>
          <PrimaryBtn onClick={submit}>{editing ? "Save changes" : "Add method"}</PrimaryBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = "w-full h-10 px-3 rounded-lg glass border border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary/50";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className="text-xs text-muted-foreground">{label}</label><div className="mt-1">{children}</div></div>
);

/* -------------------------------------------------------------------------- */
/*  Section: Plan settings                                                     */
/* -------------------------------------------------------------------------- */

function PlanSection() {
  const { plan, changePlan, setBillingCycle, cancelSubscription } = useBillingStore();
  const price = plan.cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
  return (
    <GlassCard>
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusPill status={plan.status} />
            <span className="text-xs text-muted-foreground">Renews {formatDate(plan.renewalDate)}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{plan.name}</h2>
            <span className="text-sm text-muted-foreground">/ current plan</span>
          </div>
          <div className="mt-1 font-display text-2xl">
            <span className="text-gradient">{formatMoney(price)}</span>
            <span className="text-sm text-muted-foreground font-sans"> / {plan.cycle === "monthly" ? "month" : "year"}</span>
          </div>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {plan.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-400" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryBtn onClick={() => changePlan("scale")}><TrendingUp className="h-3.5 w-3.5" /> Upgrade</PrimaryBtn>
          <GhostBtn onClick={() => changePlan("starter")}>Downgrade</GhostBtn>
          <GhostBtn onClick={() => setBillingCycle(plan.cycle === "monthly" ? "yearly" : "monthly")}>
            Switch to {plan.cycle === "monthly" ? "yearly" : "monthly"}
          </GhostBtn>
          <GhostBtn onClick={cancelSubscription} className="text-muted-foreground hover:text-destructive">Cancel</GhostBtn>
        </div>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Section: Past bills / invoice table                                        */
/* -------------------------------------------------------------------------- */

type Tab = "all" | "paid" | "unpaid";
const PAGE = 5;

function PastBillsSection({ onView }: { onView: (inv: Invoice) => void }) {
  const { invoices } = useBillingStore();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    let list = invoices.slice();
    if (tab !== "all") list = list.filter(i => tab === "paid" ? i.status === "paid" : i.status !== "paid");
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(i => i.number.toLowerCase().includes(s) || i.reason.toLowerCase().includes(s));
    }
    list.sort((a, b) =>
      sortDir === "asc"
        ? +new Date(a.dateIssued) - +new Date(b.dateIssued)
        : +new Date(b.dateIssued) - +new Date(a.dateIssued));
    return list;
  }, [invoices, tab, q, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const paged = filtered.slice((page - 1) * PAGE, page * PAGE);
  const counts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === "paid").length,
    unpaid: invoices.filter(i => i.status !== "paid").length,
  };

  const downloadPdf = (inv: Invoice) => {
    const blob = new Blob(
      [`Invoice ${inv.number}\nDate: ${formatDate(inv.dateIssued)}\nAmount: ${formatMoney(inv.amount, inv.currency)}\nStatus: ${inv.status}\n`],
      { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${inv.number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard title="Past bills" desc="View, download, and manage historic invoices.">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex items-center gap-1 rounded-lg glass border border-white/10 p-1 w-fit">
          {(["all", "paid", "unpaid"] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={cn("h-8 px-3 rounded-md text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground")}>
              {t} <span className="ml-1 opacity-70">({counts[t]})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-0 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search invoice or reason"
            className="w-full h-9 pl-9 pr-3 rounded-lg glass border border-white/10 bg-transparent text-sm focus:outline-none focus:border-primary/50" />
        </div>
        <GhostBtn onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}>
          <ArrowUpDown className="h-3.5 w-3.5" /> Date {sortDir === "asc" ? "↑" : "↓"}
        </GhostBtn>
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3 font-medium">Invoice</th>
              <th className="py-2.5 px-3 font-medium">Date</th>
              <th className="py-2.5 px-3 font-medium">Reason</th>
              <th className="py-2.5 px-3 font-medium">Amount</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
              <th className="py-2.5 px-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {paged.map((inv, i) => (
              <motion.tr key={inv.id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-3 px-3">
                  <input type="checkbox" checked={!!selected[inv.id]}
                    onChange={e => setSelected(s => ({ ...s, [inv.id]: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded accent-primary" />
                </td>
                <td className="py-3 px-3 font-mono text-xs">{inv.number}</td>
                <td className="py-3 px-3 text-muted-foreground">{formatDate(inv.dateIssued)}</td>
                <td className="py-3 px-3 text-muted-foreground max-w-[240px] truncate">{inv.reason}</td>
                <td className="py-3 px-3 font-medium">{formatMoney(inv.amount, inv.currency)} <span className="text-[10px] text-muted-foreground">{inv.currency}</span></td>
                <td className="py-3 px-3"><StatusPill status={inv.status} /></td>
                <td className="py-3 px-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <GhostBtn onClick={() => downloadPdf(inv)}><Download className="h-3.5 w-3.5" /></GhostBtn>
                    <GhostBtn onClick={() => onView(inv)}>View</GhostBtn>
                  </div>
                </td>
              </motion.tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No invoices match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Card list (mobile) */}
      <div className="md:hidden space-y-2">
        {paged.map(inv => (
          <div key={inv.id} className="rounded-xl glass border border-white/[0.08] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-xs">{inv.number}</div>
                <div className="text-xs text-muted-foreground truncate">{inv.reason}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{formatDate(inv.dateIssued)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium">{formatMoney(inv.amount, inv.currency)}</div>
                <div className="mt-1"><StatusPill status={inv.status} /></div>
              </div>
            </div>
            <div className="mt-2 flex gap-1.5 justify-end">
              <GhostBtn onClick={() => downloadPdf(inv)}><Download className="h-3.5 w-3.5" /> PDF</GhostBtn>
              <GhostBtn onClick={() => onView(inv)}>View</GhostBtn>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} invoice{filtered.length === 1 ? "" : "s"}</span>
        <div className="flex items-center gap-1">
          <GhostBtn disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-3.5 w-3.5" /></GhostBtn>
          <span className="px-2">Page {page} / {totalPages}</span>
          <GhostBtn disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="h-3.5 w-3.5" /></GhostBtn>
        </div>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Invoice details overlay (full-screen)                                      */
/* -------------------------------------------------------------------------- */

function InvoiceDetailsOverlay({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { paymentMethods, settings, plan } = useBillingStore();
  const pm = invoice?.paymentMethodId ? paymentMethods.find(p => p.id === invoice.paymentMethodId) : undefined;
  return (
    <AnimatePresence>
      {invoice && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="mx-auto my-6 md:my-10 w-[min(920px,95vw)] rounded-2xl glass-strong border border-white/10 shadow-card p-6 md:p-8"
          >
            {/* Top bar */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</div>
                <h2 className="font-display text-2xl md:text-3xl font-semibold text-gradient">{invoice.number}</h2>
                <div className="mt-1"><StatusPill status={invoice.status} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostBtn onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print</GhostBtn>
                <PrimaryBtn onClick={() => {
                  const blob = new Blob([`Invoice ${invoice.number}`], { type: "application/pdf" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = `${invoice.number}.pdf`; a.click();
                  URL.revokeObjectURL(url);
                }}><Download className="h-3.5 w-3.5" /> Download PDF</PrimaryBtn>
                <GhostBtn onClick={onClose}><X className="h-3.5 w-3.5" /></GhostBtn>
              </div>
            </div>

            {/* Meta grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <MetaBlock label="Store / Company">
                {settings.companyName || "—"}
                <div className="text-xs text-muted-foreground mt-0.5">{settings.billingEmail}</div>
              </MetaBlock>
              <MetaBlock label="Billing address">
                {settings.address.line1 || "—"}
                {settings.address.line2 && <><br />{settings.address.line2}</>}
                <div className="text-xs text-muted-foreground mt-0.5">
                  {[settings.address.city, settings.address.state, settings.address.postalCode].filter(Boolean).join(", ")}
                  {settings.address.country ? ` · ${settings.address.country}` : ""}
                </div>
              </MetaBlock>
              <MetaBlock label="Payment method">
                {pm ? `${brandLabel(pm.brand)}${pm.last4 ? ` •••• ${pm.last4}` : ""}` : "—"}
              </MetaBlock>
              <MetaBlock label="Plan">{plan.name} · {plan.cycle}</MetaBlock>
              <MetaBlock label="Invoice date">{formatDate(invoice.dateIssued)}</MetaBlock>
              <MetaBlock label="Due date">{formatDate(invoice.dueDate)}</MetaBlock>
              {invoice.transactionId && <MetaBlock label="Transaction ID"><span className="font-mono text-xs">{invoice.transactionId}</span></MetaBlock>}
            </div>

            {/* Line items */}
            <div className="mt-6 rounded-xl glass border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground bg-white/[0.02]">
                    <th className="py-2.5 px-4 font-medium">Description</th>
                    <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invoice.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-3 px-4">{l.label}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatMoney(l.amount, invoice.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
              <Row label="Discount" value={`- ${formatMoney(invoice.discount, invoice.currency)}`} />
              <Row label="Tax" value={formatMoney(invoice.tax, invoice.currency)} />
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-display text-lg font-semibold text-gradient">{formatMoney(invoice.amount, invoice.currency)}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const MetaBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="rounded-lg glass border border-white/[0.06] p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="mt-1">{children}</div>
  </div>
);
const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><span className="font-mono">{value}</span></div>
);

/* -------------------------------------------------------------------------- */
/*  Payment history                                                            */
/* -------------------------------------------------------------------------- */

function PaymentHistorySection() {
  const { payments } = useBillingStore();
  return (
    <GlassCard title="Payment history" desc="Every transaction processed on your account.">
      <div className="hidden md:block overflow-x-auto -mx-1">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2.5 px-3 font-medium">Transaction ID</th>
              <th className="py-2.5 px-3 font-medium">Method</th>
              <th className="py-2.5 px-3 font-medium">Amount</th>
              <th className="py-2.5 px-3 font-medium">Date</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {payments.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-3 px-3 font-mono text-xs">{p.id}</td>
                <td className="py-3 px-3 capitalize">{brandLabel(p.method)}</td>
                <td className="py-3 px-3 font-medium">{formatMoney(p.amount, p.currency)} <span className="text-[10px] text-muted-foreground">{p.currency}</span></td>
                <td className="py-3 px-3 text-muted-foreground">{formatDate(p.date)}</td>
                <td className="py-3 px-3"><StatusPill status={p.status} /></td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {payments.map(p => (
          <div key={p.id} className="rounded-xl glass border border-white/[0.08] p-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-mono text-xs">{p.id}</div>
              <div className="text-xs text-muted-foreground">{brandLabel(p.method)} · {formatDate(p.date)}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-medium">{formatMoney(p.amount, p.currency)}</div>
              <div className="mt-1"><StatusPill status={p.status} /></div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Billing settings                                                           */
/* -------------------------------------------------------------------------- */

function BillingSettingsSection() {
  const { settings, updateSettings } = useBillingStore();
  const [local, setLocal] = useState(settings);
  const dirty = JSON.stringify(local) !== JSON.stringify(settings);

  return (
    <GlassCard title="Billing settings" desc="Company details used on every invoice.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Company name"><input value={local.companyName} onChange={e => setLocal({ ...local, companyName: e.target.value })} className={inputCls} /></Field>
        <Field label="Billing email"><input value={local.billingEmail} onChange={e => setLocal({ ...local, billingEmail: e.target.value })} className={inputCls} /></Field>
        <Field label="Default currency">
          <select value={local.defaultCurrency} onChange={e => setLocal({ ...local, defaultCurrency: e.target.value })} className={inputCls}>
            {["USD", "EUR", "GBP", "AED", "SAR", "JPY", "CAD", "AUD"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tax ID / VAT number"><input value={local.taxId} onChange={e => setLocal({ ...local, taxId: e.target.value })} className={inputCls} placeholder="e.g. GB123456789" /></Field>
        <Field label="Address line 1"><input value={local.address.line1} onChange={e => setLocal({ ...local, address: { ...local.address, line1: e.target.value } })} className={inputCls} /></Field>
        <Field label="Address line 2"><input value={local.address.line2 ?? ""} onChange={e => setLocal({ ...local, address: { ...local.address, line2: e.target.value } })} className={inputCls} /></Field>
        <Field label="City"><input value={local.address.city} onChange={e => setLocal({ ...local, address: { ...local.address, city: e.target.value } })} className={inputCls} /></Field>
        <Field label="State / Province"><input value={local.address.state} onChange={e => setLocal({ ...local, address: { ...local.address, state: e.target.value } })} className={inputCls} /></Field>
        <Field label="Postal code"><input value={local.address.postalCode} onChange={e => setLocal({ ...local, address: { ...local.address, postalCode: e.target.value } })} className={inputCls} /></Field>
        <Field label="Country"><input value={local.address.country} onChange={e => setLocal({ ...local, address: { ...local.address, country: e.target.value } })} className={inputCls} /></Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={local.emailNotifications}
          onChange={e => setLocal({ ...local, emailNotifications: e.target.checked })}
          className="h-4 w-4 rounded accent-primary" />
        Send invoice notifications by email
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <GhostBtn disabled={!dirty} onClick={() => setLocal(settings)}>Reset</GhostBtn>
        <PrimaryBtn disabled={!dirty} onClick={() => updateSettings(local)}><Check className="h-3.5 w-3.5" /> Save changes</PrimaryBtn>
      </div>
    </GlassCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

function BillingPage() {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [pmDialog, setPmDialog] = useState<{ open: boolean; editing: PaymentMethod | null }>({ open: false, editing: null });
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  return (
    <div className="space-y-6">
      <Breadcrumb label="Billing" />
      <Header icon={CreditCard} title="Billing" subtitle="Upcoming bill, payment methods, plan, invoices and settings." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UpcomingBillCard onView={() => setBreakdownOpen(true)} />
        <PlanSection />
      </div>

      <PaymentMethodSection
        onAdd={() => setPmDialog({ open: true, editing: null })}
        onEdit={(pm) => setPmDialog({ open: true, editing: pm })}
      />

      <PastBillsSection onView={setViewInvoice} />
      <PaymentHistorySection />
      <BillingSettingsSection />

      <BreakdownDialog open={breakdownOpen} onOpenChange={setBreakdownOpen} />
      <PaymentMethodDialog open={pmDialog.open} onOpenChange={(o) => setPmDialog(s => ({ ...s, open: o }))} editing={pmDialog.editing} />
      <InvoiceDetailsOverlay invoice={viewInvoice} onClose={() => setViewInvoice(null)} />
    </div>
  );
}
