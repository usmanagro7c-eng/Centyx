import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText, Plus, Search, SlidersHorizontal, Download, Printer, RefreshCw,
  Upload, FileSpreadsheet, FileDown, MoreHorizontal, Eye, Pencil, Copy, Trash2,
  X, Check, Wallet, TrendingUp, Clock, CircleDollarSign, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingLayer } from "@/components/ui/floating-menu";
import {
  usePurchaseOrders,
  computeTotals,
  type PurchaseOrder,
  type PurchaseOrderLine,
  type PaymentEntry,
  type PaymentStatus,
} from "@/lib/purchase-orders-store";

import { PurchaseOrderStatus } from "@/lib/store-data-store";

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "JPY", "CAD"];
const WAREHOUSES = ["Main Warehouse", "West DC", "East DC", "Overflow"];
const SUPPLIERS = [
  "Nordic Textiles AB", "Kyoto Ceramics Co.", "Andes Coffee Traders",
  "Halo Packaging Ltd", "Prime Electronics", "Field & Forge Metals",
];

function fmt(n: number, ccy = "PKR") {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n); }
  catch { return `${ccy} ${n.toFixed(2)}`; }
}

function parseFrappeDate(value?: string) {
  if (!value) return undefined;
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const dmyMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function fmtDate(value?: string) {
  const date = parseFrappeDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

/* toasts */
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
let tId = 0;
const listeners = new Set<(t: Toast) => void>();
function toast(kind: Toast["kind"], text: string) {
  const t = { id: ++tId, kind, text };
  listeners.forEach((l) => l(t));
}
function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useMemo(() => {
    const l = (t: Toast) => {
      setItems((p) => [...p, t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), 3000);
    };
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex items-center gap-2 rounded-xl glass-strong border border-white/10 px-4 py-2.5 text-xs shadow-glow">
            {t.kind === "success" && <Check className="h-3.5 w-3.5 text-emerald-300" />}
            {t.kind === "error" && <X className="h-3.5 w-3.5 text-rose-300" />}
            {t.kind === "info" && <FileText className="h-3.5 w-3.5 text-primary" />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  const tone: Record<string, string> = {
    Paid: "bg-emerald-500/12 text-emerald-300 border-emerald-400/20",
    "Partially Paid": "bg-amber-500/12 text-amber-200 border-amber-400/20",
    Pending: "bg-white/[0.06] text-muted-foreground border-white/10",
    Received: "bg-cyan-500/12 text-cyan-200 border-cyan-400/20",
    Draft: "bg-white/[0.06] text-muted-foreground border-white/10",
    Overdue: "bg-rose-500/12 text-rose-300 border-rose-400/20",
    Cancelled: "bg-white/[0.05] text-muted-foreground border-white/10",
  };
  return (
    <span className={cn("inline-flex items-center h-6 px-2 rounded-full border text-[11px] font-medium", tone[label] ?? tone.Pending)}>
      {label}
    </span>
  );
}

/* ============ Page ============ */
export function PurchaseOrdersPage() {
  const invoices = usePurchaseOrders((s) => s.orders);
  const fetchOrders = usePurchaseOrders((s) => s.fetchOrders);
  const remove = usePurchaseOrders((s) => s.remove);
  const duplicate = usePurchaseOrders((s) => s.duplicate);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders().catch((err) => console.error("Failed to load Purchase Orders on mount:", err));
  }, [fetchOrders]);

  const [query, setQuery] = useState("");
  const [supplier, setSupplier] = useState("All");
  const [invStatus, setInvStatus] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const enriched = useMemo(() => invoices.map((i) => {
    const t = computeTotals(i);
    return { ...i, ...t };
  }), [invoices]);

  const filtered = useMemo(() => enriched.filter((i) => {
    if (query && !`${i.number} ${i.supplier}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (supplier !== "All" && i.supplier !== supplier) return false;
    if (invStatus !== "All" && i.rawStatus !== invStatus) return false;
    const orderDate = parseFrappeDate(i.orderDate);
    if (dateFrom && orderDate && orderDate.getTime() < new Date(dateFrom).getTime()) return false;
    if (dateTo && orderDate && orderDate.getTime() > new Date(dateTo).getTime()) return false;
    const total = i.grandTotal ?? i.grand;
    if (amountMin && total < Number(amountMin)) return false;
    if (amountMax && total > Number(amountMax)) return false;
    return true;
  }), [enriched, query, supplier, invStatus, dateFrom, dateTo, amountMin, amountMax]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const pending = enriched.filter((i) => i.paymentStatus !== "Paid").length;
    const paid = enriched.filter((i) => i.paymentStatus === "Paid").length;
    const totalAmt = enriched.reduce((s, i) => s + (i.grandTotal ?? i.grand), 0);
    const thisMonth = enriched.filter((i) => {
      const orderDate = parseFrappeDate(i.orderDate);
      if (!orderDate) return false;
      const now = new Date();
      return orderDate.getFullYear() === now.getFullYear() && orderDate.getMonth() === now.getMonth();
    }).reduce((s, i) => s + (i.grandTotal ?? i.grand), 0);
    const outstanding = enriched.reduce((s, i) => s + i.balance, 0);
    return { total, pending, paid, totalAmt, thisMonth, outstanding };
  }, [enriched]);

  function handleExportCSV() {
    const headers = ["Invoice", "Supplier", "Date", "Due", "Total", "Paid", "Balance", "Status"];
    const rows = filtered.map((i) => {
      const total = i.grandTotal ?? i.grand;
      return [
        i.number, i.supplier, i.orderDate, i.scheduleDate,
        total.toFixed(2), i.paid.toFixed(2), i.balance.toFixed(2),
        i.rawStatus,
      ];
    });
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `purchase-orders-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast("success", "Exported to Excel (CSV)");
  }

  function handleExportPDF() {
    const win = window.open("", "_blank");
    if (!win) { toast("error", "Popup blocked"); return; }
    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    const rows = filtered.map((i) => {
      const total = i.grandTotal ?? i.grand;
      return `
      <tr>
        <td>${escapeHtml(i.number)}</td><td>${escapeHtml(i.supplier)}</td><td>${fmtDate(i.orderDate)}</td><td>${fmtDate(i.scheduleDate)}</td>
        <td style="text-align:right">${fmt(total, i.currency)}</td>
        <td style="text-align:right">${fmt(i.paid, i.currency)}</td>
        <td style="text-align:right">${fmt(i.balance, i.currency)}</td>
        <td>${escapeHtml(i.rawStatus)}</td>
      </tr>`;
    }).join("");
    win.document.write(`<html><head><title>Purchase Orders</title>
      <style>body{font-family:ui-sans-serif,system-ui;padding:24px;color:#111}
      h1{font-size:20px;margin:0 0 12px} table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left}
      th{background:#f8fafc}</style></head>
      <body><h1>Purchase Orders</h1>
      <table><thead><tr><th>Invoice</th><th>Supplier</th><th>Date</th><th>Due</th>
      <th style="text-align:right">Total</th><th style="text-align:right">Paid</th>
      <th style="text-align:right">Balance</th><th>Payment</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    toast("success", "PDF export opened in new window");
  }

  function handlePrint() { handleExportPDF(); }

  function handleImport(files: FileList | null) {
    if (!files || !files.length) return;
    toast("success", `Imported ${files.length} file — parsing queued`);
  }

  // function handleRefresh() { toast("info", "Data refreshed"); }

  async function handleRefresh() {
  try {
    await fetchOrders();
    toast("success", "Purchase Orders refreshed");
  } catch {
    toast("error", "Failed to refresh Purchase Orders");
  }
}

  function handleDelete(id: string, num: string) {
    if (!confirm(`Delete invoice ${num}?`)) return;
    remove(id);
    toast("success", `Invoice ${num} deleted`);
  }

  function handleDuplicate(id: string) {
    const copy = duplicate(id);
    if (copy) { toast("success", `Duplicated as ${copy.number}`); }
  }

  return (
    <div className="space-y-6">
      <ToastHost />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" /> Commerce · Purchase Orders
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-1">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage supplier purchase invoices, inventory purchases, and payment records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow hover:scale-[1.02] transition">
            <Plus className="h-3.5 w-3.5" /> Create Purchase Order
          </button>
          <button onClick={() => importRef.current?.click()}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <input ref={importRef} type="file" multiple hidden onChange={(e) => handleImport(e.target.files)} />
          <button onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </button>
          <button onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
          </button>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition">
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 h-9 w-9 justify-center rounded-xl glass hover:bg-white/10 text-xs transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Purchase Orders", value: String(stats.total), icon: FileText, tint: "from-violet-500/20 to-fuchsia-500/5" },
          { label: "Pending Payments", value: String(stats.pending), icon: Clock, tint: "from-amber-500/20 to-orange-500/5" },
          { label: "Paid Orders", value: String(stats.paid), icon: Check, tint: "from-emerald-500/20 to-teal-500/5" },
          { label: "Total Purchase", value: fmt(stats.totalAmt), icon: CircleDollarSign, tint: "from-cyan-500/20 to-sky-500/5" },
          { label: "This Month", value: fmt(stats.thisMonth), icon: TrendingUp, tint: "from-fuchsia-500/20 to-pink-500/5" },
          { label: "Outstanding", value: fmt(stats.outstanding), icon: Wallet, tint: "from-rose-500/20 to-orange-500/5" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}
            className="relative overflow-hidden rounded-2xl glass-strong border border-white/[0.08] p-4">
            <div className={cn("pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl bg-gradient-to-br", s.tint)} />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{s.label}</div>
                <div className="mt-1.5 font-display text-xl font-semibold">{s.value}</div>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <s.icon className="h-4 w-4 text-primary" />
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-2xl glass-strong border border-white/[0.08] p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoice # or supplier"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition" />
        </div>
        <select value={supplier} onChange={(e) => setSupplier(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none">
          <option key="all-suppliers">All</option>
          {SUPPLIERS.map((s, idx) => <option key={`supplier-${idx}`}>{s}</option>)}
        </select>
        <select value={invStatus} onChange={(e) => setInvStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none">
          {['All', ...Array.from(new Set(invoices.map((i) => i.rawStatus))).sort()].map((s, idx) => <option key={`status-${idx}`}>{s}</option>)}
        </select>
        <button onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl glass hover:bg-white/10 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" /> More filters
        </button>
        <button onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl glass hover:bg-white/10 text-xs">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl glass-strong border border-white/[0.08] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FieldDate label="Date from" value={dateFrom} onChange={setDateFrom} />
              <FieldDate label="Date to" value={dateTo} onChange={setDateTo} />
              <FieldNum label="Amount min" value={amountMin} onChange={setAmountMin} />
              <FieldNum label="Amount max" value={amountMax} onChange={setAmountMax} />
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button onClick={() => { setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax(""); }}
                  className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Clear</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3 font-medium">PO #</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((i, idx) => (
                  <motion.tr key={i.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.015 }}
                    className="border-t border-white/[0.05] hover:bg-white/[0.03] transition group">
                    <td className="px-4 py-3">
                      <Link to="/dashboard/purchase-orders/$id" params={{ id: i.id }}
                        className="font-medium text-foreground hover:text-primary transition">
                        {i.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{i.supplier}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.orderDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.scheduleDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(i.grandTotal ?? i.grand, i.currency)}</td>
                    <td className="px-4 py-3 text-right text-emerald-300">{fmt(i.paid, i.currency)}</td>
                    <td className="px-4 py-3 text-right text-amber-200">{fmt(i.balance, i.currency)}</td>
                    <td className="px-4 py-3"><StatusPill label={i.rawStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <InvoiceRowMenu
                        open={menuFor === i.id}
                        onOpenChange={(v) => setMenuFor(v ? i.id : null)}
                        items={[
                          { icon: Eye, label: "View", fn: () => { setMenuFor(null); navigate({ to: "/dashboard/purchase-orders/$id", params: { id: i.id } }); } },
                          { icon: Pencil, label: "Edit", fn: () => { setMenuFor(null); navigate({ to: "/dashboard/purchase-orders/$id", params: { id: i.id } }); } },
                          { icon: Copy, label: "Duplicate", fn: () => { handleDuplicate(i.id); setMenuFor(null); } },
                          { icon: Printer, label: "Print", fn: () => { setMenuFor(null); handlePrint(); } },
                          { icon: FileDown, label: "Download PDF", fn: () => { setMenuFor(null); handleExportPDF(); } },
                          { icon: Trash2, label: "Delete", fn: () => { setMenuFor(null); handleDelete(i.id, i.number); }, danger: true },
                        ]}
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No invoices match your filters.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={(n) => toast("success", `Invoice ${n} created`)} />
    </div>
  );
}

type MenuItem = { icon: any; label: string; fn: () => void; danger?: boolean };
function InvoiceRowMenu({ open, onOpenChange, items }: { open: boolean; onOpenChange: (v: boolean) => void; items: MenuItem[] }) {
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={btnRef} onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <FloatingLayer open={open} onClose={() => onOpenChange(false)} anchorRef={btnRef} align="end" className="w-44 p-1 text-left">
        {items.map((m) => (
          <button key={m.label} onClick={m.fn}
            className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-white/5 transition",
              m.danger && "text-rose-300 hover:bg-rose-500/10")}> 
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </FloatingLayer>
    </>
  );
}

function FieldDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">{label}</span>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40" />
      </div>
    </label>
  );
}
function FieldNum({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00"
        className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40" />
    </label>
  );
}

function CreateInvoiceModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (num: string) => void }) {
  const add = usePurchaseOrders((s) => s.add);
  const [form, setForm] = useState(() => defaultForm());
  const [lines, setLines] = useState<PurchaseOrderLine[]>(() => [emptyLine()]);
  const [payMethod, setPayMethod] = useState<"Cash" | "Bank" | "Card" | "Online Transfer">("Bank");
  const [payStatus, setPayStatus] = useState<PaymentStatus>("Pending");
  const [payAmount, setPayAmount] = useState<string>("");

  function defaultForm() {
    const today = new Date().toISOString().slice(0, 10);
    const schedule = new Date(
      Date.now() + 21 * 86400000
    ).toISOString().slice(0, 10);

    return {
      supplier: SUPPLIERS[0],
      number: `PO-${Math.floor(Math.random() * 90000 + 10000)}`,
      orderDate: today,
      scheduleDate: schedule,
      warehouse: WAREHOUSES[0],
      currency: "PKR",
      taxRate: 5,
      notes: "",
    };
  }

  function emptyLine(): PurchaseOrderLine {
    return { id: Math.random().toString(36).slice(2, 8), product: "", sku: "", qty: 1, unit: "pc", cost: 0, tax: 5, discount: 0 };
  }

  const totals = computeTotals({ lines, payments: payAmount ? [{ id: "x", amount: Number(payAmount) || 0, date: form.orderDate, method: payMethod }] : [] });

  function submit() {
    if (!form.supplier || !form.number) {
      toast("error", "Supplier and order number are required");
      return;
    }

    if (lines.length === 0 || !lines.some((l) => l.product)) {
      toast("error", "Add at least one product");
      return;
    }

    const payments =
      payAmount && Number(payAmount) > 0
        ? [
            {
              id: Math.random().toString(36).slice(2, 8),
              date: form.orderDate,
              amount: Number(payAmount),
              method: payMethod,
            },
          ]
        : [];

    const finalPayStatus: PaymentStatus =
      payments.length && payments[0].amount >= totals.grand
        ? "Paid"
        : payments.length
          ? "Partially Paid"
          : payStatus as PaymentStatus;

    onClose();
    setForm(defaultForm());
    setLines([emptyLine()]);
    setPayAmount("");
  }

  function update(idx: number, patch: Partial<PurchaseOrderLine>) {
    setLines((ls) => ls.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-xl" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.98 }}
            className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-3 md:p-6 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl glass-strong border border-white/10 shadow-glow flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">New</div>
                  <div className="font-display text-lg font-semibold">Create Purchase Order</div>
                </div>
                <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Field label="Supplier">
                    <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={selectCls}>
                      {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Invoice Number">
                    <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Order Date">
                    <input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Due Date">
                    <input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Warehouse">
                    <select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} className={selectCls}>
                      {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Currency">
                    <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={selectCls}>
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Default Tax %">
                    <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label="Notes">
                    <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal note" className={inputCls} />
                  </Field>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="text-sm font-medium">Products</div>
                    <button onClick={() => setLines([...lines, emptyLine()])}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add row
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                      <thead className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                        <tr>
                          {["Product", "SKU", "Qty", "Unit", "Cost", "Tax %", "Disc %", "Total", ""].map((h) => (
                            <th key={h} className="px-3 py-2 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.map((l, idx) => {
                          const line = l.qty * l.cost;
                          const total = (line - line * (l.discount / 100)) * (1 + l.tax / 100);
                          return (
                            <tr key={l.id} className="border-t border-white/[0.05]">
                              <td className="px-2 py-2"><input value={l.product} onChange={(e) => update(idx, { product: e.target.value })} placeholder="Product name" className={rowInput} /></td>
                              <td className="px-2 py-2"><input value={l.sku} onChange={(e) => update(idx, { sku: e.target.value })} placeholder="SKU" className={rowInput} /></td>
                              <td className="px-2 py-2"><input type="number" value={l.qty} onChange={(e) => update(idx, { qty: Number(e.target.value) })} className={rowInput} /></td>
                              <td className="px-2 py-2"><input value={l.unit} onChange={(e) => update(idx, { unit: e.target.value })} className={rowInput} /></td>
                              <td className="px-2 py-2"><input type="number" value={l.cost} onChange={(e) => update(idx, { cost: Number(e.target.value) })} className={rowInput} /></td>
                              <td className="px-2 py-2"><input type="number" value={l.tax} onChange={(e) => update(idx, { tax: Number(e.target.value) })} className={rowInput} /></td>
                              <td className="px-2 py-2"><input type="number" value={l.discount} onChange={(e) => update(idx, { discount: Number(e.target.value) })} className={rowInput} /></td>
                              <td className="px-2 py-2 text-right font-medium">{fmt(total, form.currency)}</td>
                              <td className="px-2 py-2 text-right whitespace-nowrap">
                                <button onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-500/10 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setLines([...lines.slice(0, idx + 1), { ...l, id: Math.random().toString(36).slice(2, 8) }, ...lines.slice(idx + 1)])}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10"><Copy className="h-3.5 w-3.5" /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/[0.08] p-4 space-y-3">
                    <div className="text-sm font-medium mb-1">Payment</div>
                    <Field label="Payment Method">
                      <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)} className={selectCls}>
                        {["Cash", "Bank", "Card", "Online Transfer"].map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </Field>
                    <Field label="Payment Status">
                      <select value={payStatus} onChange={(e) => setPayStatus(e.target.value as PaymentStatus)} className={selectCls}>
                        {["Paid", "Partially Paid", "Pending"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Paid amount (this invoice)">
                      <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" className={inputCls} />
                    </Field>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] p-4 bg-white/[0.02]">
                    <div className="text-sm font-medium mb-2">Summary</div>
                    <SummaryRow label="Subtotal" value={fmt(totals.subtotal, form.currency)} />
                    <SummaryRow label="Discount" value={"− " + fmt(totals.discount, form.currency)} />
                    <SummaryRow label="Tax" value={fmt(totals.tax, form.currency)} />
                    <div className="border-t border-white/[0.06] my-2" />
                    <SummaryRow label="Grand Total" value={fmt(totals.grand, form.currency)} bold />
                    <SummaryRow label="Paid" value={fmt(totals.paid, form.currency)} />
                    <SummaryRow label="Balance" value={fmt(totals.balance, form.currency)} accent />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={onClose} className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
                <button onClick={submit}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                  <Check className="h-3.5 w-3.5" /> Create Invoice
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition";
const selectCls = inputCls;
const rowInput = "w-full h-9 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between py-1 text-sm", bold && "font-semibold", accent && "text-amber-200")}>
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export type { PurchaseOrder };
