import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Plus, Trash2, Check, Search, Download, Warehouse as WarehouseIcon,
  ArrowRightLeft, ClipboardList, History, Layers, AlertTriangle, Package,
  Truck, MapPin, Building2, Edit3, RotateCcw, Ban, PackageCheck, Filter,
  Pencil, MoreHorizontal, Boxes, Barcode, Copy, Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { findItem } from "@/components/dashboard/nav-config";
import {
  useStoreData, useStoreStats,
  type Warehouse, type PurchaseOrder, type PurchaseOrderStatus,
  type StockTransfer, type StockTransferStatus, type StockMovement,
  type Product, type MovementReason,
} from "@/lib/store-data-store";
import { useProductsWithInventory } from "@/hooks/useProducts";
// import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import {
  Breadcrumb, PageHeader, StatsRow, downloadCSV, pushToast, ToastHost,
  type Stat,
} from "@/routes/dashboard.$";
import { api } from "@/api/client";







type FrappePurchaseOrder = {
  name: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;

  supplier?: string;
  supplier_name?: string;
  company?: string;

  transaction_date?: string;
  schedule_date?: string;

  status?: string;

  currency?: string;
  conversion_rate?: number;

  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  rounded_total?: number;

  discount_amount?: number;
  additional_discount_percentage?: number;

  shipping_address?: string;
  billing_address?: string;

  contact_person?: string;
  contact_email?: string;

  set_warehouse?: string;
  supplier_warehouse?: string;

  buying_price_list?: string;
  price_list_currency?: string;

  remarks?: string;

  [key: string]: unknown;
};

async function getPurchaseOrders(): Promise<FrappePurchaseOrder[]> {
  const response = await api.get("/resource/Purchase Order", {
    params: {
      fields: JSON.stringify(["*"]),
      order_by: "creation desc",
      limit_page_length: 500,
    },
  });

  return response.data.data;
}



