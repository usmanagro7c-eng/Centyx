/* ============================================================
 * Orders Management — Shopify-level order lifecycle UI.
 *
 * Reuses the existing shared building blocks (PageHeader, StatsRow,
 * DataTable, Toolbar, Pagination, StatusPill, ToastHost, pushToast,
 * downloadCSV) exported from `src/routes/dashboard.$.tsx`. All data,
 * mutations and multi-tenant persistence come from the existing
 * `useStoreData` Zustand store — no duplicate models are introduced.
 * ============================================================ */
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart, ArrowLeft, Package, Truck, CreditCard, MapPin,
  Copy, Trash2, Ban, RotateCcw, Printer, Download, Check, Mail,
  StickyNote, ChevronRight, Search, X, Plus, MoreHorizontal,
  Clock, BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingLayer } from "@/components/ui/floating-menu";
import { findItem } from "@/components/dashboard/nav-config";
import { useOrders } from "@/hooks/useOrders";
import { approveSalesOrder, cancelSalesOrder, deliverSalesOrder, rejectSalesOrder, submitSalesOrder, updateSalesOrderStatus } from "@/api/orders";
import {
  canApproveOrder,
  canCancelOrder,
  canEditOrder,
  canRejectOrder,
  getSalesOrderWorkflowState,
} from "@/lib/order-workflow";
import {
  useAuthStore,
} from "@/lib/auth-store";
import {
  useStoreData,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type ShippingStatus,
} from "@/lib/store-data-store";
import {
  Breadcrumb, PageHeader, StatsRow, Toolbar, DataTable, Pagination,
  StatusPill, EmptyState, downloadCSV, pushToast, ToastHost,
  type Stat, type Column, type Row,
} from "@/routes/dashboard.$";

