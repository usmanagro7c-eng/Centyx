import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Printer, FileDown, Copy, Trash2, Pencil, Check, X, Plus,
  FileText, Building2, Mail, Phone, MapPin, Calendar, Wallet, Package,
  Clock, Paperclip, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePurchaseOrders, computeTotals,type PurchaseOrder, type PurchaseOrderLine, type PaymentEntry, type PaymentStatus,  } from "@/lib/purchase-orders-store";

export const Route = createFileRoute("/dashboard/purchase-orders/$id")({
  head: () => ({ meta: [{ title: "Purchase Order — Aether" }] }),
  component: InvoiceDetailPage,
});

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
    <span className={cn("inline-flex items-center h-6 px-2 rounded-full border text-[11px] font-medium", tone[label] ?? tone.Pending)}>{label}</span>
  );
}

function InvoiceDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const invoice = usePurchaseOrders((s) => s.orders.find((i) => i.id === id));
  const fetchOrderById = usePurchaseOrders((s) => s.fetchOrderById);
  const update = usePurchaseOrders((s) => s.update);
  const remove = usePurchaseOrders((s) => s.remove);
  const duplicate = usePurchaseOrders((s) => s.duplicate);
  const addPayment = usePurchaseOrders((s) => s.addPayment);

  useEffect(() => {
    if (id) {
      fetchOrderById(id).catch((err) => {
        console.error("Failed to load Purchase Order detail:", err);
      });
    }
  }, [fetchOrderById, id]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PurchaseOrder | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  const view = editing && draft ? draft : invoice;
  const totals = useMemo(() => view ? computeTotals(view) : null, [view]);
  const displayGrandTotal = view ? (view.grandTotal ?? totals?.grand ?? 0) : 0;
  const displayBalance = view ? Math.max(0, displayGrandTotal - (totals?.paid ?? 0)) : 0;
  const displayCurrency = view?.currency || "PKR";

  if (!invoice || !view || !totals) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Purchase order not found.</p>
          <Link to="/dashboard/purchase-orders" className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to purchase orders
          </Link>
        </div>
      </div>
    );
  }

  function beginEdit() { setDraft(JSON.parse(JSON.stringify(invoice))); setEditing(true); }
  function cancelEdit() { setEditing(false); setDraft(null); }
  function saveEdit() {
    if (!draft) return;
    update(draft.id, draft);
    setEditing(false); setDraft(null);
  }
  function handleDelete() {
    if (!confirm(`Delete invoice ${invoice!.number}?`)) return;
    remove(invoice!.id);
    navigate({ to: "/dashboard/purchase-orders" });
  }
  function handleDuplicate() {
    const copy = duplicate(invoice!.id);
    if (copy) navigate({ to: "/dashboard/purchase-orders/$id", params: { id: copy.id } });
  }
  function handlePrint() { window.print(); }

  function updateLine(idx: number, patch: Partial<PurchaseOrderLine>) {
    if (!draft) return;
    setDraft({ ...draft, lines: draft.lines.map((l, i) => i === idx ? { ...l, ...patch } : l) });
  }
  function addLine() {
    if (!draft) return;
    setDraft({ ...draft, lines: [...draft.lines, { id: Math.random().toString(36).slice(2, 8), product: "", sku: "", qty: 1, unit: "pc", cost: 0, tax: draft.taxRate, discount: 0 }] });
  }
  function removeLine(idx: number) {
    if (!draft) return;
    setDraft({ ...draft, lines: draft.lines.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/purchase-orders"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Purchase Order</div>
            <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight mt-0.5 flex items-center gap-3">
              {view.number}
              <StatusPill label={view.rawStatus ?? view.orderStatus} />
              <StatusPill label={view.paymentStatus} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {editing ? (
            <>
              <button onClick={cancelEdit} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button onClick={saveEdit} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                <Check className="h-3.5 w-3.5" /> Save changes
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setPayOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <Wallet className="h-3.5 w-3.5" /> Record payment
              </button>
              <button onClick={beginEdit} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button onClick={handleDuplicate} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button onClick={handlePrint} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <button onClick={handlePrint} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button onClick={handleDelete} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300 text-xs transition">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: invoice document */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl glass-strong border border-white/[0.08] p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">From</div>
                <div className="mt-1 flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-primary" /> {view.supplier}
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {view.supplierEmail && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {view.supplierEmail}</div>}
                  {view.supplierPhone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {view.supplierPhone}</div>}
                  {view.supplierAddress && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {view.supplierAddress}</div>}
                </div>
              </div>
              <div className="text-right md:text-right">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Purchase Order</div>
                <div className="mt-1 font-display text-lg font-semibold">{view.number}</div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex md:justify-end items-center gap-1.5"><Calendar className="h-3 w-3" /> Date: {fmtDate(view.orderDate)}</div>
                  <div className="flex md:justify-end items-center gap-1.5"><Clock className="h-3 w-3" /> Due: {fmtDate(view.scheduleDate)}</div>
                  <div className="flex md:justify-end items-center gap-1.5"><Package className="h-3 w-3" /> {view.warehouse}</div>
                </div>
              </div>
            </div>

            {/* Lines */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  <tr>
                    <th className="py-2 px-2 font-medium">Product</th>
                    <th className="py-2 px-2 font-medium">SKU</th>
                    <th className="py-2 px-2 font-medium text-right">Qty</th>
                    <th className="py-2 px-2 font-medium text-right">Cost</th>
                    <th className="py-2 px-2 font-medium text-right">Tax %</th>
                    <th className="py-2 px-2 font-medium text-right">Disc %</th>
                    <th className="py-2 px-2 font-medium text-right">Total</th>
                    {editing && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {view.lines.map((l, idx) => {
                    const line = l.qty * l.cost;
                    const total = (line - line * (l.discount / 100)) * (1 + l.tax / 100);
                    return (
                      <tr key={l.id} className="border-t border-white/[0.05]">
                        {editing ? (
                          <>
                            <td className="py-2 px-2"><input value={l.product} onChange={(e) => updateLine(idx, { product: e.target.value })} className={rowInput} /></td>
                            <td className="py-2 px-2"><input value={l.sku} onChange={(e) => updateLine(idx, { sku: e.target.value })} className={rowInput} /></td>
                            <td className="py-2 px-2 text-right"><input type="number" value={l.qty} onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })} className={cn(rowInput, "text-right")} /></td>
                            <td className="py-2 px-2 text-right"><input type="number" value={l.cost} onChange={(e) => updateLine(idx, { cost: Number(e.target.value) })} className={cn(rowInput, "text-right")} /></td>
                            <td className="py-2 px-2 text-right"><input type="number" value={l.tax} onChange={(e) => updateLine(idx, { tax: Number(e.target.value) })} className={cn(rowInput, "text-right")} /></td>
                            <td className="py-2 px-2 text-right"><input type="number" value={l.discount} onChange={(e) => updateLine(idx, { discount: Number(e.target.value) })} className={cn(rowInput, "text-right")} /></td>
                            <td className="py-2 px-2 text-right font-medium">{fmt(total, displayCurrency)}</td>
                            <td className="py-2 px-2 text-right">
                              <button onClick={() => removeLine(idx)} className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-500/10 text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-2">{l.product}</td>
                            <td className="py-3 px-2 text-muted-foreground">{l.sku}</td>
                            <td className="py-3 px-2 text-right">{l.qty} {l.unit}</td>
                            <td className="py-3 px-2 text-right">{fmt(l.cost, view.currency)}</td>
                            <td className="py-3 px-2 text-right">{l.tax}%</td>
                            <td className="py-3 px-2 text-right">{l.discount}%</td>
                            <td className="py-3 px-2 text-right font-medium">{fmt(total, view.currency)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {editing && (
                <button onClick={addLine} className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add row
                </button>
              )}
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-full md:w-80 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <SummaryRow label="Subtotal" value={fmt(totals.subtotal, displayCurrency)} />
                <SummaryRow label="Discount" value={"− " + fmt(totals.discount, displayCurrency)} />
                <SummaryRow label="Tax" value={fmt(totals.tax, displayCurrency)} />
                <div className="border-t border-white/[0.06] my-2" />
                <SummaryRow label="Grand Total" value={fmt(displayGrandTotal, displayCurrency)} bold />
                <SummaryRow label="Paid" value={fmt(totals.paid, displayCurrency)} />
                <SummaryRow label="Balance Due" value={fmt(displayBalance, displayCurrency)} accent />
              </div>
            </div>

            {view.notes && (
              <div className="mt-4 text-xs text-muted-foreground rounded-lg border border-white/[0.06] p-3 bg-white/[0.02]">
                <span className="text-[10px] uppercase tracking-[0.14em] mr-2">Notes</span>
                {view.notes}
              </div>
            )}
          </motion.div>

          {/* Payment history */}
          <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-base font-semibold">Payment History</div>
              <button onClick={() => setPayOpen(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">
                <Plus className="h-3.5 w-3.5" /> Record payment
              </button>
            </div>
            {view.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  <tr><th className="py-2">Date</th><th className="py-2">Method</th><th className="py-2">Note</th><th className="py-2 text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {view.payments.map((p) => (
                    <tr key={p.id} className="border-t border-white/[0.05]">
                      <td className="py-2.5">{p.date}</td>
                      <td className="py-2.5">{p.method}</td>
                      <td className="py-2.5 text-muted-foreground">{p.note ?? "—"}</td>
                      <td className="py-2.5 text-right font-medium text-emerald-300">{fmt(p.amount, displayCurrency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
            <div className="font-display text-base font-semibold mb-3">Summary</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetaCell label="Grand Total" value={fmt(displayGrandTotal, displayCurrency)} bold />
              <MetaCell label="Balance Due" value={fmt(displayBalance, displayCurrency)} accent />
              <MetaCell label="Payment" value={view.paymentStatus} />
              <MetaCell label="Status" value={view.rawStatus ?? view.orderStatus} />
              <MetaCell label="Currency" value={view.currency} />
              <MetaCell label="Warehouse" value={view.warehouse} />
            </div>
          </div>

          <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-base font-semibold">Attachments</div>
              <label className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Upload
                <input type="file" hidden onChange={(e) => {
                  const f = e.target.files?.[0]; if (!f) return;
                  update(invoice!.id, {
                    attachments: [...invoice!.attachments, { id: Math.random().toString(36).slice(2, 8), name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` }],
                  });
                }} />
              </label>
            </div>
            {view.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attachments.</p>
            ) : (
              <ul className="space-y-2">
                {view.attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] p-2 bg-white/[0.02] text-sm">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate flex-1">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
            <div className="font-display text-base font-semibold mb-3">Activity Timeline</div>
            <ol className="relative border-l border-white/[0.08] ml-2 space-y-4">
              {view.activity.map((ev) => (
                <li key={ev.id} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary shadow-glow" />
                  <div className="text-sm">{ev.text}</div>
                  <div className="text-[11px] text-muted-foreground">{ev.ts}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        open={payOpen} onClose={() => setPayOpen(false)}
        balance={totals.balance} currency={view.currency}
        onSubmit={(p) => { addPayment(invoice!.id, p); setPayOpen(false); }}
      />
    </div>
  );
}

function RecordPaymentModal({ open, onClose, balance, currency, onSubmit }: {
  open: boolean; onClose: () => void; balance: number; currency: string;
  onSubmit: (p: Omit<PaymentEntry, "id">) => void;
}) {
  const [amount, setAmount] = useState(balance.toFixed(2));
  const [method, setMethod] = useState<PaymentEntry["method"]>("Bank");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-xl" onClick={onClose} />
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl glass-strong border border-white/10 shadow-glow overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="font-display text-lg font-semibold">Record Payment</div>
                <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white/5"><X className="h-4 w-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-muted-foreground">Outstanding balance: <span className="text-amber-200 font-medium">{fmt(balance, currency)}</span></div>
                <Field label="Amount"><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></Field>
                <Field label="Method">
                  <select value={method} onChange={(e) => setMethod(e.target.value as any)} className={inputCls}>
                    {["Cash", "Bank", "Card", "Online Transfer"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
                <Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className={inputCls} /></Field>
              </div>
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={onClose} className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
                <button onClick={() => onSubmit({ amount: Number(amount) || 0, method, date, note })}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                  <Check className="h-3.5 w-3.5" /> Save payment
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition";
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
function MetaCell({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-2.5 bg-white/[0.02]">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{label}</div>
      <div className={cn("mt-1 text-sm", bold && "font-semibold", accent && "text-amber-200")}>{value}</div>
    </div>
  );
}