/* ---------------- helpers ---------------- */
const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const dt = (t?: number) => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
const dtTime = (t: number) => new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function stockStatus(p: Product): { label: "Untracked" | "Out" | "Low" | "In stock"; tone: string } {
  if (p.trackInventory === false) return { label: "Untracked", tone: "bg-white/10 text-muted-foreground" };
  if (p.stock === 0) return { label: "Out", tone: "bg-rose-500/15 text-rose-300 border border-rose-500/30" };
  const th = p.lowStockThreshold ?? 5;
  if (p.stock <= th) return { label: "Low", tone: "bg-amber-500/15 text-amber-300 border border-amber-500/30" };
  return { label: "In stock", tone: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" };
}

const REASON_LABEL: Record<MovementReason, string> = {
  "product-created": "Product created",
  "manual-adjustment": "Manual adjustment",
  "stock-added": "Stock added",
  "stock-removed": "Stock removed",
  "stock-reserved": "Reserved",
  "stock-released": "Released",
  "order-placed": "Order placed",
  "order-cancelled": "Order cancelled",
  "order-refunded": "Order refunded",
  "purchase-received": "Purchase received",
  "warehouse-transfer": "Warehouse transfer",
  "damaged": "Damaged",
  "returned": "Returned",
};

/* ---------------- Modal shell ---------------- */
function ModalShell({ open, onClose, title, sub, children, footer, maxWidth = "max-w-2xl" }: {
  open: boolean; onClose: () => void; title: string; sub?: string;
  children: React.ReactNode; footer?: React.ReactNode; maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
          onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={cn("mx-auto glass-strong border border-white/10 rounded-2xl shadow-glow flex flex-col", maxWidth, "max-h-[92vh]")}>
            <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-medium">{title}</h3>
                {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-white/10 grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">{children}</div>
            {footer && <div className="p-4 border-t border-white/[0.06] flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">{label}</span>
    {children}
  </label>
);
const input = "h-10 w-full px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-primary/40 text-sm";
const btnPrimary = "h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90";
const btnGhost = "h-9 px-4 rounded-xl glass hover:bg-white/10 text-sm";
const btnDanger = "h-9 px-4 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 text-sm border border-rose-500/30";

/* ============================================================
 * Main page with tabs
 * ============================================================ */
type Tab = "overview" | "warehouses" | "purchase-orders" | "transfers" | "movements" | "reports";

export function InventoryManagementPage() {
  const item = findItem("inventory")!;
  const stats = useStoreStats();
  const [tab, setTab] = useState<Tab>("overview");

  const heroStats: Stat[] = [
    { label: "Units on hand", value: stats.totalInventoryUnits.toLocaleString() },
    { label: "Available", value: stats.availableInventoryUnits.toLocaleString() },
    { label: "Reserved", value: stats.reservedInventoryUnits.toLocaleString() },
    { label: "Inventory value", value: money(stats.inventoryValue) },
  ];

  const tabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: Boxes },
    { id: "warehouses", label: "Warehouses", icon: WarehouseIcon, badge: stats.warehouseCount },
    { id: "purchase-orders", label: "Purchase orders", icon: ClipboardList },
    { id: "transfers", label: "Transfers", icon: ArrowRightLeft },
    { id: "movements", label: "Movement log", icon: History },
    { id: "reports", label: "Reports", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Inventory" />
      <PageHeader
        icon={item.icon}
        title="Inventory"
        subtitle="Live stock across every warehouse, product and order."
        primaryAction="Refresh"
        onPrimary={() => pushToast("info", "Inventory is live")}
      />
      <StatsRow stats={heroStats} />

      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />
          <div className="text-sm text-amber-100">
            {stats.outOfStock > 0 && <><span className="font-medium">{stats.outOfStock}</span> out of stock</>}
            {stats.outOfStock > 0 && stats.lowStock > 0 && <span className="opacity-60"> · </span>}
            {stats.lowStock > 0 && <><span className="font-medium">{stats.lowStock}</span> low stock</>}
          </div>
          <button onClick={() => setTab("overview")} className="ml-auto text-xs underline text-amber-200 hover:text-amber-100">Review items</button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] overflow-x-auto -mx-2 px-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-t-xl border-b-2 -mb-px transition whitespace-nowrap",
              tab === t.id
                ? "border-primary text-foreground bg-white/[0.03]"
                : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge !== undefined && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "warehouses" && <WarehousesTab />}
      {tab === "purchase-orders" && <PurchaseOrdersTab />}
      {tab === "transfers" && <TransfersTab />}
      {tab === "movements" && <MovementsTab />}
      {tab === "reports" && <ReportsTab />}
    </div>
  );
}

/* ============================================================
 * OVERVIEW: per-product live stock table with adjust / bulk
 * ============================================================ */
function OverviewTab() {
  const { data: products = [], isLoading, isError, refetch } = useProductsWithInventory();
  const warehouses = useStoreData((s) => s.warehouses);
  const { adjustStock, bulkAdjustStock, bulkAssignWarehouse, markDamaged, markReturned } = useStoreData.getState();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "low" | "out" | "untracked">("all");
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adjustFor, setAdjustFor] = useState<Product | null>(null);
  const [bulkOpen, setBulkOpen] = useState<"stock" | "warehouse" | null>(null);

  const rows = useMemo(() => {
    const search = q.trim().toLowerCase();
    return products.filter((p) => {
      const st = stockStatus(p);
      if (filter === "in" && st.label !== "In stock") return false;
      if (filter === "low" && st.label !== "Low") return false;
      if (filter === "out" && st.label !== "Out") return false;
      if (filter === "untracked" && st.label !== "Untracked") return false;
      if (warehouseId !== "all") {
        const on = p.stockByWarehouse?.[warehouseId];
        if (!on) return false;
      }
      if (search) {
        return (
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          (p.barcode ?? "").toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [products, q, filter, warehouseId]);

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading inventory…</div>;
  if (isError) return <div className="py-12 text-center text-rose-300">Failed to load inventory.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or barcode…"
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] outline-none focus:border-primary/40 text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)}
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none">
          <option value="all">All statuses</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
          <option value="untracked">Untracked</option>
        </select>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none">
          <option value="all">All warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button onClick={() => downloadCSV("inventory",
          [{ key: "sku", label: "SKU" }, { key: "name", label: "Product" }, { key: "stock", label: "On hand" }, { key: "reserved", label: "Reserved" }, { key: "value", label: "Value" }],
          products.map((p) => ({ sku: p.sku, name: p.name, stock: p.stock, reserved: p.reserved ?? 0, value: ((p.costPerItem ?? 0) * p.stock).toFixed(2) })))}
          className={cn(btnGhost, "flex items-center gap-2")}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button onClick={() => setBulkOpen("stock")} className={btnGhost}>Bulk update stock</button>
            <button onClick={() => setBulkOpen("warehouse")} className={btnGhost}>Assign warehouse</button>
            <button onClick={() => setSelected(new Set())} className={btnGhost}>Clear</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                <th className="w-10 pl-4 py-3">
                  <input type="checkbox" checked={rows.length > 0 && selected.size === rows.length} onChange={toggleAll} />
                </th>
                <th className="text-left px-3 py-3 font-medium">Product</th>
                <th className="text-left px-3 py-3 font-medium">SKU</th>
                <th className="text-right px-3 py-3 font-medium">On hand</th>
                <th className="text-right px-3 py-3 font-medium">Reserved</th>
                <th className="text-right px-3 py-3 font-medium">Available</th>
                <th className="text-right px-3 py-3 font-medium">Value</th>
                <th className="text-right px-3 py-3 font-medium">Status</th>
                <th className="text-right px-3 py-3 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stockStatus(p);
                const reserved = p.reserved ?? 0;
                const available = Math.max(0, p.stock - reserved);
                return (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="pl-4 py-2.5">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => {
                        setSelected((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
                      }} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/[0.04] overflow-hidden shrink-0 grid place-items-center">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <Package className="h-3.5 w-3.5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate">{p.name}</div>
                          {p.barcode && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Barcode className="h-3 w-3" />{p.barcode}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{p.sku}</td>
                    <td className="px-3 py-2.5 text-right font-medium">{p.stock}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{reserved}</td>
                    <td className="px-3 py-2.5 text-right">{available}</td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{money((p.costPerItem ?? 0) * p.stock)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", st.tone)}>{st.label}</span>
                    </td>
                    <td className="px-3 py-2.5 pr-4 text-right space-x-1">
                      <button onClick={() => adjustStock({ productId: p.id, delta: 1, reason: "stock-added", note: "+1 from inventory" })}
                        className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs">+1</button>
                      <button onClick={() => adjustStock({ productId: p.id, delta: -1, reason: "stock-removed", note: "-1 from inventory" })}
                        className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs">-1</button>
                      <button onClick={() => setAdjustFor(p)} className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs">
                        <Edit3 className="h-3 w-3 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">No products match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdjustStockModal product={adjustFor} onClose={() => setAdjustFor(null)} />
      <BulkStockModal open={bulkOpen === "stock"} onClose={() => setBulkOpen(null)}
        onApply={(mode, val) => { bulkAdjustStock(Array.from(selected), mode, val); pushToast("success", `Updated ${selected.size} products`); setSelected(new Set()); setBulkOpen(null); }} />
      <BulkWarehouseModal open={bulkOpen === "warehouse"} onClose={() => setBulkOpen(null)} warehouses={warehouses}
        onApply={(id) => { bulkAssignWarehouse(Array.from(selected), id); pushToast("success", `Assigned ${selected.size} products`); setSelected(new Set()); setBulkOpen(null); }} />
    </div>
  );
}

function AdjustStockModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { adjustStock, markDamaged, markReturned } = useStoreData.getState();
  const warehouses = useStoreData((s) => s.warehouses);
  const [mode, setMode] = useState<"add" | "remove" | "set" | "damaged" | "returned">("add");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [warehouseId, setWarehouseId] = useState(warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id);
  useEffect(() => { setQty(1); setNote(""); setMode("add"); }, [product?.id]);
  if (!product) return null;

  const apply = () => {
    if (mode === "damaged") markDamaged(product.id, qty, note);
    else if (mode === "returned") markReturned(product.id, qty, note);
    else {
      const delta = mode === "add" ? qty : mode === "remove" ? -qty : qty - product.stock;
      adjustStock({
        productId: product.id, delta,
        reason: mode === "set" ? "manual-adjustment" : mode === "add" ? "stock-added" : "stock-removed",
        warehouseId, note,
      });
    }
    pushToast("success", `Inventory updated for ${product.name}`);
    onClose();
  };

  return (
    <ModalShell open={!!product} onClose={onClose} title="Adjust stock" sub={product.name} maxWidth="max-w-lg"
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={apply}>Apply</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Adjustment">
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={input}>
            <option value="add">Add stock</option>
            <option value="remove">Remove stock</option>
            <option value="set">Set exact quantity</option>
            <option value="damaged">Mark damaged</option>
            <option value="returned">Mark returned</option>
          </select>
        </Field>
        <Field label={mode === "set" ? "New quantity" : "Quantity"}>
          <input type="number" min={0} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value)))} className={input} />
        </Field>
        {mode !== "damaged" && mode !== "returned" && (
          <Field label="Warehouse">
            <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={input}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Reason / note">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. recount after audit" className={input} />
        </Field>
      </div>
      <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-muted-foreground">
        Current on hand: <span className="text-foreground font-medium">{product.stock}</span>
        {" · "}Reserved: <span className="text-foreground font-medium">{product.reserved ?? 0}</span>
      </div>
    </ModalShell>
  );
}

function BulkStockModal({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (mode: "set" | "add" | "sub", val: number) => void }) {
  const [mode, setMode] = useState<"set" | "add" | "sub">("add");
  const [val, setVal] = useState(10);
  return (
    <ModalShell open={open} onClose={onClose} title="Bulk update stock" maxWidth="max-w-md"
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={() => onApply(mode, val)}>Apply</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Action"><select value={mode} onChange={(e) => setMode(e.target.value as any)} className={input}>
          <option value="add">Add units</option><option value="sub">Subtract units</option><option value="set">Set exact</option>
        </select></Field>
        <Field label="Quantity"><input type="number" value={val} min={0} onChange={(e) => setVal(Math.max(0, Number(e.target.value)))} className={input} /></Field>
      </div>
    </ModalShell>
  );
}

function BulkWarehouseModal({ open, onClose, warehouses, onApply }: { open: boolean; onClose: () => void; warehouses: Warehouse[]; onApply: (id: string) => void }) {
  const [id, setId] = useState(warehouses[0]?.id ?? "");
  return (
    <ModalShell open={open} onClose={onClose} title="Assign warehouse" maxWidth="max-w-md"
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary} onClick={() => onApply(id)}>Assign</button></>}>
      <Field label="Warehouse">
        <select value={id} onChange={(e) => setId(e.target.value)} className={input}>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Field>
    </ModalShell>
  );
}