const money = (n: number) => `PKR ${(n ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (t?: number) => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const dtLong = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

/* Simulated "email sent" notification helper — architecture ready
 * for a real backend hookup later. */
function notifyEmail(kind: string, to: string) {
  pushToast("info", `${kind} email queued to ${to}`);
}

const STATUS_FILTERS_ALL = [
  "All", "Pending", "Confirmed", "Paid", "Processing", "Packed",
  "Shipped", "Out for delivery", "Delivered", "Cancelled", "Returned", "Refunded", "Failed",
] as const;

const STATUS_FILTERS_DRAFT = ["All"] as const;

const ALL_STATUSES: OrderStatus[] = [
  "Draft", "Pending", "Confirmed", "Paid", "Processing", "Packed",
  "Shipped", "Out for delivery", "Delivered", "Cancelled", "Returned", "Refunded", "Failed",
];
const perPage = 10;

const getValidERPNextSalesOrderStatus = (next: OrderStatus): string | null => {
  switch (next) {
    case "Confirmed": return "Submitted";
    case "Cancelled": return "Cancelled";
    case "Paid":
    case "Processing":
    case "Packed":
    case "Shipped":
    case "Out for delivery":
    case "Delivered":
    case "Refunded":
    case "Failed":
      return null;
    default: return null;
  }
};

// useEffect(() => {
//   async function loadOrders() {
//     try {
//       const data = await getOrders();
//       console.log(data);
//       setOrders(data);
//     } catch (err) {
//       console.error(err);
//     }
//   }

//   loadOrders();
// }, []);


/* ============================================================
 * Orders list page
 * ============================================================ */
export function OrdersManagementPage({ variant = "all" }: { variant?: "all" | "drafts" } = {}) {
  const isDrafts = variant === "drafts";
  const item = findItem(isDrafts ? "orders/drafts" : "orders")!;
  const STATUS_FILTERS = isDrafts ? STATUS_FILTERS_DRAFT : STATUS_FILTERS_ALL;
  const pageTitle = isDrafts ? "Draft Orders" : "Orders";
  const pageSubtitle = isDrafts
    ? "Manually created orders that haven't been placed yet — send invoices or convert to real orders."
    : "Every completed order placed through your storefront — live, multi-tenant, backend-ready.";
  const queryClient = useQueryClient();

  // Use the new hook to fetch orders from Frappe
  const { data: orders = [], isLoading, isError, refetch: refetchRemoteOrders } = useOrders(isDrafts ? "Draft" : undefined);

  const refreshOrderQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      queryClient.refetchQueries({ queryKey: ["orders"] }),
    ]);
  };

  // We still need the Zustand actions for mutations (duplicate, delete, bulk actions)
  const {
    duplicateOrder, removeOrder, removeManyOrders,
    bulkMarkOrdersPaid, bulkShipOrders, bulkCancelOrders,
    setOrderStatus,
  } = useStoreData.getState();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [payFilter, setPayFilter] = useState<"All" | PaymentStatus>("All");
  const [shipFilter, setShipFilter] = useState<"All" | ShippingStatus>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const q = query.trim().toLowerCase();
  const fromTs = from ? new Date(from).getTime() : -Infinity;
  const toTs = to ? new Date(to).getTime() + 86_400_000 : Infinity;

  const filtered = useMemo(() => orders.filter((o) => {
    // Hard classification: /orders/drafts shows ONLY drafts; /orders shows everything else.
    if (isDrafts) { if (o.status !== "Draft") return false; }
    else { if (o.status === "Draft") return false; }
    if (status !== "All" && o.status !== status) return false;
    if (payFilter !== "All" && o.paymentStatus !== payFilter) return false;
    if (shipFilter !== "All" && o.shippingStatus !== shipFilter) return false;
    if (o.createdAt < fromTs || o.createdAt > toTs) return false;
    if (!q) return true;
    const hay = [
      o.number, o.invoiceNumber, o.customerName, o.customerEmail,
      o.customerPhone ?? "", o.transactionId ?? "", o.trackingNumber ?? "",
      ...o.items.flatMap((i) => [i.name, i.sku ?? ""]),
    ].join(" ").toLowerCase();
    return hay.includes(q);
  }), [orders, isDrafts, status, payFilter, shipFilter, q, fromTs, toTs]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { if (page > pages) setPage(1); }, [pages, page]);

  const rows: Row[] = paged.map((o) => ({
    __id: o.id,
    id: o.number,
    invoice: o.invoiceNumber,
    customer: o.customerName || "Guest",
    email: o.customerEmail,
    items: o.itemsCount,
    total: money(o.total),
    status: o.status,
    payment: o.paymentStatus,
    date: dt(o.createdAt),
  }));

  const columns: Column[] = [
    { key: "id", label: "Order" },
    { key: "invoice", label: "Invoice" },
    { key: "customer", label: "Customer" },
    { key: "items", label: "Items" },
    { key: "total", label: "Total" },
    { key: "status", label: "Status" },
    { key: "payment", label: "Payment" },
    { key: "date", label: "Date", className: "text-right" },
  ];

  const base = orders.filter((o) => isDrafts ? o.status === "Draft" : o.status !== "Draft");
  const revenue = base.reduce((s, o) => s + (o.status !== "Refunded" && o.status !== "Cancelled" ? o.total : 0), 0);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayCount = base.filter((o) => o.createdAt >= startOfDay.getTime()).length;
  const stats: Stat[] = isDrafts ? [
    { label: "Total drafts", value: String(base.length) },
    { label: "Today", value: String(todayCount) },
    { label: "Draft value", value: money(revenue) },
    { label: "Avg. draft", value: money(base.length ? revenue / base.length : 0) },
  ] : [
    { label: "Total orders", value: String(base.length) },
    { label: "Today", value: String(todayCount) },
    { label: "Revenue", value: money(revenue) },
    { label: "Avg. order", value: money(base.length ? revenue / base.length : 0) },
  ];

  const toggleSel = (id: string, on?: boolean) =>
    setSelected((prev) => {
      const has = prev.includes(id);
      const next = on ?? !has;
      return next ? (has ? prev : [...prev, id]) : prev.filter((x) => x !== id);
    });
  const allChecked = paged.length > 0 && paged.every((o) => selected.includes(o.id));
  const toggleAllPage = () =>
    setSelected((prev) => {
      const ids = paged.map((o) => o.id);
      return allChecked ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])];
    });
  const clearSel = () => setSelected([]);

  const exportRows = filtered.map((o) => {
    const createdAt = Number.isFinite(o.createdAt) ? o.createdAt : Date.now();
    return {
      order: o.number, invoice: o.invoiceNumber, customer: o.customerName,
      email: o.customerEmail, phone: o.customerPhone ?? "", items: o.itemsCount,
      subtotal: o.subtotal.toFixed(2), discount: o.discount.toFixed(2),
      shipping: o.shippingCost.toFixed(2), tax: o.tax.toFixed(2), total: o.total.toFixed(2),
      status: o.status, payment: o.paymentStatus, shipping_status: o.shippingStatus,
      tracking: o.trackingNumber ?? "", date: new Date(createdAt).toISOString(),
    };
  });
  const exportCols: Column[] = Object.keys(exportRows[0] ?? { order: "" }).map((k) => ({ key: k, label: k }));

  const updateRemoteOrderStatus = async (id: string, next: OrderStatus) => {
    const remoteStatus = getValidERPNextSalesOrderStatus(next);
    if (next === "Delivered") {
      const delivery = await deliverSalesOrder(id);

      if (delivery?.success === true) {
        if (delivery.already_delivered) {
          pushToast("info", `Order ${id} was already delivered`);
          await refreshOrderQueries();
          return;
        }

        queryClient.setQueryData(["orders"], (oldOrders: any) => {
          if (!Array.isArray(oldOrders)) return oldOrders;
          return oldOrders.map((order) => order.id === id ? {
            ...order,
            status: "Delivered",
            workflowState: "Delivered",
            shippingStatus: "Delivered",
            paymentStatus: "Paid",
            fulfillment: "Fulfilled",
            deliveryNote: delivery.delivery_note ?? order.deliveryNote,
            salesInvoice: delivery.sales_invoice ?? order.salesInvoice,
          } : order);
        });

        await refreshOrderQueries();
        pushToast("success", delivery.sales_invoice ? `Delivered · ${delivery.sales_invoice}` : "Order delivered");
        return;
      }

      if (delivery?.already_delivered) {
        pushToast("info", `Order ${id} was already delivered`);
        await refreshOrderQueries();
        return;
      }

      throw new Error(delivery?.message ?? "Delivery failed");
    }
    if (!remoteStatus) {
      return;
    }
    await updateSalesOrderStatus(id, remoteStatus);
  };

  const applySelectedRemoteStatus = async (ids: string[], next: OrderStatus) => {
    const remoteIds = ids.filter((id) => orders.some((order) => order.id === id));
    const localIds = ids.filter((id) => !orders.some((order) => order.id === id));

    if (remoteIds.length) {
      const supported = remoteIds.filter(async () => true);
      const supportedIds: string[] = [];
      for (const id of remoteIds) {
        if (getValidERPNextSalesOrderStatus(next) !== null) supportedIds.push(id);
      }
      if (supportedIds.length) {
        await Promise.all(supportedIds.map((id) => updateRemoteOrderStatus(id, next)));
      }
      await refetchRemoteOrders();
    }

    if (localIds.length) {
      if (next === "Paid") bulkMarkOrdersPaid(localIds);
      else if (next === "Shipped") bulkShipOrders(localIds);
      else if (next === "Cancelled") bulkCancelOrders(localIds, { restock: true });
    }
  };

  const printSelected = () => {
    const set = new Set(selected);
    const list = orders.filter((o) => set.has(o.id));
    printInvoices(list);
  };

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label={pageTitle} />
      <PageHeader
        icon={item.icon} title={pageTitle}
        subtitle={pageSubtitle}
        primaryAction="Refresh"
        onPrimary={() => pushToast("info", isDrafts ? "Drafts refresh instantly as you create them" : "Orders update in real time as customers check out")}
        onExport={() => { downloadCSV(isDrafts ? "draft-orders" : "orders", exportCols, exportRows); pushToast("info", `Exported ${exportRows.length} ${isDrafts ? "drafts" : "orders"}`); }}
      />
      <StatsRow stats={stats} />
      {isError && <div className="text-sm text-rose-300">Unable to load orders from the Frappe backend.</div>}

      {/* Toolbar: search + status pills */}
      <Toolbar
        filters={[...STATUS_FILTERS]}
        active={status}
        onActive={(f) => { setStatus(f as any); setPage(1); }}
        query={query}
        onQuery={(q) => { setQuery(q); setPage(1); }}
      />


      {/* Advanced filter row */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <SelectPill label="Payment" value={payFilter} onChange={(v) => setPayFilter(v as any)}
          options={["All", "Unpaid", "Pending", "Paid", "Partially refunded", "Refunded", "Failed"]} />
        <SelectPill label="Shipping" value={shipFilter} onChange={(v) => setShipFilter(v as any)}
          options={["All", "Not shipped", "Processing", "Packed", "Shipped", "Out for delivery", "Delivered", "Returned"]} />
        <DateInput label="From" value={from} onChange={setFrom} />
        <DateInput label="To" value={to} onChange={setTo} />
        {(status !== "All" || payFilter !== "All" || shipFilter !== "All" || from || to || query) && (
          <button
            onClick={() => { setStatus("All"); setPayFilter("All"); setShipFilter("All"); setFrom(""); setTo(""); setQuery(""); }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <div className="ml-auto text-muted-foreground">{filtered.length} result{filtered.length === 1 ? "" : "s"}</div>
      </div>

      {selected.length > 0 && (
        <BulkBar count={selected.length}
          onClear={clearSel}
          onCancel={() => { if (confirm(`Cancel ${selected.length} order${selected.length === 1 ? "" : "s"}? Inventory will be restored.`)) { bulkCancelOrders(selected, { restock: true }); pushToast("success", `${selected.length} cancelled`); clearSel(); } }}
          onDelete={() => { if (confirm(`Delete ${selected.length} order${selected.length === 1 ? "" : "s"} permanently?`)) { removeManyOrders(selected); pushToast("success", `${selected.length} deleted`); clearSel(); } }}
          onPrint={printSelected}
          onExport={() => {
            const rows = exportRows.filter((r) => selected.some((id) => orders.find((o) => o.id === id)?.number === r.order));
            downloadCSV("orders-selected", exportCols, rows);
          }}
        />
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading {isDrafts ? "draft orders" : "orders"}...</div>
      ) : filtered.length ? (
        <>
          <SelectableOrdersTable
            columns={columns} rows={rows} orders={paged}
            selected={selected} onToggle={toggleSel}
            allChecked={allChecked} onToggleAll={toggleAllPage}
            onAction={async (a, o) => {
              if (a === "duplicate") { const c = duplicateOrder(o.id); if (c) pushToast("success", `Draft ${c.number} created`); }
              if (a === "delete") { if (confirm(`Delete ${o.number}?`)) { removeOrder(o.id); pushToast("success", "Order deleted"); } }
              if (a === "print") printInvoices([o]);
            }}
          />
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title="No orders match your filters"
          desc="Adjust your search or filters — orders appear here the moment a customer checks out on your live storefront."
          action="Reset filters"
          onAction={() => { setStatus("All"); setPayFilter("All"); setShipFilter("All"); setFrom(""); setTo(""); setQuery(""); }}
        />
      )}
    </div>
  );
}

/* ============================================================
 * Selectable table with per-row checkbox + action menu
 * ============================================================ */
function SelectableOrdersTable({
  columns, rows, orders, selected, onToggle, allChecked, onToggleAll, onAction,
}: {
  columns: Column[]; rows: Row[]; orders: Order[];
  selected: string[]; onToggle: (id: string, on?: boolean) => void;
  allChecked: boolean; onToggleAll: () => void;
  onAction: (a: "print" | "duplicate" | "delete", o: Order) => void;
}) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="w-10 px-3">
                <input type="checkbox" checked={allChecked} onChange={onToggleAll}
                  className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.05]" />
              </th>
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium", c.className)}>
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const o = orders[i];
              const isSel = selected.includes(o.id);
              return (
                <tr key={o.id}
                  className={cn("border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors", isSel && "bg-primary/[0.06]")}>
                  <td className="px-3">
                    <input type="checkbox" checked={isSel} onChange={(e) => onToggle(o.id, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/[0.05]" />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 text-[13px]", c.className)}>
                      {c.key === "id" ? (
                        <Link to="/dashboard/$" params={{ _splat: `orders/${o.id}` }} className="text-primary hover:underline font-medium">{o.number}</Link>
                      ) : c.key === "status" || c.key === "payment" ? <StatusPill label={String(r[c.key])} />
                        : String(r[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-2 text-right">
                    <OrderRowMenu order={o} onAction={onAction} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderRowMenu({ order, onAction }: {
  order: Order; onAction: (a: "print" | "duplicate" | "delete", o: Order) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <span className="inline-block" onClick={(e) => e.stopPropagation()}>
      <button ref={btnRef} onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <FloatingLayer open={open} onClose={() => setOpen(false)} anchorRef={btnRef} align="end" className="w-48 p-1 text-left">
        <MenuItem icon={ChevronRight} label="Open details" href={`/dashboard/orders/${order.id}`} />
        <MenuItem icon={Printer} label="Print invoice" onClick={() => { setOpen(false); onAction("print", order); }} />
        <MenuItem icon={Copy} label="Duplicate" onClick={() => { setOpen(false); onAction("duplicate", order); }} />
        <MenuItem icon={Trash2} label="Delete" danger onClick={() => { setOpen(false); onAction("delete", order); }} />
      </FloatingLayer>
    </span>
  );
}


function MenuItem({ icon: Icon, label, onClick, href, danger }: {
  icon: any; label: string; onClick?: () => void; href?: string; danger?: boolean;
}) {
  const cls = cn(
    "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition",
    danger ? "text-rose-300 hover:bg-rose-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
  );
  if (href) return <Link to={href as any} className={cls}><Icon className="h-3.5 w-3.5" />{label}</Link>;
  return <button onClick={onClick} className={cls}><Icon className="h-3.5 w-3.5" />{label}</button>;
}

/* ============================================================
 * Bulk action bar
 * ============================================================ */
function BulkBar({ count, onClear, onCancel, onDelete, onPrint, onExport }: {
  count: number; onClear: () => void;
  onCancel: () => void; onDelete: () => void;
  onPrint: () => void; onExport: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap rounded-2xl glass-strong border border-primary/30 p-2 pl-4 shadow-glow text-xs">
      <span className="font-medium">{count} selected</span>
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground px-2">Clear</button>
      <div className="ml-auto flex items-center gap-1 flex-wrap">
        <BulkBtn icon={Printer} label="Print" onClick={onPrint} />
        <BulkBtn icon={Download} label="Export" onClick={onExport} />
        <BulkBtn icon={Ban} label="Cancel" onClick={onCancel} tone="warn" />
        <BulkBtn icon={Trash2} label="Delete" onClick={onDelete} tone="danger" />
      </div>
    </motion.div>
  );
}

function BulkBtn({ icon: Icon, label, onClick, tone }: {
  icon: any; label: string; onClick: () => void; tone?: "warn" | "danger";
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 h-8 px-2.5 rounded-lg glass hover:bg-white/10 transition",
        tone === "warn" && "hover:bg-amber-500/10 hover:text-amber-200",
        tone === "danger" && "hover:bg-rose-500/10 hover:text-rose-200",
      )}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ============================================================
 * Small controls
 * ============================================================ */
function SelectPill({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 rounded-lg glass border border-white/[0.08]">
      <span className="text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none text-foreground pr-1">
        {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5 rounded-lg glass border border-white/[0.08]">
      <span className="text-muted-foreground">{label}</span>
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none text-foreground text-xs" />
    </label>
  );
}

/* ============================================================
 * ORDER DETAILS PAGE
 * ============================================================ */
export function OrderDetailsPage({ id }: { id: string }) {
  const localOrders = useStoreData((s) => s.orders);
  const queryClient = useQueryClient();
  const { data: remoteOrders = [], refetch: refetchRemoteOrders } = useOrders();
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const localOrder = localOrders.find((o) => o.id === id);
  const remoteOrder = remoteOrders.find((o) => o.id === id);
  const order = (() => {
    if (!remoteOrder) return localOrder;
    if (!localOrder) return remoteOrder;
    return {
      ...remoteOrder,
      ...localOrder,
      paymentStatus: localOrder.paymentStatus ?? remoteOrder.paymentStatus,
      shippingStatus: localOrder.shippingStatus ?? remoteOrder.shippingStatus,
      status: localOrder.status ?? remoteOrder.status,
      workflowState: localOrder.workflowState ?? remoteOrder.workflowState,
      timeline: localOrder.timeline?.length ? localOrder.timeline : remoteOrder.timeline,
      updatedAt: localOrder.updatedAt ?? remoteOrder.updatedAt,
    } as typeof remoteOrder & typeof localOrder;
  })();
  const workflowState = getSalesOrderWorkflowState(order as any);
  const canEdit = canEditOrder(order as any);
  const canCancel = canCancelOrder(order as any);
  const canApprove = canApproveOrder(order as any);
  const canReject = canRejectOrder(order as any);
  const isAdminUser = Boolean(
    currentUser?.isAdmin ||
    currentUser?.roles?.some((role: string) => ["Administrator", "System Manager"].includes(role))
  );
  const {
    setOrderStatus, setOrderPaymentStatus, cancelOrder, refundOrder, duplicateOrder, removeOrder,
    setOrderTracking, addOrderNote, updateOrder,
  } = useStoreData.getState();

  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState(order?.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order?.carrier ?? "");
  useEffect(() => { setTracking(order?.trackingNumber ?? ""); setCarrier(order?.carrier ?? ""); }, [order?.id, order?.trackingNumber, order?.carrier]);

  if (!order) {
    return (
      <div className="space-y-4">
        <ToastHost />
        <Breadcrumb label="Order" parent={{ label: "Orders", slug: "orders" }} />
        <EmptyState title="Order not found" desc="This order was deleted or never existed." action="Back to orders"
          onAction={() => navigate({ to: "/dashboard/$", params: { _splat: "orders" } })} />
      </div>
    );
  }

  const refreshOrderFromERPNext = async () => {
    if (!remoteOrder) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
      refetchRemoteOrders(),
    ]);
  };

  const advanceTo = async (s: OrderStatus, msg?: string) => {
    if (remoteOrder) {
      const isDraft = Number(remoteOrder?.status ?? 0) === 0 || getSalesOrderWorkflowState(remoteOrder).toLowerCase() === "draft";
      const remoteStatus = getValidERPNextSalesOrderStatus(s);
      try {
        if (isDraft && s === "Confirmed") {
          await submitSalesOrder(remoteOrder.id);
          await refreshOrderFromERPNext();
          setOrderStatus(order.id, "Confirmed", msg ?? "Confirmed from ERPNext");
          pushToast("success", `${order.number} confirmed`);
          return;
        }

        if (isDraft) {
          await submitSalesOrder(remoteOrder.id);
          await refreshOrderFromERPNext();
        }

        if (s === "Shipped" || s === "Delivered") {
          const delivery = await deliverSalesOrder(remoteOrder.id);
          if (delivery?.success === true) {
            if (delivery.already_delivered) {
              await refreshOrderFromERPNext();
              pushToast("info", `${order.number} was already delivered`);
              return;
            }

            const updatedFields = {
              status: "Delivered" as OrderStatus,
              workflowState: "Delivered",
              shippingStatus: "Delivered" as ShippingStatus,
              paymentStatus: "Paid" as PaymentStatus,
              fulfillment: "Fulfilled" as const,
              deliveryNote: delivery.delivery_note ?? undefined,
              salesInvoice: delivery.sales_invoice ?? undefined,
            };

            queryClient.setQueryData(["orders"], (oldOrders: any) => {
              if (!Array.isArray(oldOrders)) return oldOrders;
              return oldOrders.map((item) => item.id === remoteOrder.id ? { ...item, ...updatedFields } : item);
            });

            updateOrder(order.id, updatedFields);
            await refreshOrderFromERPNext();
            pushToast("success", delivery.sales_invoice ? `${order.number} delivered · ${delivery.sales_invoice}` : `${order.number} delivered`);
            return;
          }
          throw new Error(delivery?.message ?? "Delivery failed");
        } else if (remoteStatus) {
          await updateSalesOrderStatus(remoteOrder.id, remoteStatus);
        } else {
          pushToast("error", `ERPNext does not support changing this order to ${s}.`);
          return;
        }

        await refreshOrderFromERPNext();
        setOrderStatus(order.id, s, msg ?? `Updated to ${s}`);
        if (s === "Paid") setOrderPaymentStatus(order.id, "Paid", msg ?? "Marked paid from dashboard");
        pushToast("success", `${order.number} → ${s}`);
      } catch (error) {
        console.error("Failed to update Sales Order status", error);
        pushToast("error", error instanceof Error ? error.message : "ERPNext update failed. No local status was changed.");
        return;
      }
    } else {
      setOrderStatus(order.id, s, msg);
      pushToast("success", `${order.number} → ${s}`);
    }
    if (s === "Shipped") notifyEmail("Order shipped", order.customerEmail);
    if (s === "Delivered") notifyEmail("Order delivered", order.customerEmail);
  };

  const handleApprove = async () => {
    if (!remoteOrder) return;
    try {
      await approveSalesOrder(remoteOrder.id);
      await refreshOrderFromERPNext();
      pushToast("success", `${order.number} approved in ERPNext`);
    } catch (error) {
      console.error("Order approval failed", error);
      pushToast("error", "Order approval failed. Please try again.");
    }
  };

  const handleReject = async () => {
    if (!remoteOrder) return;
    try {
      await rejectSalesOrder(remoteOrder.id);
      await refreshOrderFromERPNext();
      pushToast("success", `${order.number} rejected in ERPNext`);
    } catch (error) {
      console.error("Order rejection failed", error);
      pushToast("error", "Order rejection failed. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (!remoteOrder) {
      if (confirm(`Cancel ${order.number}? Inventory will be restored.`)) {
        cancelOrder(order.id, { restock: true });
        setOrderStatus(order.id, "Cancelled", "Cancelled from dashboard");
        pushToast("success", "Order cancelled");
        notifyEmail("Order cancelled", order.customerEmail);
      }
      return;
    }

    if (!canCancel) {
      pushToast("error", "This order can no longer be cancelled.");
      return;
    }

    try {
      await cancelSalesOrder(remoteOrder.id);
      await refreshOrderFromERPNext();
      setOrderStatus(order.id, "Cancelled", "Cancelled in ERPNext");
      pushToast("success", `${order.number} cancelled in ERPNext`);
    } catch (error) {
      console.error("Order cancellation failed", error);
      pushToast("error", error instanceof Error ? error.message : "ERPNext cancellation failed. No local status was changed.");
    }
  };

  const paymentTone: Record<PaymentStatus, string> = {
    Paid: "text-emerald-300 bg-emerald-400/10",
    Unpaid: "text-amber-300 bg-amber-400/10",
    Pending: "text-amber-300 bg-amber-400/10",
    "Partially refunded": "text-orange-300 bg-orange-400/10",
    Refunded: "text-rose-300 bg-rose-400/10",
    Failed: "text-rose-300 bg-rose-400/10",
  };

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label={order.number} parent={{ label: "Orders", slug: "orders" }} />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard/$" params={{ _splat: "orders" }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
            <ShoppingCart className="h-5 w-5 text-primary-foreground" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{order.number}</h1>
              <StatusPill label={workflowState || order.status} />
              <span className={cn("inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium", paymentTone[order.paymentStatus])}>
                {order.paymentStatus}
              </span>
              <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-white/[0.06] text-muted-foreground">
                {order.shippingStatus}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dtLong(order.createdAt)} · {order.invoiceNumber}
              {workflowState && <> · <span className="font-mono">{workflowState}</span></>}
              {order.transactionId && <> · <span className="font-mono">{order.transactionId}</span></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <IconBtn icon={Printer} label="Print invoice" onClick={() => printInvoices([order])} />
          <IconBtn icon={Download} label="Download" onClick={() => downloadInvoice(order)} />
          <IconBtn icon={Copy} label="Duplicate" onClick={() => {
            const c = duplicateOrder(order.id);
            if (c) { pushToast("success", `Draft ${c.number} created`); navigate({ to: "/dashboard/$", params: { _splat: `orders/${c.id}` } }); }
          }} />
          <IconBtn icon={Trash2} label="Delete" tone="danger" onClick={() => {
            if (confirm(`Delete ${order.number} permanently?`)) {
              removeOrder(order.id); pushToast("success", "Order deleted");
              navigate({ to: "/dashboard/$", params: { _splat: "orders" } });
            }
          }} />
        </div>
      </div>

      {/* Action bar with full lifecycle */}
      <div className="rounded-2xl glass-strong border border-white/[0.08] p-3 flex flex-wrap gap-2">
        {remoteOrder && isAdminUser && (canApprove || canReject) && (
          <>
            {canApprove && <LifecycleBtn active={false} disabled={false} icon={BadgeCheck} label="Approve" onClick={handleApprove} />}
            {canReject && <LifecycleBtn active={false} disabled={false} icon={X} label="Reject" onClick={handleReject} />}
          </>
        )}
        <LifecycleBtn active={order.status === "Confirmed"} disabled={order.status === "Cancelled" || order.status === "Refunded"}
          icon={BadgeCheck} label="Confirm" onClick={() => advanceTo("Confirmed")} />
        <LifecycleBtn active={order.status === "Delivered"} disabled={order.status === "Cancelled" || order.status === "Refunded"}
          icon={Check} label="Delivered" onClick={() => advanceTo("Delivered")} />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={remoteOrder ? !canCancel : false}
            className={cn("inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-amber-500/10 hover:text-amber-200 text-xs disabled:opacity-40 disabled:cursor-not-allowed", remoteOrder && !canCancel && "opacity-40")}
          >
            <Ban className="h-3.5 w-3.5" /> Cancel
          </button>
          <button onClick={() => {
            if (confirm(`Refund ${money(order.total)} for ${order.number}?`)) {
              refundOrder(order.id, { restock: true }); pushToast("success", "Order refunded");
              notifyEmail("Refund processed", order.customerEmail);
            }
          }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-200 text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Refund
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <Card title="Items" subtitle={`${order.itemsCount} unit${order.itemsCount === 1 ? "" : "s"}`}>
            <ul className="divide-y divide-white/[0.05]">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex items-center gap-3 py-3">
                  {i.image
                    ? <img src={i.image} alt={i.name} className="h-14 w-14 rounded-lg object-cover" />
                    : <div className="h-14 w-14 rounded-lg bg-white/[0.05]" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.variant && <>{i.variant} · </>}
                      {i.sku && <>Item code {i.sku} · </>}
                      Qty {i.qty} × {money(i.price)}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{money(i.price * i.qty)}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-white/[0.05] space-y-1 text-xs">
              <Line label="Subtotal" value={money(order.subtotal)} />
              {order.discount > 0 && <Line label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={`- ${money(order.discount)}`} />}
              {order.shippingCost > 0 && <Line label={`Shipping${order.shippingMethod ? ` · ${order.shippingMethod.label}` : ""}`} value={money(order.shippingCost)} />}
              {order.tax > 0 && <Line label="Tax" value={money(order.tax)} />}
              <Line label="Grand total" value={money(order.total)} bold />
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Timeline" subtitle="Every event on this order">
            <ol className="relative border-l border-white/[0.08] pl-4 space-y-3">
              {[...order.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className={cn(
                    "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full",
                    t.kind === "note" ? "bg-amber-400" : t.kind === "email" ? "bg-sky-400" : "bg-primary shadow-glow",
                  )} />
                  <div className="text-sm font-medium">{t.label}</div>
                  {t.description && <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>}
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mt-1">
                    <Clock className="inline h-3 w-3 mr-1" />{dtLong(t.at)}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-4 flex items-start gap-2">
              <textarea rows={2} placeholder="Add a private note (internal only)…"
                value={note} onChange={(e) => setNote(e.target.value)}
                className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.08] p-2 text-xs outline-none focus:border-primary/40" />
              <button
                onClick={() => { if (!note.trim()) return; addOrderNote(order.id, note); setNote(""); pushToast("success", "Note added"); }}
                className="inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                <StickyNote className="h-3.5 w-3.5" /> Add note
              </button>
            </div>
          </Card>

          {/* Tracking */}
          <Card title="Shipping & tracking" subtitle={order.shippingMethod?.label ?? "No method"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Labeled label="Carrier">
                <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. DHL"
                  className="w-full h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-sm outline-none focus:border-primary/40" />
              </Labeled>
              <Labeled label="Tracking number">
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1Z999AA10123456784"
                  className="w-full h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] px-3 text-sm outline-none focus:border-primary/40" />
              </Labeled>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button onClick={() => {
                if (!tracking.trim()) { pushToast("error", "Tracking number is required"); return; }
                setOrderTracking(order.id, tracking.trim(), carrier.trim() || undefined);
                pushToast("success", "Tracking saved");
                notifyEmail("Order shipped", order.customerEmail);
              }} className="inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                <Truck className="h-3.5 w-3.5" /> Save & notify
              </button>
              {order.estimatedDelivery && (
                <span className="text-xs text-muted-foreground">
                  ETA {dt(order.estimatedDelivery.earliest)} — {dt(order.estimatedDelivery.latest)}
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card title="Customer" icon={Mail}>
            <div className="text-sm font-medium">{order.customerName || "Guest"}</div>
            <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
            {order.customerPhone && <div className="text-xs text-muted-foreground">{order.customerPhone}</div>}
            {order.company && <div className="text-xs text-muted-foreground mt-1">Company: {order.company}</div>}
            {order.customerId && (
              <Link to="/dashboard/$" params={{ _splat: "customers" }} className="mt-2 inline-flex text-xs text-primary hover:underline">
                View customer <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </Card>
          <Card title="Order information" icon={Package}>
            <Row2 label="Order" value={order.number} />
            <Row2 label="Invoice" value={order.invoiceNumber} />
            {order.salesInvoice && <Row2 label="Sales invoice" value={<span className="font-mono text-xs">{order.salesInvoice}</span>} />}
            {order.deliveryNote && <Row2 label="Delivery note" value={<span className="font-mono text-xs">{order.deliveryNote}</span>} />}
            <Row2 label="Items" value={order.itemsCount} />
            <Row2 label="Company" value={order.company ?? "—"} />
            <Row2 label="Date" value={dt(order.createdAt)} />
          </Card>
          <AddressCard title="Shipping address" icon={MapPin} address={order.shipping} />
          <AddressCard title="Billing address" icon={CreditCard}
            address={order.billingSameAsShipping ? order.shipping : order.billing}
            note={order.billingSameAsShipping ? "Same as shipping" : undefined} />
          <Card title="Payment">
            <Row2 label="Method" value={order.paymentMethod ?? "—"} />
            <Row2 label="Status" value={order.paymentStatus} />
            {order.transactionId && <Row2 label="Transaction" value={<span className="font-mono text-xs">{order.transactionId}</span>} />}
            <Row2 label="Total" value={money(order.total)} bold />
          </Card>
          {order.notes && (
            <Card title="Customer note">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Details helpers
 * ============================================================ */
function Card({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{title}</div>
        </div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={cn("flex items-center justify-between", bold && "text-foreground font-semibold text-sm pt-1")}><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
function Row2({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return <div className="flex items-center justify-between text-sm py-1"><span className="text-muted-foreground text-xs">{label}</span><span className={cn(bold && "font-semibold")}>{value}</span></div>;
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">{label}</div>{children}</div>;
}
function AddressCard({ title, icon, address, note }: { title: string; icon: any; address?: any; note?: string }) {
  if (!address) return <Card title={title} icon={icon}><div className="text-xs text-muted-foreground">No address on file</div></Card>;
  const name = address.name || `${address.firstName ?? ""} ${address.lastName ?? ""}`.trim();
  return (
    <Card title={title} icon={icon}>
      {note && <div className="text-xs text-muted-foreground mb-1">{note}</div>}
      {name && <div className="text-sm font-medium">{name}</div>}
      {address.company && <div className="text-xs text-muted-foreground">{address.company}</div>}
      <div className="text-xs text-muted-foreground whitespace-pre-line mt-1">
        {[address.line1, [address.apartment, address.line2].filter(Boolean).join(" "), [address.city, address.state, address.zip].filter(Boolean).join(" "), address.country].filter(Boolean).join("\n")}
      </div>
      {address.phone && <div className="text-xs text-muted-foreground mt-1">{address.phone}</div>}
    </Card>
  );
}

function IconBtn({ icon: Icon, label, onClick, tone }: { icon: any; label: string; onClick: () => void; tone?: "danger" }) {
  return (
    <button onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition",
        tone === "danger" && "hover:bg-rose-500/10 hover:text-rose-200",
      )}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function LifecycleBtn({ icon: Icon, label, onClick, active, disabled }: {
  icon: any; label: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs transition",
        active ? "bg-primary-gradient text-primary-foreground shadow-glow"
               : "glass hover:bg-white/10",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/* ============================================================
 * Invoice printing / download
 * ============================================================ */
function invoiceHTML(orders: Order[], storeName: string) {
  const rows = orders.map((o) => `
    <section class="invoice">
      <header>
        <div class="brand">${escapeHTML(storeName)}</div>
        <div>
          <div class="title">Invoice</div>
          <div class="num">${escapeHTML(o.invoiceNumber)}</div>
          <div class="muted">Order ${escapeHTML(o.number)} · ${new Date(o.createdAt).toLocaleDateString()}</div>
        </div>
      </header>
      <div class="cols">
        <div>
          <div class="h">Bill to</div>
          <div><strong>${escapeHTML(o.customerName || "Guest")}</strong></div>
          <div class="muted">${escapeHTML(o.customerEmail)}</div>
          ${o.billing ? addressBlock(o.billing) : ""}
        </div>
        <div>
          <div class="h">Ship to</div>
          ${o.shipping ? addressBlock(o.shipping) : `<div class="muted">—</div>`}
        </div>
        <div>
          <div class="h">Payment</div>
          <div>${escapeHTML(o.paymentMethod ?? "—")}</div>
          <div class="muted">${escapeHTML(o.paymentStatus)}</div>
          ${o.transactionId ? `<div class="muted">${escapeHTML(o.transactionId)}</div>` : ""}
        </div>
      </div>
      <table>
        <thead><tr><th>Item</th><th>Item code</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
        <tbody>
          ${o.items.map((i) => `<tr>
            <td>${escapeHTML(i.name)}${i.variant ? ` <span class="muted">(${escapeHTML(i.variant)})</span>` : ""}</td>
            <td>${escapeHTML(i.sku ?? "")}</td>
            <td class="r">${i.qty}</td>
            <td class="r">${money(i.price)}</td>
            <td class="r">${money(i.price * i.qty)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
        ${o.discount > 0 ? `<div><span>Discount ${o.couponCode ? `(${escapeHTML(o.couponCode)})` : ""}</span><span>- ${money(o.discount)}</span></div>` : ""}
        ${o.shippingCost > 0 ? `<div><span>Shipping</span><span>${money(o.shippingCost)}</span></div>` : ""}
        ${o.tax > 0 ? `<div><span>Tax</span><span>${money(o.tax)}</span></div>` : ""}
        <div class="grand"><span>Total</span><span>${money(o.total)}</span></div>
      </div>
      ${o.notes ? `<div class="notes"><div class="h">Notes</div><div>${escapeHTML(o.notes)}</div></div>` : ""}
    </section>
  `).join("");
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Invoice ${orders.map((o) => o.invoiceNumber).join(", ")}</title>
  <style>
    :root { color-scheme: light; }
    body { font: 13px/1.5 -apple-system, "Inter", sans-serif; color: #111; background: #fff; padding: 32px; }
    .invoice { max-width: 780px; margin: 0 auto 60px; page-break-after: always; }
    header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:16px; margin-bottom:24px; }
    .brand { font-size:22px; font-weight:700; letter-spacing:-0.01em; }
    .title { text-transform:uppercase; letter-spacing:.16em; font-size:11px; color:#555; }
    .num { font-size:20px; font-weight:600; margin-top:2px; }
    .muted { color:#666; font-size:12px; }
    .cols { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-bottom:24px; }
    .h { text-transform:uppercase; letter-spacing:.14em; font-size:10px; color:#666; margin-bottom:6px; }
    table { width:100%; border-collapse:collapse; margin-bottom:16px; }
    th, td { padding:8px 6px; border-bottom:1px solid #eee; text-align:left; font-size:12px; }
    th { font-size:10px; text-transform:uppercase; letter-spacing:.14em; color:#666; }
    .r { text-align:right; }
    .totals { margin-left:auto; width:280px; }
    .totals > div { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
    .totals .grand { font-weight:700; font-size:15px; border-top:2px solid #111; padding-top:8px; margin-top:6px; }
    .notes { margin-top:20px; padding-top:12px; border-top:1px solid #eee; }
    @media print { body { padding:0; } .invoice { margin:0 auto; } }
  </style></head><body>${rows}</body></html>`;
}

function addressBlock(a: any) {
  const name = a.name || `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
  const parts = [
    name,
    a.company,
    a.line1,
    [a.apartment, a.line2].filter(Boolean).join(" "),
    [a.city, a.state, a.zip].filter(Boolean).join(" "),
    a.country,
    a.phone,
  ].filter(Boolean).map((s: string) => `<div>${escapeHTML(s)}</div>`).join("");
  return `<div class="muted">${parts}</div>`;
}

function escapeHTML(s?: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] as string));
}

function printInvoices(orders: Order[]) {
  if (!orders.length) return;
  const storeName = "Your Store";
  const html = invoiceHTML(orders, storeName);
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) { pushToast("error", "Please allow pop-ups to print invoices"); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 200);
}

function downloadInvoice(order: Order) {
  const html = invoiceHTML([order], "Your Store");
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${order.invoiceNumber}.html`; a.click();
  URL.revokeObjectURL(url);
  pushToast("success", `${order.invoiceNumber} downloaded`);
}

/* ============================================================
 * Abandoned Checkouts page
 * Shows sessions where a customer added items to their cart but
 * did not complete checkout. In the current single-tenant browser
 * model this maps to the live cart when it has items and has been
 * idle for a while (or immediately, for admin visibility).
 * ============================================================ */
export function AbandonedCheckoutsPage() {
  const item = findItem("orders/abandoned")!;
  const cart = useStoreData((s) => s.cart);
  const products = useStoreData((s) => s.products);
  const cartUpdatedAt = useStoreData((s) => s.cartUpdatedAt);
  const clearCart = useStoreData((s) => s.clearCart);
  const openCart = () => {
    try { (window as any).dispatchEvent(new CustomEvent("aether:open-cart")); } catch {}
    pushToast("info", "Open your storefront to recover this checkout");
  };

  const lines = cart.map((c) => {
    const p = products.find((pp) => pp.id === c.productId);
    return { id: c.productId, name: p?.name ?? "Unknown", qty: c.qty, price: p?.price ?? 0, total: (p?.price ?? 0) * c.qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);
  const idleFor = cartUpdatedAt ? Math.max(0, Date.now() - cartUpdatedAt) : 0;
  const idleLabel = !cartUpdatedAt ? "—"
    : idleFor < 60_000 ? "just now"
    : idleFor < 3_600_000 ? `${Math.round(idleFor / 60_000)}m ago`
    : idleFor < 86_400_000 ? `${Math.round(idleFor / 3_600_000)}h ago`
    : `${Math.round(idleFor / 86_400_000)}d ago`;

  const stats: Stat[] = [
    { label: "Open sessions", value: String(cart.length > 0 ? 1 : 0) },
    { label: "Items in cart", value: String(itemCount) },
    { label: "Potential revenue", value: money(subtotal) },
    { label: "Last activity", value: idleLabel },
  ];

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Abandoned Checkouts" />
      <PageHeader
        icon={item.icon} title="Abandoned Checkouts"
        subtitle="Sessions where a customer added items but never completed checkout — recover them or clear them out."
        primaryAction="Refresh"
        onPrimary={() => pushToast("info", "Cart activity syncs from your live storefront")}
      />
      <StatsRow stats={stats} />

      {cart.length === 0 ? (
        <EmptyState
          title="No abandoned checkouts"
          desc="When a customer adds items to their cart and leaves without paying, the session shows up here so you can follow up."
          action="View storefront"
          onAction={() => pushToast("info", "Open your published storefront to add items to a cart")}
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/[0.06]">
            <div className="min-w-0">
              <div className="text-sm font-medium">Guest session</div>
              <div className="text-xs text-muted-foreground">{itemCount} item{itemCount === 1 ? "" : "s"} · updated {idleLabel}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">{money(subtotal)}</div>
              <button onClick={openCart} className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
                Recover
              </button>
              <button
                onClick={() => { if (confirm("Discard this abandoned checkout?")) { clearCart(); pushToast("success", "Abandoned checkout cleared"); } }}
                className="h-8 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-xs">
                Discard
              </button>
            </div>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {lines.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div className="min-w-0 truncate">{l.name}</div>
                <div className="text-xs text-muted-foreground">Qty {l.qty}</div>
                <div className="text-xs text-muted-foreground w-20 text-right">{money(l.price)}</div>
                <div className="w-24 text-right font-medium">{money(l.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