/* ============================================================
 * WAREHOUSES tab
 * ============================================================ */
function WarehousesTab() {
  const warehouses = useStoreData((s) => s.warehouses);
  const products = useStoreData((s) => s.products);
  const { addWarehouse, updateWarehouse, removeWarehouse, setDefaultWarehouse } = useStoreData.getState();
  const [editing, setEditing] = useState<Warehouse | "new" | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">Manage every physical or virtual stocking location.</p>
        <button className={cn(btnPrimary, "ml-auto flex items-center gap-2")} onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New warehouse
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((w) => {
          const units = products.reduce((n, p) => n + (p.stockByWarehouse?.[w.id] ?? (w.isDefault ? p.stock : 0)), 0);
          return (
            <div key={w.id} className="rounded-2xl glass-strong border border-white/[0.08] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0"><WarehouseIcon className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{w.name}</h3>
                    {w.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">Default</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">Code {w.code}</div>
                </div>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-md",
                  w.status === "Active" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-muted-foreground")}>{w.status}</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {w.location && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{w.location}</div>}
                {w.manager && <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />{w.manager}</div>}
              </div>
              <div className="pt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Units</div>
                  <div className="text-base font-medium">{units.toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <div className="text-[10px] uppercase text-muted-foreground">Capacity</div>
                  <div className="text-base font-medium">{w.capacity ? w.capacity.toLocaleString() : "—"}</div>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                {!w.isDefault && <button className="text-xs text-primary hover:underline" onClick={() => setDefaultWarehouse(w.id)}>Set default</button>}
                <button className="text-xs text-muted-foreground hover:text-foreground ml-auto" onClick={() => setEditing(w)}><Pencil className="h-3 w-3 inline mr-1" />Edit</button>
                {!w.isDefault && (
                  <button className="text-xs text-rose-300 hover:underline" onClick={() => {
                    if (confirm(`Delete warehouse ${w.name}?`)) { removeWarehouse(w.id); pushToast("info", "Warehouse deleted"); }
                  }}><Trash2 className="h-3 w-3 inline" /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <WarehouseModal open={editing !== null} initial={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(w) => {
          if (editing === "new" || editing === null) { addWarehouse(w); pushToast("success", "Warehouse created"); }
          else { updateWarehouse(editing.id, w); pushToast("success", "Warehouse updated"); }
          setEditing(null);
        }} />
    </div>
  );
}

function WarehouseModal({ open, initial, onClose, onSave }: {
  open: boolean; initial: Warehouse | null; onClose: () => void; onSave: (w: Partial<Warehouse>) => void;
}) {
  const [form, setForm] = useState<Partial<Warehouse>>({});
  useEffect(() => { setForm(initial ?? { name: "", code: "", location: "", manager: "", status: "Active" }); }, [initial, open]);
  const set = (k: keyof Warehouse, v: any) => setForm((s) => ({ ...s, [k]: v }));
  return (
    <ModalShell open={open} onClose={onClose} title={initial ? "Edit warehouse" : "New warehouse"} maxWidth="max-w-lg"
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form)} disabled={!form.name}>Save</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} className={input} /></Field>
        <Field label="Code"><input value={form.code ?? ""} onChange={(e) => set("code", e.target.value.toUpperCase())} className={input} placeholder="MAIN" /></Field>
        <Field label="Location"><input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} className={input} placeholder="City, country" /></Field>
        <Field label="Manager"><input value={form.manager ?? ""} onChange={(e) => set("manager", e.target.value)} className={input} /></Field>
        <Field label="Capacity"><input type="number" value={form.capacity ?? ""} onChange={(e) => set("capacity", Number(e.target.value) || undefined)} className={input} /></Field>
        <Field label="Status">
          <select value={form.status ?? "Active"} onChange={(e) => set("status", e.target.value)} className={input}>
            <option>Active</option><option>Inactive</option>
          </select>
        </Field>
      </div>
    </ModalShell>
  );
}

/* ============================================================
 * PURCHASE ORDERS tab
 * ============================================================ */
function PurchaseOrdersTab() {
  const [pos, setPos] = useState<FrappePurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const products = useStoreData((s) => s.products);
  const warehouses = useStoreData((s) => s.warehouses);
  const { addPurchaseOrder, updatePurchaseOrder, removePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder } = useStoreData.getState();
  const [editing, setEditing] = useState<PurchaseOrder | "new" | null>(null);
  const [status, setStatus] = useState("All");
  const [q, setQ] = useState("");
  const [selectedPO, setSelectedPO] = useState<FrappePurchaseOrder | null>(null);
  // const [status, setStatus] = useState<"All" | PurchaseOrderStatus>("All");

//   const rows = pos.filter((p) => {
//     if (status !== "All" && p.status !== status) return false;
//     if (q && !`${p.number} ${p.supplier}`.toLowerCase().includes(q.toLowerCase())) return false;
//     return true;
//   });

//   const totals = pos.reduce((n, p) => {
//     if (p.status === "Cancelled") return n;
//     return n + p.lines.reduce((a, l) => a + l.qty * l.cost, 0);
//   }, 0);

//   const stats: Stat[] = [
//     { label: "Purchase orders", value: String(pos.length) },
//     { label: "Draft", value: String(pos.filter((p) => p.status === "Draft").length) },
//     { label: "Open", value: String(pos.filter((p) => p.status === "Ordered" || p.status === "Partially received").length) },
//     { label: "Committed spend", value: money(totals) },
//   ];

//   return (
//     <div className="space-y-4">
//       <StatsRow stats={stats} />
//       <div className="flex flex-wrap gap-2 items-center">
//         <div className="relative flex-1 min-w-[220px] max-w-md">
//           <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
//           <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search PO number or supplier…" className="h-10 w-full pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none" />
//         </div>
//         <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
//           <option>All</option><option>Draft</option><option>Ordered</option><option>Partially received</option><option>Received</option><option>Cancelled</option>
//         </select>
//         <button className={cn(btnPrimary, "ml-auto flex items-center gap-2")} onClick={() => setEditing("new")}>
//           <Plus className="h-4 w-4" /> New purchase order
//         </button>
//       </div>

//       <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm min-w-[800px]">
//             <thead>
//               <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
//                 <th className="text-left px-4 py-3 font-medium">PO #</th>
//                 <th className="text-left px-3 py-3 font-medium">Supplier</th>
//                 <th className="text-left px-3 py-3 font-medium">Warehouse</th>
//                 <th className="text-right px-3 py-3 font-medium">Items</th>
//                 <th className="text-right px-3 py-3 font-medium">Total</th>
//                 <th className="text-left px-3 py-3 font-medium">Expected</th>
//                 <th className="text-left px-3 py-3 font-medium">Status</th>
//                 <th className="text-right px-3 py-3 pr-4 font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map((po) => {
//                 const total = po.lines.reduce((s, l) => s + l.qty * l.cost, 0);
//                 const wh = warehouses.find((w) => w.id === po.warehouseId);
//                 return (
//                   <tr key={po.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
//                     <td className="px-4 py-2.5 font-medium">{po.number}</td>
//                     <td className="px-3 py-2.5">{po.supplier}</td>
//                     <td className="px-3 py-2.5 text-muted-foreground">{wh?.name ?? "—"}</td>
//                     <td className="px-3 py-2.5 text-right">{po.lines.reduce((s, l) => s + l.qty, 0)}</td>
//                     <td className="px-3 py-2.5 text-right">{money(total)}</td>
//                     <td className="px-3 py-2.5 text-muted-foreground">{dt(po.expectedDate)}</td>
//                     <td className="px-3 py-2.5"><POStatus s={po.status} /></td>
//                     <td className="px-3 py-2.5 pr-4 text-right space-x-1">
//                       {po.status !== "Received" && po.status !== "Cancelled" && (
//                         <button className="h-7 px-2 rounded-md bg-emerald-500/15 text-emerald-300 text-xs hover:bg-emerald-500/25" onClick={() => {
//                           receivePurchaseOrder(po.id); pushToast("success", `Received ${po.number}`);
//                         }}><PackageCheck className="h-3 w-3 inline mr-1" />Receive</button>
//                       )}
//                       <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs" onClick={() => setEditing(po)}>
//                         <Pencil className="h-3 w-3 inline" />
//                       </button>
//                       {po.status !== "Cancelled" && po.status !== "Received" && (
//                         <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs" onClick={() => { cancelPurchaseOrder(po.id); pushToast("info", "PO cancelled"); }}>
//                           <Ban className="h-3 w-3 inline" />
//                         </button>
//                       )}
//                       <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs text-rose-300" onClick={() => { if (confirm("Delete PO?")) removePurchaseOrder(po.id); }}>
//                         <Trash2 className="h-3 w-3 inline" />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No purchase orders.</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <PurchaseOrderModal open={editing !== null} initial={editing === "new" ? null : editing}
//         products={products} warehouses={warehouses} onClose={() => setEditing(null)}
//         onSave={(po) => {
//           if (editing === "new" || editing === null) { const created = addPurchaseOrder(po); pushToast("success", `Created ${created.number}`); }
//           else { updatePurchaseOrder(editing.id, po); pushToast("success", "PO updated"); }
//           setEditing(null);
//         }} />
//     </div>
//   );
// }

// const POStatusColor: Record<PurchaseOrderStatus, string> = {
//   Draft: "bg-white/10 text-muted-foreground",
//   Ordered: "bg-sky-500/15 text-sky-300 border border-sky-500/30",
//   "Partially received": "bg-amber-500/15 text-amber-300 border border-amber-500/30",
//   Received: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
//   Cancelled: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
// };
// function POStatus({ s }: { s: PurchaseOrderStatus }) {
//   return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", POStatusColor[s])}>{s}</span>;
// }

// function PurchaseOrderModal({ open, initial, products, warehouses, onClose, onSave }: {
//   open: boolean; initial: PurchaseOrder | null; products: Product[]; warehouses: Warehouse[];
//   onClose: () => void; onSave: (po: Partial<PurchaseOrder>) => void;
// }) {
//   const [form, setForm] = useState<Partial<PurchaseOrder>>({});
//   useEffect(() => {
//     setForm(initial ?? {
//       supplier: "", supplierEmail: "",
//       warehouseId: warehouses.find((w) => w.isDefault)?.id ?? warehouses[0]?.id,
//       status: "Draft", lines: [],
//     });
//   }, [initial, open, warehouses]);
//   const set = (k: keyof PurchaseOrder, v: any) => setForm((s) => ({ ...s, [k]: v }));
//   const lines = form.lines ?? [];
//   const total = lines.reduce((s, l) => s + l.qty * l.cost, 0);

//   return (
//     <ModalShell open={open} onClose={onClose} title={initial ? `Edit ${initial.number}` : "New purchase order"} maxWidth="max-w-3xl"
//       footer={<><button className={btnGhost} onClick={onClose}>Cancel</button>
//         <button className={btnPrimary} onClick={() => onSave(form)} disabled={!form.supplier || !lines.length}>Save</button></>}>
//       <div className="grid grid-cols-2 gap-3">
//         <Field label="Supplier"><input value={form.supplier ?? ""} onChange={(e) => set("supplier", e.target.value)} className={input} /></Field>
//         <Field label="Supplier email"><input value={form.supplierEmail ?? ""} onChange={(e) => set("supplierEmail", e.target.value)} className={input} type="email" /></Field>
//         <Field label="Warehouse"><select value={form.warehouseId} onChange={(e) => set("warehouseId", e.target.value)} className={input}>
//           {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
//         </select></Field>
//         <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
//           <option>Draft</option><option>Ordered</option>
//         </select></Field>
//         <Field label="Expected date"><input type="date"
//           value={form.expectedDate ? new Date(form.expectedDate).toISOString().slice(0, 10) : ""}
//           onChange={(e) => set("expectedDate", e.target.value ? new Date(e.target.value).getTime() : undefined)} className={input} /></Field>
//         <Field label="Notes"><input value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className={input} /></Field>
//       </div>

//       <div className="mt-4 space-y-2">
//         <div className="flex items-center justify-between">
//           <h4 className="text-sm font-medium">Line items</h4>
//           <button className={cn(btnGhost, "flex items-center gap-1.5")} onClick={() => set("lines", [...lines, { productId: products[0]?.id ?? "", qty: 1, cost: products[0]?.costPerItem ?? 0 }])}>
//             <Plus className="h-3.5 w-3.5" /> Add item
//           </button>
//         </div>
//         <div className="rounded-xl border border-white/[0.06] overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
//               <tr className="border-b border-white/[0.06]">
//                 <th className="text-left px-3 py-2 font-medium">Product</th>
//                 <th className="text-right px-3 py-2 w-24 font-medium">Qty</th>
//                 <th className="text-right px-3 py-2 w-28 font-medium">Cost</th>
//                 <th className="text-right px-3 py-2 w-28 font-medium">Total</th>
//                 <th className="w-10"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {lines.map((l, i) => (
//                 <tr key={i} className="border-b border-white/[0.04]">
//                   <td className="px-3 py-1.5">
//                     <select className={input} value={l.productId} onChange={(e) => {
//                       const p = products.find((x) => x.id === e.target.value);
//                       const next = [...lines]; next[i] = { ...l, productId: e.target.value, cost: p?.costPerItem ?? l.cost }; set("lines", next);
//                     }}>
//                       {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
//                     </select>
//                   </td>
//                   <td className="px-3 py-1.5 text-right">
//                     <input type="number" min={1} value={l.qty} onChange={(e) => { const next = [...lines]; next[i] = { ...l, qty: Math.max(1, Number(e.target.value)) }; set("lines", next); }}
//                       className={cn(input, "text-right")} />
//                   </td>
//                   <td className="px-3 py-1.5 text-right">
//                     <input type="number" min={0} step="0.01" value={l.cost} onChange={(e) => { const next = [...lines]; next[i] = { ...l, cost: Math.max(0, Number(e.target.value)) }; set("lines", next); }}
//                       className={cn(input, "text-right")} />
//                   </td>
//                   <td className="px-3 py-1.5 text-right text-muted-foreground">{money(l.qty * l.cost)}</td>
//                   <td className="text-center">
//                     <button onClick={() => { const next = lines.filter((_, j) => j !== i); set("lines", next); }} className="h-7 w-7 rounded-md hover:bg-rose-500/15 text-rose-300 grid place-items-center">
//                       <X className="h-3.5 w-3.5" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//               {!lines.length && <tr><td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">No line items yet.</td></tr>}
//             </tbody>
//           </table>
//         </div>
//         <div className="text-right text-sm">Total: <span className="font-medium">{money(total)}</span></div>
//       </div>
//     </ModalShell>
//   );
// }

const POStatusColor: Record<string, string> = {
  Draft: "bg-white/10 text-muted-foreground",

  "To Receive and Bill":
    "bg-sky-500/15 text-sky-300 border border-sky-500/30",

  "To Receive":
    "bg-sky-500/15 text-sky-300 border border-sky-500/30",

  "To Bill":
    "bg-amber-500/15 text-amber-300 border border-amber-500/30",

  Completed:
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",

  Cancelled:
    "bg-rose-500/15 text-rose-300 border border-rose-500/30",

  Closed:
    "bg-rose-500/15 text-rose-300 border border-rose-500/30",

  "On Hold":
    "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};

function POStatus({ s }: { s?: string }) {
  const status = s || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        POStatusColor[status] ||
          "bg-white/10 text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}



const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getPurchaseOrders();

      setPos(data);
    } catch (err: any) {
      console.error("Failed to load Purchase Orders:", err);

      setError(
        err?.response?.data?.exception ||
          err?.response?.data?.message ||
          "Failed to load Purchase Orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const statuses = Array.from(
    new Set(
      pos
        .map((po) => po.status)
        .filter(Boolean)
    )
  );

  const rows = pos.filter((po) => {
    if (status !== "All" && po.status !== status) {
      return false;
    }

    if (q) {
      const search = q.toLowerCase();

      const searchable = [
        po.name,
        po.supplier,
        po.supplier_name,
        po.company,
        po.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const totalSpend = pos.reduce(
    (sum, po) => sum + Number(po.grand_total ?? po.total ?? 0),
    0
  );

  const draftCount = pos.filter(
    (po) => po.status === "Draft"
  ).length;

  const openCount = pos.filter(
    (po) =>
      po.status === "To Receive and Bill" ||
      po.status === "To Receive" ||
      po.status === "To Bill" ||
      po.status === "Partially Received"
  ).length;

  const stats: Stat[] = [
    {
      label: "Purchase orders",
      value: String(pos.length),
    },
    {
      label: "Draft",
      value: String(draftCount),
    },
    {
      label: "Open",
      value: String(openCount),
    },
    {
      label: "Committed spend",
      value: money(totalSpend),
    },
  ];


function formatFrappeDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}



  return (
    <div className="space-y-5">

      <StatsRow stats={stats} />

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">

        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search PO number or supplier…"
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm"
        >
          <option value="All">All statuses</option>

          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          className={cn(
            btnGhost,
            "flex items-center gap-2"
          )}
          onClick={loadPurchaseOrders}
        >
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full text-sm min-w-[1100px]">

            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">

                <th className="text-left px-4 py-3 font-medium">
                  PO #
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Supplier
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Company
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Transaction Date
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Schedule Date
                </th>

                <th className="text-right px-3 py-3 font-medium">
                  Qty
                </th>

                <th className="text-right px-3 py-3 font-medium">
                  Net Total
                </th>

                <th className="text-right px-3 py-3 font-medium">
                  Grand Total
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Currency
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Status
                </th>

                <th className="text-right px-3 py-3 pr-4 font-medium">
                  Actions
                </th>

              </tr>
            </thead>

            <tbody>

              {loading && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Loading Purchase Orders…
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((po) => (
                  <tr
                    key={po.name}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03]"
                  >

                    <td className="px-4 py-2.5 font-medium">
                      {po.name}
                    </td>

                    <td className="px-3 py-2.5">
                      {po.supplier_name || po.supplier || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-muted-foreground">
                      {po.company || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatFrappeDate(po.transaction_date)}
                    </td>

                    <td className="px-3 py-2.5 text-muted-foreground">
                     {formatFrappeDate(po.schedule_date)}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {po.total_qty ?? 0}
                    </td>

                    <td className="px-3 py-2.5 text-right">
                      {money(
                        Number(po.net_total ?? 0)
                      )}
                    </td>

                    <td className="px-3 py-2.5 text-right font-medium">
                      {money(
                        Number(
                          po.grand_total ??
                            po.total ??
                            0
                        )
                      )}
                    </td>

                    <td className="px-3 py-2.5">
                      {po.currency || "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      <POStatus
                        s={po.status || "Unknown"}
                      />
                    </td>

                    <td className="px-3 py-2.5 pr-4 text-right">

                      <button
                        className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs"
                        onClick={() => setSelectedPO(po)}
                      >
                        View
                      </button>

                    </td>

                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No purchase orders found.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Full Frappe PO Details */}
      {/* {selectedPO && (
        <PurchaseOrderDetails
          po={selectedPO}
          onClose={() => setSelectedPO(null)}
        />
      )} */}

    </div>
  );
}

/* ============================================================
 * TRANSFERS tab
 * ============================================================ */
function TransfersTab() {
  const transfers = useStoreData((s) => s.transfers);
  const warehouses = useStoreData((s) => s.warehouses);
  const products = useStoreData((s) => s.products);
  const { addStockTransfer, updateStockTransfer, removeStockTransfer, receiveStockTransfer, cancelStockTransfer } = useStoreData.getState();
  const [editing, setEditing] = useState<StockTransfer | "new" | null>(null);

  const stats: Stat[] = [
    { label: "Transfers", value: String(transfers.length) },
    { label: "In transit", value: String(transfers.filter((t) => t.status === "In transit").length) },
    { label: "Received", value: String(transfers.filter((t) => t.status === "Received").length) },
    { label: "Warehouses", value: String(warehouses.length) },
  ];

  return (
    <div className="space-y-4">
      <StatsRow stats={stats} />
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">Move stock between warehouses. Received transfers debit the source and credit the destination.</p>
        <button className={cn(btnPrimary, "ml-auto flex items-center gap-2")}
          disabled={warehouses.length < 2}
          onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> New transfer
        </button>
      </div>
      {warehouses.length < 2 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
          Add at least two warehouses to enable transfers.
        </div>
      )}

      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                <th className="text-left px-4 py-3 font-medium">Transfer #</th>
                <th className="text-left px-3 py-3 font-medium">From → To</th>
                <th className="text-right px-3 py-3 font-medium">Items</th>
                <th className="text-left px-3 py-3 font-medium">Created</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-right px-3 py-3 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const from = warehouses.find((w) => w.id === t.fromWarehouseId)?.name ?? "—";
                const to = warehouses.find((w) => w.id === t.toWarehouseId)?.name ?? "—";
                return (
                  <tr key={t.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-medium">{t.number}</td>
                    <td className="px-3 py-2.5">{from} <span className="text-muted-foreground">→</span> {to}</td>
                    <td className="px-3 py-2.5 text-right">{t.lines.reduce((s, l) => s + l.qty, 0)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{dt(t.createdAt)}</td>
                    <td className="px-3 py-2.5"><TransferStatus s={t.status} /></td>
                    <td className="px-3 py-2.5 pr-4 text-right space-x-1">
                      {t.status !== "Received" && t.status !== "Cancelled" && (
                        <button className="h-7 px-2 rounded-md bg-emerald-500/15 text-emerald-300 text-xs hover:bg-emerald-500/25" onClick={() => { receiveStockTransfer(t.id); pushToast("success", `Received ${t.number}`); }}>
                          <PackageCheck className="h-3 w-3 inline mr-1" />Receive
                        </button>
                      )}
                      <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs" onClick={() => setEditing(t)}><Pencil className="h-3 w-3 inline" /></button>
                      {t.status !== "Received" && t.status !== "Cancelled" && (
                        <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs" onClick={() => cancelStockTransfer(t.id)}><Ban className="h-3 w-3 inline" /></button>
                      )}
                      <button className="h-7 px-2 rounded-md glass hover:bg-white/10 text-xs text-rose-300" onClick={() => { if (confirm("Delete transfer?")) removeStockTransfer(t.id); }}>
                        <Trash2 className="h-3 w-3 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {transfers.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No transfers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <TransferModal open={editing !== null} initial={editing === "new" ? null : editing}
        products={products} warehouses={warehouses} onClose={() => setEditing(null)}
        onSave={(t) => {
          if (editing === "new" || editing === null) { const c = addStockTransfer(t); pushToast("success", `Created ${c.number}`); }
          else { updateStockTransfer(editing.id, t); pushToast("success", "Transfer updated"); }
          setEditing(null);
        }} />
    </div>
  );
}

const TransferStatusColor: Record<StockTransferStatus, string> = {
  Draft: "bg-white/10 text-muted-foreground",
  "In transit": "bg-sky-500/15 text-sky-300 border border-sky-500/30",
  Received: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Cancelled: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
};
function TransferStatus({ s }: { s: StockTransferStatus }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", TransferStatusColor[s])}>{s}</span>;
}

function TransferModal({ open, initial, products, warehouses, onClose, onSave }: {
  open: boolean; initial: StockTransfer | null; products: Product[]; warehouses: Warehouse[];
  onClose: () => void; onSave: (t: Partial<StockTransfer>) => void;
}) {
  const [form, setForm] = useState<Partial<StockTransfer>>({});
  useEffect(() => {
    setForm(initial ?? {
      fromWarehouseId: warehouses[0]?.id, toWarehouseId: warehouses[1]?.id ?? warehouses[0]?.id,
      lines: [], status: "Draft",
    });
  }, [initial, open, warehouses]);
  const set = (k: keyof StockTransfer, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const lines = form.lines ?? [];
  return (
    <ModalShell open={open} onClose={onClose} title={initial ? `Edit ${initial.number}` : "New transfer"} maxWidth="max-w-3xl"
      footer={<><button className={btnGhost} onClick={onClose}>Cancel</button>
        <button className={btnPrimary} onClick={() => onSave(form)} disabled={!lines.length || form.fromWarehouseId === form.toWarehouseId}>Save</button></>}>
      <div className="grid grid-cols-3 gap-3">
        <Field label="From"><select value={form.fromWarehouseId} onChange={(e) => set("fromWarehouseId", e.target.value)} className={input}>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select></Field>
        <Field label="To"><select value={form.toWarehouseId} onChange={(e) => set("toWarehouseId", e.target.value)} className={input}>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select></Field>
        <Field label="Status"><select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
          <option>Draft</option><option>In transit</option>
        </select></Field>
      </div>
      {form.fromWarehouseId === form.toWarehouseId && (
        <p className="text-xs text-rose-300 mt-2">Source and destination must differ.</p>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Items</h4>
          <button className={cn(btnGhost, "flex items-center gap-1.5")} onClick={() => set("lines", [...lines, { productId: products[0]?.id ?? "", qty: 1 }])}>
            <Plus className="h-3.5 w-3.5" /> Add item
          </button>
        </div>
        <div className="rounded-xl border border-white/[0.06]">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 p-2 border-b border-white/[0.04] last:border-0">
              <select className={cn(input, "flex-1")} value={l.productId} onChange={(e) => { const next = [...lines]; next[i] = { ...l, productId: e.target.value }; set("lines", next); }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min={1} value={l.qty} onChange={(e) => { const next = [...lines]; next[i] = { ...l, qty: Math.max(1, Number(e.target.value)) }; set("lines", next); }}
                className={cn(input, "w-24 text-right")} />
              <button onClick={() => set("lines", lines.filter((_, j) => j !== i))} className="h-9 w-9 rounded-md hover:bg-rose-500/15 text-rose-300 grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!lines.length && <div className="p-6 text-center text-xs text-muted-foreground">No items yet.</div>}
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================================================
 * MOVEMENTS tab
 * ============================================================ */
function MovementsTab() {
  const movements = useStoreData((s) => s.movements);
  const warehouses = useStoreData((s) => s.warehouses);
  const [q, setQ] = useState("");
  const [reason, setReason] = useState<"All" | MovementReason>("All");

  const rows = movements.filter((m) => {
    if (reason !== "All" && m.reason !== reason) return false;
    if (q && !`${m.productName} ${m.note ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }).slice(0, 500);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or note…"
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none" />
        </div>
        <select value={reason} onChange={(e) => setReason(e.target.value as any)} className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
          <option>All</option>
          {(Object.keys(REASON_LABEL) as MovementReason[]).map((r) => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
        </select>
        <button className={cn(btnGhost, "flex items-center gap-2")} onClick={() => downloadCSV("movements",
          [{ key: "at", label: "Time" }, { key: "product", label: "Product" }, { key: "reason", label: "Reason" }, { key: "delta", label: "Δ" }, { key: "after", label: "After" }, { key: "note", label: "Note" }],
          rows.map((m) => ({ at: new Date(m.at).toISOString(), product: m.productName, reason: REASON_LABEL[m.reason], delta: m.delta, after: m.after, note: m.note ?? "" })))}>
          <Download className="h-4 w-4" /> Export
        </button>
      </div>

      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-left px-3 py-3 font-medium">Product</th>
                <th className="text-left px-3 py-3 font-medium">Reason</th>
                <th className="text-left px-3 py-3 font-medium">Warehouse</th>
                <th className="text-right px-3 py-3 font-medium">Δ</th>
                <th className="text-right px-3 py-3 font-medium">Before → After</th>
                <th className="text-left px-3 py-3 pr-4 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const wh = warehouses.find((w) => w.id === m.warehouseId);
                const positive = m.delta >= 0;
                return (
                  <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{dtTime(m.at)}</td>
                    <td className="px-3 py-2.5">{m.productName}</td>
                    <td className="px-3 py-2.5"><span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10">{REASON_LABEL[m.reason]}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{wh?.name ?? "—"}</td>
                    <td className={cn("px-3 py-2.5 text-right font-medium", positive ? "text-emerald-300" : m.delta < 0 ? "text-rose-300" : "text-muted-foreground")}>
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </td>
                    <td className="px-3 py-2.5 text-right text-muted-foreground">{m.before} → {m.after}</td>
                    <td className="px-3 py-2.5 pr-4 text-muted-foreground truncate max-w-[220px]">{m.note ?? "—"}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No movements recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * REPORTS tab
 * ============================================================ */
function ReportsTab() {
  const products = useStoreData((s) => s.products);
  const orders = useStoreData((s) => s.orders);
  const warehouses = useStoreData((s) => s.warehouses);
  const pos = useStoreData((s) => s.purchaseOrders);
  const transfers = useStoreData((s) => s.transfers);
  const stats = useStoreStats();

  const bestSellers = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      if (o.status === "Cancelled" || o.status === "Refunded") continue;
      for (const i of o.items) {
        const cur = m.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.qty; cur.revenue += i.price * i.qty;
        m.set(i.productId, cur);
      }
    }
    return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [orders]);

  const lowRows = products.filter((p) => p.trackInventory !== false && p.stock <= (p.lowStockThreshold ?? 5)).slice(0, 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ReportCard label="Inventory value (cost)" value={money(stats.inventoryValue)} sub="Sum of cost × stock" />
        <ReportCard label="Retail value" value={money(stats.retailInventoryValue)} sub="Sum of price × stock" />
        <ReportCard label="SKUs tracked" value={String(products.filter((p) => p.trackInventory !== false).length)} sub={`${products.length} total`} />
      </div>

      <ReportSection title="Low & out of stock">
        {lowRows.length ? (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground"><tr>
              <th className="text-left py-2">Product</th><th className="text-right">On hand</th><th className="text-right">Threshold</th><th className="text-right">Status</th>
            </tr></thead>
            <tbody>
              {lowRows.map((p) => {
                const st = stockStatus(p);
                return <tr key={p.id} className="border-t border-white/[0.05]"><td className="py-2">{p.name}</td><td className="text-right">{p.stock}</td><td className="text-right text-muted-foreground">{p.lowStockThreshold ?? 5}</td><td className="text-right"><span className={cn("inline-flex px-2 py-0.5 rounded-md text-[11px]", st.tone)}>{st.label}</span></td></tr>;
              })}
            </tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground">No low stock — everything looks good.</p>}
      </ReportSection>

      <ReportSection title="Best-selling products">
        {bestSellers.length ? (
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground"><tr>
              <th className="text-left py-2">Product</th><th className="text-right">Units sold</th><th className="text-right">Revenue</th>
            </tr></thead>
            <tbody>
              {bestSellers.map((b, i) => (
                <tr key={i} className="border-t border-white/[0.05]"><td className="py-2">{b.name}</td><td className="text-right">{b.qty}</td><td className="text-right text-muted-foreground">{money(b.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-muted-foreground">No sales yet.</p>}
      </ReportSection>

      <div className="grid gap-4 md:grid-cols-2">
        <ReportSection title="Warehouses">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground"><tr>
              <th className="text-left py-2">Name</th><th className="text-right">Units</th><th className="text-right">Status</th>
            </tr></thead>
            <tbody>
              {warehouses.map((w) => {
                const units = products.reduce((n, p) => n + (p.stockByWarehouse?.[w.id] ?? (w.isDefault ? p.stock : 0)), 0);
                return <tr key={w.id} className="border-t border-white/[0.05]"><td className="py-2">{w.name}</td><td className="text-right">{units.toLocaleString()}</td><td className="text-right text-muted-foreground">{w.status}</td></tr>;
              })}
            </tbody>
          </table>
        </ReportSection>
        <ReportSection title="Open purchase orders & transfers">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[11px] uppercase text-muted-foreground">Purchase orders open</div>
              <div className="text-lg font-medium mt-1">{pos.filter((p) => p.status === "Ordered" || p.status === "Partially received").length}</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3">
              <div className="text-[11px] uppercase text-muted-foreground">Transfers in transit</div>
              <div className="text-lg font-medium mt-1">{transfers.filter((t) => t.status === "In transit").length}</div>
            </div>
          </div>
        </ReportSection>
      </div>
    </div>
  );
}

function ReportCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="text-2xl font-medium mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}

