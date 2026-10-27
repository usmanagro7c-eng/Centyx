import { AnimatePresence, motion } from "motion/react";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, Upload, Trash2, ImagePlus, Star, Package, ShoppingCart, Users, FolderTree, Layers, Boxes, Image as ImageIcon, Archive, ArchiveRestore, ArrowUpDown, Filter as FilterIcon, MoreHorizontal, Eye, Copy, Pencil, Plus, GripVertical, Images, Search as SearchIcon, Folder as FolderIcon, FolderPlus, Download, Link as LinkIcon, Grid as GridIcon, List as ListIcon, Tag as TagIcon, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FloatingLayer } from "@/components/ui/floating-menu";
import { findItem } from "@/components/dashboard/nav-config";
import { useStoreData, type Product, type ProductOption, type ProductVariant, type Category, type Collection, type Order, type Customer, type CustomerType, type CustomerStatus, type MediaAsset, type MediaFolder } from "@/lib/store-data-store";
import { openMediaPicker, openImagePicker, uploadFilesToLibrary, fmtBytes, kindOfFile, MediaThumb, UploadQueueBar } from "@/components/media/media-picker";
import { useSiteStore } from "@/lib/site-store";
import {
  Breadcrumb, PageHeader, StatsRow, Toolbar, DataTable, Pagination, EmptyState,
  StatusPill, DetailDrawer, downloadCSV, pushToast, ToastHost,
  type Stat, type Column, type Row,
} from "@/routes/dashboard.$";
import { useProducts, useCategories, useCollections, useAllInventory, useDeleteProduct, useItemGroups } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";

/* ============================================================
 * Small utils
 * ============================================================ */
const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const dt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

function InlineActionMenu({ items }: { items: { label: string; onClick: () => void; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={btnRef} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="h-7 w-7 grid place-items-center rounded hover:bg-white/10">
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      <FloatingLayer open={open} onClose={() => setOpen(false)} anchorRef={btnRef} align="end" minWidth={160} className="p-1">
        {items.map((it) => (
          <button key={it.label} onClick={() => { setOpen(false); it.onClick(); }}
            className={cn("w-full text-left text-xs px-2 py-1.5 rounded transition",
              it.danger ? "hover:bg-rose-500/10 text-rose-300" : "hover:bg-white/10")}>
            {it.label}
          </button>
        ))}
      </FloatingLayer>
    </>
  );
}

const readAsDataURL = (file: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onerror = rej;
  r.onload = () => res(String(r.result));
  r.readAsDataURL(file);
});
function usePaged<T>(rows: T[], perPage = 8) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [rows.length]);
  const pages = Math.max(1, Math.ceil(rows.length / perPage));
  const paged = rows.slice((page - 1) * perPage, page * perPage);
  return { page, pages, paged, setPage };
}
function useFiltered<T extends Record<string, any>>(rows: T[], query: string, active: string, keys: string[]) {
  return useMemo(() => {
    const q = query.toLowerCase().trim();
    return rows.filter((r) => {
      if (active && active !== "All") {
        const hay = keys.map((k) => String(r[k] ?? "")).join(" ").toLowerCase();
        if (!hay.includes(active.toLowerCase())) return false;
      }
      if (!q) return true;
      return keys.some((k) => String(r[k] ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, active, keys.join(",")]);
}

/* ============================================================
 * Reusable modal shell
 * ============================================================ */
function ModalShell({ open, onClose, title, sub, children, footer, maxWidth = "max-w-2xl" }: {
  open: boolean; onClose: () => void; title: string; sub?: string;
  children: React.ReactNode; footer?: React.ReactNode; maxWidth?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className={cn("pointer-events-auto w-full glass-strong border border-white/10 rounded-2xl shadow-glow overflow-hidden flex flex-col max-h-[90vh]", maxWidth)}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
                <div>
                  {sub && <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{sub}</div>}
                  <div className="font-display text-lg font-semibold mt-0.5">{title}</div>
                </div>
                <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
              {footer && <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06] shrink-0">{footer}</div>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: 1 | 2 }) {
  return (
    <label className={cn("block", span === 2 && "sm:col-span-2")}>
      <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:bg-white/[0.05] focus:shadow-glow transition";
const areaCls = "w-full min-h-[92px] p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:bg-white/[0.05] focus:shadow-glow transition";

/* ============================================================
 * Multi-image uploader (drag & drop, sort, delete, alt text)
 * ============================================================ */
function ImagesUploader({ value, onChange }: { value: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const filtered = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!filtered.length) return;
    const added = await uploadFilesToLibrary(filtered);
    if (added.length) onChange([...value, ...added.map((a) => a.url)]);
  };
  const browse = async () => {
    const chosen = await openMediaPicker({ multiple: true, kind: "image", title: "Choose images" });
    if (chosen?.length) onChange([...value, ...chosen.map((a) => a.url)]);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = value.slice();
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange(next);
  };
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn("cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
          drag ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]")}
      >
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <div className="mt-2 text-xs text-muted-foreground">Drag & drop images or click to upload</div>
        <button type="button" onClick={(e) => { e.stopPropagation(); browse(); }}
          className="mt-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg glass border border-white/10 text-[11px] hover:bg-white/10">
          <Images className="h-3 w-3" /> Choose from library
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      {value.length > 0 && (
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {value.map((src, i) => (
            <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/20">
              <img src={src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full text-[9px] font-medium bg-primary/80 text-primary-foreground">
                  <Star className="h-2.5 w-2.5" /> Main
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button type="button" onClick={() => move(i, i - 1)} className="h-6 w-6 rounded bg-white/10 text-white text-xs">←</button>
                <button type="button" onClick={() => move(i, i + 1)} className="h-6 w-6 rounded bg-white/10 text-white text-xs">→</button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="h-6 w-6 rounded bg-rose-500/80 text-white grid place-items-center">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * PRODUCTS — Shopify-level management
 * ============================================================ */

const STATUS_UI: Record<Product["status"], string> = { Published: "Active", Draft: "Draft", Archived: "Archived" };
const uidLocal = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function calcProfit(price: number, cost?: number) {
  const p = price || 0, c = cost || 0;
  const profit = p - c;
  const margin = p > 0 ? (profit / p) * 100 : 0;
  return { profit, margin };
}
function totalStock(p: Product) {
  if (p.variants?.length) return p.variants.reduce((n, v) => n + (v.stock ?? 0), 0);
  return p.stock ?? 0;
}
function stockBadge(p: Product): { label: string; tone: string } {
  if (p.trackInventory === false) return { label: "Untracked", tone: "bg-white/[0.06] text-muted-foreground" };
  const s = totalStock(p);
  const low = p.lowStockThreshold ?? 5;
  if (s === 0) return { label: "Out of stock", tone: "bg-rose-400/10 text-rose-300" };
  if (s <= low) return { label: `Low · ${s}`, tone: "bg-orange-400/10 text-orange-300" };
  return { label: `${s} in stock`, tone: "bg-emerald-400/10 text-emerald-300" };
}
function cartesian(options: ProductOption[]): Record<string, string>[] {
  let out: Record<string, string>[] = [{}];
  for (const opt of options) {
    if (!opt.values.length) continue;
    const next: Record<string, string>[] = [];
    for (const c of out) for (const v of opt.values) next.push({ ...c, [opt.name]: v });
    out = next;
  }
  return out;
}
function generateVariants(options: ProductOption[], existing: ProductVariant[]): ProductVariant[] {
  const combos = cartesian(options.filter((o) => o.name.trim() && o.values.length));
  if (!combos.length || (combos.length === 1 && Object.keys(combos[0]).length === 0)) return [];
  const keyOf = (opts: Record<string, string>) =>
    Object.entries(opts).map(([k, v]) => `${k}:${v}`).sort().join("|");
  const map = new Map(existing.map((v) => [keyOf(v.options), v]));
  return combos.map((c) => map.get(keyOf(c)) ?? { id: uidLocal("var"), options: c, sku: "", stock: 0 });
}

/* ------------ Enhanced multi-image with alt text ------------- */
function ProductMedia({ images, alts, onChange }: {
  images: string[]; alts: string[];
  onChange: (imgs: string[], alts: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const filtered = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!filtered.length) return;
    const added = await uploadFilesToLibrary(filtered);
    if (added.length) onChange([...images, ...added.map((a) => a.url)], [...alts, ...added.map((a) => a.alt ?? "")]);
  };
  const browse = async () => {
    const chosen = await openMediaPicker({ multiple: true, kind: "image", title: "Choose product images" });
    if (chosen?.length) onChange([...images, ...chosen.map((a) => a.url)], [...alts, ...chosen.map((a) => a.alt ?? "")]);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const img = images.slice(); const alt = alts.slice();
    const [ix] = img.splice(from, 1); img.splice(to, 0, ix);
    const [ax] = alt.splice(from, 1); alt.splice(to, 0, ax);
    onChange(img, alt);
  };
  const remove = (i: number) => onChange(images.filter((_, j) => j !== i), alts.filter((_, j) => j !== i));
  const setAlt = (i: number, v: string) => onChange(images, alts.map((a, j) => j === i ? v : a));
  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn("cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition",
          drag ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]")}
      >
        <ImagePlus className="mx-auto h-6 w-6 text-muted-foreground" />
        <div className="mt-2 text-xs text-muted-foreground">Drop images or click to upload · first image is featured</div>
        <button type="button" onClick={(e) => { e.stopPropagation(); browse(); }}
          className="mt-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-lg glass border border-white/10 text-[11px] hover:bg-white/10">
          <Images className="h-3 w-3" /> Choose from library
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIndex !== null && dragIndex !== i) move(dragIndex, i); setDragIndex(null); }}
              className="group relative rounded-lg overflow-hidden border border-white/10 bg-black/20"
            >
              <div className="relative aspect-square">
                <img src={src} alt={alts[i] ?? ""} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 h-4 px-1.5 rounded-full text-[9px] font-medium bg-primary/80 text-primary-foreground">
                    <Star className="h-2.5 w-2.5" /> Featured
                  </span>
                )}
                <span className="absolute top-1 right-1 h-5 w-5 rounded bg-black/40 text-white grid place-items-center opacity-0 group-hover:opacity-100 cursor-grab">
                  <GripVertical className="h-3 w-3" />
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-1 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => move(i, i - 1)} className="h-6 w-6 rounded bg-white/10 text-white text-xs">←</button>
                  <button type="button" onClick={() => move(i, i + 1)} className="h-6 w-6 rounded bg-white/10 text-white text-xs">→</button>
                  {i !== 0 && (
                    <button type="button" onClick={() => { const img = [src, ...images.filter((_, j) => j !== i)]; const alt = [alts[i] ?? "", ...alts.filter((_, j) => j !== i)]; onChange(img, alt); }}
                      className="h-6 px-2 rounded bg-primary/80 text-primary-foreground text-[10px]">Set featured</button>
                  )}
                  <button type="button" onClick={() => remove(i)} className="h-6 w-6 rounded bg-rose-500/80 text-white grid place-items-center">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <input
                value={alts[i] ?? ""}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Alt text (accessibility & SEO)"
                className="w-full h-8 px-2 text-[11px] bg-white/[0.03] border-t border-white/10 outline-none focus:bg-white/[0.06]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------ Variant editor ------------- */
function VariantsEditor({ options, variants, onChange }: {
  options: ProductOption[]; variants: ProductVariant[];
  onChange: (opts: ProductOption[], vars: ProductVariant[]) => void;
}) {
  const addOption = () => {
    const next = [...options, { name: "", values: [] }];
    onChange(next, variants);
  };
  const updateOption = (i: number, patch: Partial<ProductOption>) => {
    const next = options.map((o, j) => j === i ? { ...o, ...patch } : o);
    onChange(next, generateVariants(next, variants));
  };
  const removeOption = (i: number) => {
    const next = options.filter((_, j) => j !== i);
    onChange(next, generateVariants(next, variants));
  };
  const addValue = (i: number, v: string) => {
    if (!v.trim()) return;
    const opt = options[i]; if (opt.values.includes(v)) return;
    updateOption(i, { values: [...opt.values, v.trim()] });
  };
  const removeValue = (i: number, v: string) => {
    updateOption(i, { values: options[i].values.filter((x) => x !== v) });
  };
  const setVariant = (id: string, patch: Partial<ProductVariant>) =>
    onChange(options, variants.map((v) => v.id === id ? { ...v, ...patch } : v));
  const uploadVariantImage = async (id: string, file?: File) => {
    if (!file) return;
    setVariant(id, { image: await readAsDataURL(file) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {options.map((opt, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2 mb-2">
              <input className={cn(inputCls, "h-8 flex-1")} placeholder="Option name (e.g. Color, Size)"
                value={opt.name} onChange={(e) => updateOption(i, { name: e.target.value })} />
              <button type="button" onClick={() => removeOption(i)}
                className="h-8 w-8 rounded-lg glass hover:bg-rose-500/10 hover:text-rose-300 grid place-items-center">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {opt.values.map((v) => (
                <span key={v} className="inline-flex items-center gap-1 h-7 pl-2 pr-1 rounded-full bg-white/[0.06] text-xs">
                  {v}
                  <button type="button" onClick={() => removeValue(i, v)} className="h-5 w-5 grid place-items-center rounded-full hover:bg-rose-500/20">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                placeholder="Add value + Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addValue(i, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }
                }}
                className="h-7 min-w-[8rem] flex-1 px-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs outline-none focus:border-primary/40"
              />
            </div>
          </div>
        ))}
        <button type="button" onClick={addOption} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add option
        </button>
      </div>

      {variants.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 border-b border-white/[0.06] bg-white/[0.03]">
            {variants.length} variant{variants.length === 1 ? "" : "s"}
          </div>
          <div className="max-h-[280px] overflow-y-auto divide-y divide-white/[0.04]">
            {variants.map((v) => (
              <div key={v.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-xs">
                <label className="col-span-2 relative h-12 w-12 rounded-lg overflow-hidden border border-white/10 bg-black/20 cursor-pointer grid place-items-center">
                  {v.image ? <img src={v.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-muted-foreground" />}
                  <input type="file" accept="image/*" hidden onChange={(e) => uploadVariantImage(v.id, e.target.files?.[0])} />
                </label>
                <div className="col-span-4 min-w-0">
                  <div className="truncate font-medium">{Object.values(v.options).join(" / ")}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{Object.entries(v.options).map(([k, x]) => `${k}: ${x}`).join(" · ")}</div>
                </div>
                <input className={cn(inputCls, "col-span-2 h-8")} placeholder="SKU" value={v.sku ?? ""} onChange={(e) => setVariant(v.id, { sku: e.target.value })} />
                <input type="number" step="0.01" className={cn(inputCls, "col-span-2 h-8")} placeholder="Price" value={v.price ?? ""} onChange={(e) => setVariant(v.id, { price: e.target.value === "" ? undefined : Number(e.target.value) })} />
                <input type="number" className={cn(inputCls, "col-span-2 h-8")} placeholder="Stock" value={v.stock ?? 0} onChange={(e) => setVariant(v.id, { stock: Number(e.target.value) })} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------ Product editor (tabbed) ------------- */
type TabKey = "general" | "media" | "pricing" | "variants" | "inventory" | "shipping" | "seo" | "org";
const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "general", label: "General", icon: Package },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "pricing", label: "Pricing", icon: Star },
  { key: "variants", label: "Variants", icon: Layers },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "shipping", label: "Shipping", icon: ShoppingCart },
  { key: "seo", label: "SEO", icon: FolderTree },
  { key: "org", label: "Organization", icon: FolderTree },
];

function emptyProduct(): Partial<Product> {
  return { name: "", price: 0, stock: 0, status: "Draft", images: [], imageAlts: [], tags: [], trackInventory: true, taxable: true, requiresShipping: true, isDigital: false, category: "", options: [], variants: [], lowStockThreshold: 5, continueSellingWhenOutOfStock: false };
}

function ProductEditor({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial: Partial<Product> | null;
  onSave: (p: Partial<Product>) => void;
}) {
  const categories = useStoreData((s) => s.categories);
  const collections = useStoreData((s) => s.collections);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [tab, setTab] = useState<TabKey>("general");
  const [tagsText, setTagsText] = useState("");
  useEffect(() => {
    if (!open) return;
    const seed = { ...emptyProduct(), ...(initial ?? {}) };
    if (!seed.imageAlts || seed.imageAlts.length !== (seed.images ?? []).length) {
      seed.imageAlts = (seed.images ?? []).map((_, i) => seed.imageAlts?.[i] ?? "");
    }
    setForm(seed);
    setTagsText((seed.tags ?? []).join(", "));
    setTab("general");
  }, [open, initial]);
  const set = (patch: Partial<Product>) => setForm((f) => ({ ...f, ...patch }));

  const { profit, margin } = calcProfit(form.price ?? 0, form.costPerItem);

  const submit = () => {
    if (!form.name?.trim()) { pushToast("error", "Product name is required"); setTab("general"); return; }
    onSave({ ...form, tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean) });
  };

  const CollectionsMulti = (
    <div className="rounded-xl border border-white/10 max-h-40 overflow-auto divide-y divide-white/5">
      {collections.length === 0 && <div className="p-3 text-xs text-muted-foreground">No collections yet.</div>}
      {collections.map((c) => {
        const checked = (form.collectionIds ?? []).includes(c.id);
        return (
          <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/[0.03] cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => {
              const cur = form.collectionIds ?? [];
              set({ collectionIds: e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id) });
            }} />
            <span className="truncate">{c.name}</span>
          </label>
        );
      })}
    </div>
  );

  const previewUrl = `/site/store/product/${form.handle || (form.name ? form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "your-product")}`;

  return (
    <ModalShell open={open} onClose={onClose} title={initial?.id ? "Edit product" : "New product"}
      sub={initial?.id ? "Product · " + (initial.sku ?? "") : "Product"} maxWidth="max-w-5xl"
      footer={<>
        {initial?.id && form.status !== "Archived" && (
          <button onClick={() => { set({ status: "Archived" }); pushToast("info", "Product will be archived on save"); }}
            className="mr-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
        )}
        {initial?.id && form.status === "Archived" && (
          <button onClick={() => set({ status: "Draft" })}
            className="mr-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">
            <ArchiveRestore className="h-3.5 w-3.5" /> Restore
          </button>
        )}
        <button onClick={onClose} className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
        <button onClick={() => { set({ status: "Draft" }); setTimeout(submit, 0); }}
          className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Save as draft</button>
        <button onClick={() => { set({ status: "Published" }); setTimeout(submit, 0); }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
          <Check className="h-3.5 w-3.5" /> {initial?.id ? "Save & publish" : "Create & publish"}
        </button>
      </>}
    >
      <div className="grid md:grid-cols-[180px_1fr] gap-5 -m-1">
        {/* Tabs */}
        <nav className="md:sticky md:top-0 md:self-start flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 inline-flex items-center gap-2 h-9 px-3 rounded-xl text-xs transition text-left",
                tab === t.key ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}>
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === "general" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Product name" span={2}>
                <input className={inputCls} value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Runner Pro Knit" />
              </Field>
              <Field label="Short description" span={2}>
                <input className={inputCls} value={form.shortDescription ?? ""} onChange={(e) => set({ shortDescription: e.target.value })} />
              </Field>
              <Field label="Full description (supports plain text / markdown-lite)" span={2}>
                <textarea className={cn(areaCls, "min-h-[160px]")} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} />
              </Field>
              <Field label="Status">
                <select className={inputCls} value={form.status ?? "Draft"} onChange={(e) => set({ status: e.target.value as Product["status"] })}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </Field>
              <Field label="Featured on homepage">
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={!!form.featured} onChange={(e) => set({ featured: e.target.checked })} />
                  <span>Show in Featured Products</span>
                </label>
              </Field>
            </div>
          )}

          {tab === "media" && (
            <ProductMedia
              images={form.images ?? []}
              alts={form.imageAlts ?? []}
              onChange={(images, imageAlts) => set({ images, imageAlts })}
            />
          )}

          {tab === "pricing" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Price">
                <input type="number" step="0.01" className={inputCls} value={form.price ?? 0} onChange={(e) => set({ price: Number(e.target.value) })} />
              </Field>
              <Field label="Compare at price (was)">
                <input type="number" step="0.01" className={inputCls} value={form.compareAtPrice ?? ""}
                  onChange={(e) => set({ compareAtPrice: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </Field>
              <Field label="Cost per item">
                <input type="number" step="0.01" className={inputCls} value={form.costPerItem ?? ""}
                  onChange={(e) => set({ costPerItem: e.target.value === "" ? undefined : Number(e.target.value) })} />
              </Field>
              <Field label="Charge tax">
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={form.taxable !== false} onChange={(e) => set({ taxable: e.target.checked })} />
                  <span>Taxable product</span>
                </label>
              </Field>
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Profit</div>
                  <div className="mt-1 font-display text-xl">{money(profit)}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Margin</div>
                  <div className="mt-1 font-display text-xl">{margin.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {tab === "variants" && (
            <VariantsEditor
              options={form.options ?? []}
              variants={form.variants ?? []}
              onChange={(options, variants) => set({ options, variants })}
            />
          )}

          {tab === "inventory" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="SKU"><input className={inputCls} value={form.sku ?? ""} onChange={(e) => set({ sku: e.target.value })} /></Field>
              <Field label="Barcode"><input className={inputCls} value={form.barcode ?? ""} onChange={(e) => set({ barcode: e.target.value })} /></Field>
              <Field label="Track inventory" span={2}>
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={form.trackInventory !== false} onChange={(e) => set({ trackInventory: e.target.checked })} />
                  <span>Decrement stock on each order</span>
                </label>
              </Field>
              <Field label={form.variants?.length ? "Base quantity (variants override)" : "Quantity"}>
                <input type="number" className={inputCls} value={form.stock ?? 0} onChange={(e) => set({ stock: Number(e.target.value) })} disabled={!!form.variants?.length} />
              </Field>
              <Field label="Low-stock threshold">
                <input type="number" className={inputCls} value={form.lowStockThreshold ?? 5} onChange={(e) => set({ lowStockThreshold: Number(e.target.value) })} />
              </Field>
              <Field label="When out of stock" span={2}>
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={!!form.continueSellingWhenOutOfStock} onChange={(e) => set({ continueSellingWhenOutOfStock: e.target.checked })} />
                  <span>Continue selling when stock reaches 0 (backorder)</span>
                </label>
              </Field>
            </div>
          )}

          {tab === "shipping" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="This is a physical product" span={2}>
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={form.requiresShipping !== false} onChange={(e) => set({ requiresShipping: e.target.checked, isDigital: e.target.checked ? false : form.isDigital })} />
                  <span>Requires shipping</span>
                </label>
              </Field>
              <Field label="Digital product" span={2}>
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm">
                  <input type="checkbox" checked={!!form.isDigital} onChange={(e) => set({ isDigital: e.target.checked, requiresShipping: e.target.checked ? false : form.requiresShipping })} />
                  <span>Delivered electronically (no shipping)</span>
                </label>
              </Field>
              <Field label="Weight (g)"><input type="number" className={inputCls} value={form.weight ?? ""} onChange={(e) => set({ weight: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
              <div />
              <Field label="Length (cm)"><input type="number" className={inputCls} value={form.dimensions?.l ?? ""} onChange={(e) => set({ dimensions: { ...(form.dimensions ?? {}), l: e.target.value === "" ? undefined : Number(e.target.value) } })} /></Field>
              <Field label="Width (cm)"><input type="number" className={inputCls} value={form.dimensions?.w ?? ""} onChange={(e) => set({ dimensions: { ...(form.dimensions ?? {}), w: e.target.value === "" ? undefined : Number(e.target.value) } })} /></Field>
              <Field label="Height (cm)"><input type="number" className={inputCls} value={form.dimensions?.h ?? ""} onChange={(e) => set({ dimensions: { ...(form.dimensions ?? {}), h: e.target.value === "" ? undefined : Number(e.target.value) } })} /></Field>
            </div>
          )}

          {tab === "seo" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="URL handle" span={2}>
                <input className={inputCls} value={form.handle ?? ""} onChange={(e) => set({ handle: e.target.value })} placeholder="auto from name" />
              </Field>
              <Field label="SEO title" span={2}>
                <input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => set({ seoTitle: e.target.value })} placeholder={form.name} />
              </Field>
              <Field label="Meta description" span={2}>
                <textarea className={areaCls} value={form.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} />
              </Field>
              <Field label="Search result preview" span={2}>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[11px] text-emerald-300 truncate">yourstore.com{previewUrl}</div>
                  <div className="text-sm text-primary mt-0.5 truncate">{form.seoTitle || form.name || "Product title"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.seoDescription || form.shortDescription || "Add a meta description to preview how this product appears in search results."}</div>
                </div>
              </Field>
            </div>
          )}

          {tab === "org" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Category">
                <select className={inputCls} value={form.category ?? ""} onChange={(e) => set({ category: e.target.value })}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Product type"><input className={inputCls} value={form.productType ?? ""} onChange={(e) => set({ productType: e.target.value })} /></Field>
              <Field label="Brand"><input className={inputCls} value={form.brand ?? ""} onChange={(e) => set({ brand: e.target.value })} /></Field>
              <Field label="Vendor"><input className={inputCls} value={form.vendor ?? ""} onChange={(e) => set({ vendor: e.target.value })} /></Field>
              <Field label="Tags (comma separated)" span={2}>
                <input className={inputCls} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="new, featured, summer" />
              </Field>
              <Field label="Collections" span={2}>{CollectionsMulti}</Field>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* ------------ Filters panel + Bulk bar ------------- */
type ProductFilterState = {
  status: string;   // "All" | Draft | Active | Archived
  category: string; // "All" | name
  collectionId: string;
  vendor: string;
  productType: string;
  tag: string;
  priceMin: string;
  priceMax: string;
  stock: string;    // "All" | "in" | "low" | "out"
  sort: "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "updated";
};
const DEFAULT_FILTERS: ProductFilterState = { status: "All", category: "All", collectionId: "All", vendor: "All", productType: "All", tag: "All", priceMin: "", priceMax: "", stock: "All", sort: "newest" };

function FiltersPanel({ open, filters, onChange, products, collections }: {
  open: boolean; filters: ProductFilterState; onChange: (f: ProductFilterState) => void;
  products: Product[]; collections: Collection[];
}) {
  if (!open) return null;
  const uniq = (arr: (string | undefined)[]) => Array.from(new Set(arr.filter(Boolean) as string[])).sort();
  const vendors = uniq(products.map((p) => p.vendor));
  const types = uniq(products.map((p) => p.productType));
  const tags = uniq(products.flatMap((p) => p.tags ?? []));
  const cats = uniq(products.map((p) => p.category));
  const S = (k: keyof ProductFilterState, v: string) => onChange({ ...filters, [k]: v });
  const selectCls = cn(inputCls, "h-9");
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-strong border border-white/[0.08] p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Category</span>
        <select className={selectCls} value={filters.category} onChange={(e) => S("category", e.target.value)}>
          <option>All</option>{cats.map((c) => <option key={c}>{c}</option>)}
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Collection</span>
        <select className={selectCls} value={filters.collectionId} onChange={(e) => S("collectionId", e.target.value)}>
          <option value="All">All</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Vendor</span>
        <select className={selectCls} value={filters.vendor} onChange={(e) => S("vendor", e.target.value)}>
          <option>All</option>{vendors.map((v) => <option key={v}>{v}</option>)}
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Product type</span>
        <select className={selectCls} value={filters.productType} onChange={(e) => S("productType", e.target.value)}>
          <option>All</option>{types.map((v) => <option key={v}>{v}</option>)}
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Tag</span>
        <select className={selectCls} value={filters.tag} onChange={(e) => S("tag", e.target.value)}>
          <option>All</option>{tags.map((t) => <option key={t}>{t}</option>)}
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Stock</span>
        <select className={selectCls} value={filters.stock} onChange={(e) => S("stock", e.target.value)}>
          <option value="All">All</option>
          <option value="in">In stock</option>
          <option value="low">Low</option>
          <option value="out">Out of stock</option>
        </select></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Min price</span>
        <input type="number" className={selectCls} value={filters.priceMin} onChange={(e) => S("priceMin", e.target.value)} placeholder="0" /></label>
      <label className="text-xs"><span className="block text-muted-foreground mb-1">Max price</span>
        <input type="number" className={selectCls} value={filters.priceMax} onChange={(e) => S("priceMax", e.target.value)} placeholder="∞" /></label>
      <div className="col-span-2 md:col-span-4 flex items-center justify-between pt-1">
        <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-xs text-muted-foreground hover:text-foreground underline">Reset filters</button>
        <label className="text-xs inline-flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="text-muted-foreground">Sort by</span>
          <select className={cn(selectCls, "min-w-[10rem]")} value={filters.sort} onChange={(e) => S("sort", e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="updated">Recently updated</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="price-asc">Price low → high</option>
            <option value="price-desc">Price high → low</option>
          </select>
        </label>
      </div>
    </motion.div>
  );
}

function BulkBar({ count, onClear, onArchive, onActivate, onDraft, onDelete, onCategory, onCollection, categories, collections }: {
  count: number; onClear: () => void;
  onArchive: () => void; onActivate: () => void; onDraft: () => void; onDelete: () => void;
  onCategory: (name: string) => void; onCollection: (id: string) => void;
  categories: Category[]; collections: Collection[];
}) {
  if (count === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="sticky top-2 z-30 flex items-center gap-2 rounded-2xl glass-strong border border-primary/30 shadow-glow px-3 py-2 flex-wrap">
      <span className="text-xs font-medium">{count} selected</span>
      <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
      <div className="ml-auto flex items-center gap-1.5 flex-wrap">
        <button onClick={onActivate} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Set Active</button>
        <button onClick={onDraft} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Set Draft</button>
        <button onClick={onArchive} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs inline-flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Archive</button>
        <select onChange={(e) => { if (e.target.value) { onCategory(e.target.value); e.target.value = ""; } }} className="h-8 px-2 rounded-lg glass text-xs">
          <option value="">Change category…</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select onChange={(e) => { if (e.target.value) { onCollection(e.target.value); e.target.value = ""; } }} className="h-8 px-2 rounded-lg glass text-xs">
          <option value="">Add to collection…</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={onDelete} className="h-8 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
      </div>
    </motion.div>
  );
}

/* ------------ Row menu for products (with archive/restore) ------------- */
function ProductRowMenu({ archived, onView, onEdit, onDuplicate, onArchive, onRestore, onDelete }: {
  archived: boolean;
  onView: () => void; onEdit: () => void; onDuplicate: () => void;
  onArchive: () => void; onRestore: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const Item = ({ icon: Icon, label, onClick, danger }: any) => (
    <button onClick={() => { setOpen(false); onClick(); }}
      className={cn("flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition",
        danger ? "text-rose-300 hover:bg-rose-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
  return (
    <span className="inline-block" onClick={(e) => e.stopPropagation()}>
      <button ref={btnRef} onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <FloatingLayer open={open} onClose={() => setOpen(false)} anchorRef={btnRef} align="end" className="w-44 p-1 text-left">
        <Item icon={Eye} label="Quick view" onClick={onView} />
        <Item icon={Pencil} label="Edit" onClick={onEdit} />
        <Item icon={Copy} label="Duplicate" onClick={onDuplicate} />
        {archived
          ? <Item icon={ArchiveRestore} label="Restore" onClick={onRestore} />
          : <Item icon={Archive} label="Archive" onClick={onArchive} />}
        <Item icon={Trash2} label="Delete" onClick={onDelete} danger />
      </FloatingLayer>
    </span>
  );
}


/* ------------ Products page ------------- */
export function ProductsPage() {
  const item = findItem("products")!;

  // Products are synced globally in root layout
  const products = useStoreData((s) => s.products);

  // Keep local categories/collections from store for filters (these come from Item Groups)
  const { data: categories = [] } = useCategories();
  const { data: collections = [] } = useCollections();

  const {
    addProduct, updateProduct, removeProduct, duplicateProduct,
    archiveProduct, restoreProduct, bulkUpdateProducts, bulkRemoveProducts,
    addProductToCollection,
  } = useStoreData.getState();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");                    // Toolbar top filter
  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; initial: Partial<Product> | null }>({ open: false, initial: null });
  const [quickView, setQuickView] = useState<Product | null>(null);

  useEffect(() => { setSelected(new Set()); }, [query, active, filters]);

  const filtered = useMemo(() => {
    let list = products.slice();
    // Top-level toolbar filter (Active/Draft/Archived tabs)
    if (active !== "All") {
      const map: Record<string, Product["status"]> = { Active: "Published", Draft: "Draft", Archived: "Archived" };
      const target = map[active];
      if (target) list = list.filter((p) => p.status === target);
    }
    // Full text search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.vendor ?? "").toLowerCase().includes(q) ||
        (p.productType ?? "").toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.status !== "All") {
      const map: Record<string, Product["status"]> = { Active: "Published", Draft: "Draft", Archived: "Archived" };
      const t = map[filters.status]; if (t) list = list.filter((p) => p.status === t);
    }
    if (filters.category !== "All") list = list.filter((p) => p.category === filters.category);
    if (filters.collectionId !== "All") list = list.filter((p) => (p.collectionIds ?? []).includes(filters.collectionId));
    if (filters.vendor !== "All") list = list.filter((p) => p.vendor === filters.vendor);
    if (filters.productType !== "All") list = list.filter((p) => p.productType === filters.productType);
    if (filters.tag !== "All") list = list.filter((p) => (p.tags ?? []).includes(filters.tag));
    const min = filters.priceMin === "" ? -Infinity : Number(filters.priceMin);
    const max = filters.priceMax === "" ? Infinity : Number(filters.priceMax);
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (filters.stock !== "All") {
      list = list.filter((p) => {
        if (p.trackInventory === false) return filters.stock === "in";
        const s = totalStock(p); const low = p.lowStockThreshold ?? 5;
        if (filters.stock === "in") return s > low;
        if (filters.stock === "low") return s > 0 && s <= low;
        if (filters.stock === "out") return s === 0;
        return true;
      });
    }
    list.sort((a, b) => {
      switch (filters.sort) {
        case "oldest": return a.createdAt - b.createdAt;
        case "updated": return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "newest":
        default: return b.createdAt - a.createdAt;
      }
    });
    return list;
  }, [products, query, active, filters]);

  const { page, pages, paged, setPage } = usePaged(filtered, 10);

  // Stats
  const stats: Stat[] = [
    { label: "Total products", value: String(products.length) },
    { label: "Active", value: String(products.filter((p) => p.status === "Published").length) },
    { label: "Draft", value: String(products.filter((p) => p.status === "Draft").length) },
    { label: "Low / Out", value: String(products.filter((p) => p.trackInventory !== false && totalStock(p) <= (p.lowStockThreshold ?? 5)).length) },
  ];

  const exportRows = filtered.map((p) => ({
    id: p.id, name: p.name, sku: p.sku, price: p.price,
    stock: totalStock(p), status: STATUS_UI[p.status],
    category: p.category,
    updated: dt(p.updatedAt ?? p.createdAt), created: dt(p.createdAt),
  }));
  const exportCols: Column[] = [
    { key: "name", label: "Name" }, { key: "sku", label: "SKU" }, { key: "price", label: "Price" },
    { key: "stock", label: "Stock" }, { key: "status", label: "Status" },
    { key: "category", label: "Category" },
    { key: "updated", label: "Updated" }, { key: "created", label: "Created" },
  ];

  const allOnPageSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));
  const toggleAllOnPage = () => {
    const next = new Set(selected);
    if (allOnPageSelected) paged.forEach((p) => next.delete(p.id));
    else paged.forEach((p) => next.add(p.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectedIds = Array.from(selected);
  const clearSelected = () => setSelected(new Set());

  const doSave = (p: Partial<Product>) => {
    if (modal.initial?.id) { updateProduct(modal.initial.id, p); pushToast("success", "Product saved"); }
    else { addProduct(p); pushToast("success", "Product created"); }
    setModal({ open: false, initial: null });
  };

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Products" />
      <PageHeader icon={item.icon} title="Products" subtitle="Your catalog — synced across dashboard, builder and published storefront."
        primaryAction="Add product" onPrimary={() => setModal({ open: true, initial: null })}
        onExport={() => { downloadCSV("products", exportCols, exportRows); pushToast("info", `Exported ${exportRows.length} rows`); }}
      />
      <StatsRow stats={stats} />

      <Toolbar
        filters={["All", "Active", "Draft", "Archived"]}
        active={active}
        onActive={(f) => { setActive(f); setPage(1); }}
        query={query}
        onQuery={(q) => { setQuery(q); setPage(1); }}
        onFiltersToggle={() => setFiltersOpen((o) => !o)}
        filtersOpen={filtersOpen}
      />

      <FiltersPanel open={filtersOpen} filters={filters} onChange={(f) => { setFilters(f); setPage(1); }}
        products={products} collections={collections} />

      <BulkBar
        count={selected.size}
        onClear={clearSelected}
        onActivate={() => { bulkUpdateProducts(selectedIds, { status: "Published" }); pushToast("success", `${selectedIds.length} activated`); clearSelected(); }}
        onDraft={() => { bulkUpdateProducts(selectedIds, { status: "Draft" }); pushToast("success", `${selectedIds.length} moved to draft`); clearSelected(); }}
        onArchive={() => { bulkUpdateProducts(selectedIds, { status: "Archived", archivedAt: Date.now() }); pushToast("success", `${selectedIds.length} archived`); clearSelected(); }}
        onDelete={() => { if (confirm(`Delete ${selectedIds.length} product${selectedIds.length === 1 ? "" : "s"}?`)) { bulkRemoveProducts(selectedIds); pushToast("success", "Deleted"); clearSelected(); } }}
        onCategory={(name) => { bulkUpdateProducts(selectedIds, { category: name }); pushToast("success", "Category updated"); }}
        onCollection={(cid) => { selectedIds.forEach((pid) => addProductToCollection(cid, pid)); pushToast("success", "Added to collection"); }}
        categories={categories}
        collections={collections}
      />

      {paged.length ? (
        <>
          <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="w-10 pl-4 py-3">
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                    </th>
                    {[
                      ["id", "ID"], ["product", "Product"], ["status", "Status"], ["web", "Web Product"], ["price", "Price"],
                      ["inventory", "Inventory"], ["category", "Category"], ["updated", "Updated"],
                    ].map(([k, label]) => (
                      <th key={k} className="px-4 py-3 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium">{label}</th>
                    ))}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p, i) => {
                    const bd = stockBadge(p);
                    return (
                      <motion.tr key={p.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        className={cn("border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer", selected.has(p.id) && "bg-primary/5")}
                        onClick={() => setQuickView(p)}
                      >
                        <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                        </td>
                        <td className="px-4 py-3 text-[13px] font-mono">{p.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-white/[0.05] border border-white/10 grid place-items-center">
                              {p.images?.[0] ? <img src={p.images[0]} alt={p.imageAlts?.[0] ?? p.name} className="h-full w-full object-cover" />
                                : <Package className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium">{p.name}</div>
                              <div className="truncate text-[11px] text-muted-foreground">{p.sku}{p.variants?.length ? ` · ${p.variants.length} variants` : ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusPill label={STATUS_UI[p.status]} /></td>
                        <td className="px-4 py-3">
                          {p.status === "Published" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProduct(p.id, { status: "Draft" });
                                pushToast("success", "Product unpublished");
                              }}
                              className="h-8 px-3 rounded-lg bg-rose-500/10 text-rose-300 text-xs"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateProduct(p.id, { status: "Published" });
                                pushToast("success", "Product published");
                              }}
                              className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-300 text-xs"
                            >
                              Publish
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{money(p.price)}</div>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <div className="text-[11px] text-muted-foreground line-through">{money(p.compareAtPrice)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium", bd.tone)}>{bd.label}</span>
                        </td>
                        <td className="px-4 py-3 text-[13px]">{p.category || "—"}</td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{dt(p.updatedAt ?? p.createdAt)}</td>
                        <td className="px-2 text-right" onClick={(e) => e.stopPropagation()}>
                          <ProductRowMenu
                            archived={p.status === "Archived"}
                            onView={() => setQuickView(p)}
                            onEdit={() => setModal({ open: true, initial: p })}
                            onDuplicate={() => { duplicateProduct(p.id); pushToast("success", "Product duplicated"); }}
                            onArchive={() => { archiveProduct(p.id); pushToast("success", "Archived"); }}
                            onRestore={() => { restoreProduct(p.id); pushToast("success", "Restored"); }}
                            onDelete={() => {
                              if (confirm(`Delete "${p.name}"?`)) {
                                removeProduct(p.id);
                                pushToast("success", "Deleted");
                              }
                            }}
                          />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      ) : (
        <EmptyState title={products.length ? "No products match" : "No products yet"}
          desc={products.length ? "Adjust your filters or search to find products." : "Add your first product — it will appear on your storefront automatically."}
          action={products.length ? "Reset filters" : "Add product"}
          onAction={() => products.length ? (setFilters(DEFAULT_FILTERS), setQuery(""), setActive("All")) : setModal({ open: true, initial: null })} />
      )}

      {/* Quick view drawer */}
      <AnimatePresence>
        {quickView && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setQuickView(null)} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed top-0 right-0 z-50 h-screen w-full max-w-md glass-strong border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Product</div>
                  <div className="font-display text-lg font-semibold mt-0.5 truncate">{quickView.name}</div>
                </div>
                <button onClick={() => setQuickView(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
                {quickView.images?.length ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {quickView.images.slice(0, 6).map((src, i) => (
                      <img key={i} src={src} alt={quickView.imageAlts?.[i] ?? ""} className="aspect-square rounded-lg object-cover border border-white/10" />
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile label="Status"><StatusPill label={STATUS_UI[quickView.status]} /></InfoTile>
                  <InfoTile label="Price">{money(quickView.price)}</InfoTile>
                  <InfoTile label="Inventory">{quickView.trackInventory === false ? "Untracked" : totalStock(quickView)}</InfoTile>
                  <InfoTile label="SKU">{quickView.sku}</InfoTile>
                  <InfoTile label="Category">{quickView.category || "—"}</InfoTile>
                  <InfoTile label="Vendor">{quickView.vendor || "—"}</InfoTile>
                </div>
                {quickView.variants?.length ? (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">Variants ({quickView.variants.length})</div>
                    <ul className="space-y-1 text-xs">
                      {quickView.variants.slice(0, 8).map((v) => (
                        <li key={v.id} className="flex items-center justify-between">
                          <span className="truncate">{Object.values(v.options).join(" / ")}</span>
                          <span className="text-muted-foreground">{money(v.price ?? quickView.price)} · {v.stock ?? 0}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {quickView.description && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-muted-foreground whitespace-pre-line">{quickView.description}</div>
                )}
              </div>
              <div className="p-4 border-t border-white/[0.06] flex items-center gap-2">
                <button onClick={() => { removeProduct(quickView.id); pushToast("success", "Deleted"); setQuickView(null); }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300 text-xs"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                <button onClick={() => { duplicateProduct(quickView.id); pushToast("success", "Duplicated"); setQuickView(null); }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs"><Copy className="h-3.5 w-3.5" /> Duplicate</button>
                <button onClick={() => { const p = quickView; setQuickView(null); setModal({ open: true, initial: p }); }}
                  className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ProductEditor
        open={modal.open}
        onClose={() => setModal({ open: false, initial: null })}
        initial={modal.initial}
        onSave={doSave}
      />
    </div>
  );
}

/* ============================================================
 * CATEGORIES — tree view, full editor, bulk ops, archive/restore
 * ============================================================ */
function CategoryModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial: Partial<Category> | null;
  onSave: (c: Partial<Category>) => void;
}) {
  const categories = useStoreData((s) => s.categories);
  const [form, setForm] = useState<Partial<Category>>({});
  const [tab, setTab] = useState<"general" | "media" | "seo">("general");
  useEffect(() => { if (open) { setForm(initial ?? { name: "", status: "Active" }); setTab("general"); } }, [open, initial]);
  const set = (patch: Partial<Category>) => setForm((f) => ({ ...f, ...patch }));

  const pickImage = async (key: "imageUrl" | "bannerUrl" | "iconUrl") => {
    const a = await openImagePicker(); if (a) set({ [key]: a.url } as any);
  };
  const submit = () => {
    if (!form.name?.trim()) { pushToast("error", "Category name is required"); return; }
    if (form.parentId && form.parentId === initial?.id) { pushToast("error", "A category can't be its own parent"); return; }
    onSave(form);
  };

  // prevent cycles: a category cannot be parented under one of its descendants
  const forbiddenIds = useMemo(() => {
    if (!initial?.id) return new Set<string>();
    const s = new Set<string>([initial.id]);
    const walk = () => {
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of categories) if (c.parentId && s.has(c.parentId) && !s.has(c.id)) { s.add(c.id); grew = true; }
      }
    };
    walk();
    return s;
  }, [categories, initial?.id]);

  return (
    <ModalShell open={open} onClose={onClose} title={initial?.id ? "Edit category" : "New category"} sub="Category" maxWidth="max-w-3xl"
      footer={<>
        <button onClick={onClose} className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
        <button onClick={submit} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
          <Check className="h-3.5 w-3.5" /> Save
        </button>
      </>}>
      <div className="mb-4 inline-flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
        {(["general", "media", "seo"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 h-8 rounded-lg text-xs capitalize", tab === t ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" span={2}><input className={inputCls} value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Handle"><input className={inputCls} placeholder="auto from name" value={form.handle ?? ""} onChange={(e) => set({ handle: e.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status ?? "Active"} onChange={(e) => set({ status: e.target.value as Category["status"] })}>
              <option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
            </select>
          </Field>
          <Field label="Parent category">
            <select className={inputCls} value={form.parentId ?? ""} onChange={(e) => set({ parentId: e.target.value || undefined })}>
              <option value="">— None (top level) —</option>
              {categories.filter((c) => !forbiddenIds.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sort order">
            <input type="number" className={inputCls} value={form.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} />
          </Field>
          <Field label="Description" span={2}><textarea className={areaCls} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></Field>
        </div>
      )}

      {tab === "media" && (
        <div className="grid sm:grid-cols-3 gap-3">
          {(["imageUrl", "bannerUrl", "iconUrl"] as const).map((k) => (
            <Field key={k} label={k === "imageUrl" ? "Thumbnail" : k === "bannerUrl" ? "Banner" : "Icon"}>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
                {form[k] ? (
                  <img src={form[k]!} alt="" className={cn("mx-auto rounded-lg object-cover", k === "bannerUrl" ? "h-24 w-full" : "h-24 w-24")} />
                ) : (
                  <div className={cn("mx-auto rounded-lg bg-white/[0.03] border border-dashed border-white/10 grid place-items-center text-[10px] text-muted-foreground", k === "bannerUrl" ? "h-24 w-full" : "h-24 w-24")}>No image</div>
                )}
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button type="button" onClick={() => pickImage(k)} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg glass hover:bg-white/10 text-[11px]"><ImagePlus className="h-3 w-3" /> Choose</button>
                  {form[k] && <button type="button" onClick={() => set({ [k]: undefined } as any)} className="text-[11px] text-rose-300 hover:underline">Remove</button>}
                </div>
              </div>
            </Field>
          ))}
        </div>
      )}

      {tab === "seo" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="SEO title" span={2}><input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
          <Field label="Meta description" span={2}><textarea className={areaCls} value={form.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
          <Field label="Keywords (comma separated)" span={2}><input className={inputCls} value={form.keywords ?? ""} onChange={(e) => set({ keywords: e.target.value })} /></Field>
          <div className="sm:col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Search preview</div>
            <div className="text-primary text-sm truncate">{form.seoTitle || form.name || "Category title"}</div>
            <div className="text-emerald-300/70 text-[11px]">/category/{form.handle || (form.name ?? "").toLowerCase().replace(/\s+/g, "-") || "handle"}</div>
            <div className="text-muted-foreground text-xs mt-1 line-clamp-2">{form.seoDescription || form.description || "Add a description to preview it here."}</div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

type CatNode = Category & { depth: number; childCount: number };
function buildCategoryTree(cats: Category[]): CatNode[] {
  const sorted = [...cats].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
  const byParent = new Map<string | undefined, Category[]>();
  for (const c of sorted) {
    const k = c.parentId ?? "__root__";
    const arr = byParent.get(k as any) ?? []; arr.push(c); byParent.set(k as any, arr);
  }
  const out: CatNode[] = [];
  const walk = (parent: string | undefined, depth: number) => {
    const kids = byParent.get((parent ?? "__root__") as any) ?? [];
    for (const c of kids) {
      const children = byParent.get(c.id as any) ?? [];
      out.push({ ...c, depth, childCount: children.length });
      walk(c.id, depth + 1);
    }
  };
  walk(undefined, 0);
  return out;
}

export function CategoriesPage() {
  const item = findItem("categories")!;
  const categories = useStoreData((s) => s.categories);
  const products = useStoreData((s) => s.products);
  const {
    addCategory, updateCategory, removeCategory,
    duplicateCategory, archiveCategory, restoreCategory,
    bulkUpdateCategories, bulkRemoveCategories,
  } = useStoreData.getState();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | "Active" | "Draft" | "Archived">("All");
  const [view, setView] = useState<"tree" | "table">("tree");
  const [modal, setModal] = useState<{ open: boolean; initial: Partial<Category> | null }>({ open: false, initial: null });
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const productCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      // legacy: p.category holds category name OR id
      const key = p.category;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return (c: Category) => (m.get(c.id) ?? 0) + (m.get(c.name) ?? 0);
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return categories.filter((c) => {
      if (statusTab !== "All" && (c.status ?? "Active") !== statusTab) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q);
    });
  }, [categories, query, statusTab]);

  const tree = useMemo(() => buildCategoryTree(filtered), [filtered]);

  // hide descendants of collapsed nodes
  const visibleTree = useMemo(() => {
    const hidden = new Set<string>();
    for (const n of tree) {
      if (collapsed.has(n.id)) {
        // hide any descendants of n
        for (const m of tree) if (m.depth > n.depth) {
          // find if m descends from n: naive check via ancestor chain
          let cur: string | undefined = m.parentId;
          while (cur) {
            if (cur === n.id) { hidden.add(m.id); break; }
            cur = categories.find((cc) => cc.id === cur)?.parentId;
          }
        }
      }
    }
    return tree.filter((n) => !hidden.has(n.id));
  }, [tree, collapsed, categories]);

  const toggle = (id: string) => setSelection((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelection((s) => s.size === visibleTree.length ? new Set() : new Set(visibleTree.map((n) => n.id)));
  const clearSel = () => setSelection(new Set());

  const stats: Stat[] = [
    { label: "Categories", value: String(categories.length) },
    { label: "Active", value: String(categories.filter((c) => (c.status ?? "Active") === "Active").length) },
    { label: "Archived", value: String(categories.filter((c) => c.status === "Archived").length) },
    { label: "Top level", value: String(categories.filter((c) => !c.parentId).length) },
  ];

  const columns: Column[] = [
    { key: "name", label: "Category" }, { key: "parent", label: "Parent" },
    { key: "products", label: "Products" }, { key: "status", label: "Status" },
    { key: "created", label: "Created", className: "text-right" },
  ];
  const tableRows = filtered.map((c) => ({
    __id: c.id, name: c.name,
    parent: categories.find((p) => p.id === c.parentId)?.name ?? "—",
    products: productCount(c),
    status: c.status ?? "Active",
    created: dt(c.createdAt),
  }));

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Categories" />
      <PageHeader icon={item.icon} title="Categories" subtitle="Organise your catalog into a browseable, nestable tree."
        primaryAction="New category" onPrimary={() => setModal({ open: true, initial: null })}
        onExport={() => downloadCSV("categories", columns, tableRows)} />
      <StatsRow stats={stats} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          {(["All", "Active", "Draft", "Archived"] as const).map((s) => (
            <button key={s} onClick={() => setStatusTab(s)}
              className={cn("h-8 px-3 rounded-lg text-xs", statusTab === s ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
        <div className="inline-flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          <button onClick={() => setView("tree")} className={cn("h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1", view === "tree" ? "bg-white/10" : "text-muted-foreground")}><FolderTree className="h-3.5 w-3.5" /> Tree</button>
          <button onClick={() => setView("table")} className={cn("h-8 px-3 rounded-lg text-xs inline-flex items-center gap-1", view === "table" ? "bg-white/10" : "text-muted-foreground")}><ListIcon className="h-3.5 w-3.5" /> Table</button>
        </div>
        <div className="relative ml-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories" className={cn(inputCls, "h-9 pl-9 w-72")} />
        </div>
      </div>

      <AnimatePresence>
        {selection.size > 0 && (
          <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
            className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl glass-strong border border-white/10 px-3 py-2">
            <div className="text-xs font-medium">{selection.size} selected</div>
            <button onClick={() => { bulkUpdateCategories([...selection], { status: "Active" }); pushToast("success", "Marked active"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Mark active</button>
            <button onClick={() => { bulkUpdateCategories([...selection], { status: "Draft" }); pushToast("success", "Marked draft"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Mark draft</button>
            <button onClick={() => { for (const id of selection) archiveCategory(id); pushToast("success", "Archived"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs inline-flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Archive</button>
            <button onClick={() => { for (const id of selection) restoreCategory(id); pushToast("success", "Restored"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs inline-flex items-center gap-1"><ArchiveRestore className="h-3.5 w-3.5" /> Restore</button>
            <button onClick={() => { if (confirm(`Delete ${selection.size} categories?`)) { bulkRemoveCategories([...selection]); pushToast("success", "Deleted"); clearSel(); } }} className="h-8 px-3 rounded-lg glass hover:bg-rose-500/10 hover:text-rose-300 text-xs inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            <button onClick={clearSel} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <EmptyState title="No categories yet" desc="Create your first category to organise products." action="New category" onAction={() => setModal({ open: true, initial: null })} />
      ) : view === "tree" ? (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-widest text-muted-foreground border-b border-white/[0.06] bg-white/[0.02]">
            <input type="checkbox" checked={selection.size === visibleTree.length && visibleTree.length > 0} onChange={toggleAll} />
            <span className="flex-1">Category</span>
            <span className="w-20 text-right">Products</span>
            <span className="w-24">Status</span>
            <span className="w-8" />
          </div>
          {visibleTree.map((n) => (
            <div key={n.id} className={cn("flex items-center gap-3 px-4 py-2.5 text-sm border-t border-white/[0.04] hover:bg-white/[0.02]", selection.has(n.id) && "bg-primary/5")}>
              <input type="checkbox" checked={selection.has(n.id)} onChange={() => toggle(n.id)} />
              <div className="flex-1 flex items-center gap-2 min-w-0" style={{ paddingLeft: n.depth * 22 }}>
                {n.childCount > 0 ? (
                  <button onClick={() => setCollapsed((s) => { const x = new Set(s); x.has(n.id) ? x.delete(n.id) : x.add(n.id); return x; })}
                    className="h-5 w-5 grid place-items-center rounded hover:bg-white/10 text-muted-foreground">
                    <ArrowUpDown className={cn("h-3 w-3 transition-transform", collapsed.has(n.id) ? "-rotate-90" : "rotate-0")} />
                  </button>
                ) : <span className="w-5 inline-block" />}
                {n.iconUrl ? <img src={n.iconUrl} alt="" className="h-7 w-7 rounded object-cover" /> :
                 n.imageUrl ? <img src={n.imageUrl} alt="" className="h-7 w-7 rounded object-cover" /> :
                 <span className="h-7 w-7 rounded bg-white/5 grid place-items-center"><FolderIcon className="h-3.5 w-3.5 text-muted-foreground" /></span>}
                <button onClick={() => setModal({ open: true, initial: n })} className="truncate text-left hover:underline font-medium">{n.name}</button>
                {n.childCount > 0 && <span className="text-[10px] text-muted-foreground">· {n.childCount}</span>}
              </div>
              <span className="w-20 text-right text-xs text-muted-foreground">{productCount(n)}</span>
              <span className="w-24"><StatusPill label={n.status ?? "Active"} /></span>
              <div className="w-8 flex justify-end" onClick={(e) => e.stopPropagation()}>
                <InlineActionMenu
                  items={[
                    { label: "Edit", onClick: () => setModal({ open: true, initial: n }) },
                    { label: "Duplicate", onClick: () => { duplicateCategory(n.id); pushToast("success", "Duplicated"); } },
                    { label: "Add sub-category", onClick: () => { addCategory({ parentId: n.id, name: "New sub-category" }); pushToast("success", "Sub-category added"); } },
                    n.status === "Archived"
                      ? { label: "Restore", onClick: () => { restoreCategory(n.id); pushToast("success", "Restored"); } }
                      : { label: "Archive", onClick: () => { archiveCategory(n.id); pushToast("success", "Archived"); } },
                    { label: "Delete", danger: true, onClick: () => { if (confirm("Delete category? Sub-categories re-parent.")) { removeCategory(n.id); pushToast("success", "Deleted"); } } },
                  ]}
                />
              </div>

            </div>
          ))}
        </div>
      ) : (
        <DataTable columns={columns} rows={tableRows}
          onRowClick={(r) => { const c = categories.find((x) => x.id === (r as any).__id); if (c) setModal({ open: true, initial: c }); }}
          onAction={(a, r) => {
            const c = categories.find((x) => x.id === (r as any).__id); if (!c) return;
            if (a === "edit" || a === "view") setModal({ open: true, initial: c });
            if (a === "duplicate") { duplicateCategory(c.id); pushToast("success", "Duplicated"); }
            if (a === "delete") { removeCategory(c.id); pushToast("success", "Deleted"); }
          }} />
      )}

      <CategoryModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} initial={modal.initial}
        onSave={(c) => {
          if (modal.initial?.id) { updateCategory(modal.initial.id, c); pushToast("success", "Category updated"); }
          else { addCategory(c); pushToast("success", "Category created"); }
          setModal({ open: false, initial: null });
        }} />
    </div>
  );
}

/* ============================================================
 * COLLECTIONS — rule builder, product picker, bulk ops
 * ============================================================ */
const RULE_FIELDS: { value: import("@/lib/store-data-store").CollectionRuleField; label: string; hint?: string }[] = [
  { value: "tag", label: "Product tag equals" },
  { value: "title-contains", label: "Product title contains" },
  { value: "category", label: "Product category is (id or name)" },
  { value: "vendor", label: "Vendor equals" },
  { value: "product-type", label: "Product type equals" },
  { value: "price-lt", label: "Price is less than" },
  { value: "price-gt", label: "Price is greater than" },
  { value: "compare-at-price-gt", label: "Compare-at price >" },
  { value: "in-stock", label: "Inventory in stock (true/false)", hint: "true/false" },
  { value: "featured", label: "Featured (true/false)", hint: "true/false" },
];

function CollectionModal({ open, onClose, initial, onSave }: {
  open: boolean; onClose: () => void; initial: Partial<Collection> | null;
  onSave: (c: Partial<Collection>) => void;
}) {
  const products = useStoreData((s) => s.products);
  const categories = useStoreData((s) => s.categories);
  const [form, setForm] = useState<Partial<Collection>>({});
  const [tab, setTab] = useState<"general" | "products" | "seo">("general");
  const [pQuery, setPQuery] = useState("");
  useEffect(() => {
    if (open) {
      setForm(initial ?? { name: "", kind: "manual", match: "all", productIds: [], rules: [], status: "Active" });
      setTab("general");
    }
  }, [open, initial]);
  const set = (patch: Partial<Collection>) => setForm((f) => ({ ...f, ...patch }));
  const pickImg = async (k: "imageUrl" | "bannerUrl") => { const a = await openImagePicker(); if (a) set({ [k]: a.url } as any); };
  const toggleP = (pid: string) => {
    const cur = form.productIds ?? [];
    set({ productIds: cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid] });
  };
  const addRule = () => set({ rules: [...(form.rules ?? []), { field: "tag", value: "" }] });
  const updateRule = (i: number, patch: Partial<import("@/lib/store-data-store").CollectionRule>) =>
    set({ rules: (form.rules ?? []).map((r, idx) => idx === i ? { ...r, ...patch } : r) });
  const removeRule = (i: number) => set({ rules: (form.rules ?? []).filter((_, idx) => idx !== i) });

  // Live preview count for automated collections
  const previewIds = useMemo(() => {
    if (form.kind !== "auto" || !form.rules?.length) return null;
    const catName = new Map(categories.map((c) => [c.id, c.name] as const));
    const test = (p: Product) => {
      const fn = (r: import("@/lib/store-data-store").CollectionRule) => {
        const v = (r.value ?? "").trim();
        switch (r.field) {
          case "tag": return (p.tags ?? []).some((t) => t.toLowerCase() === v.toLowerCase());
          case "category": { const asName = catName.get(v); return p.category === v || (!!asName && p.category === asName); }
          case "collection": return (p.collectionIds ?? []).includes(v);
          case "price-lt": return p.price < Number(v);
          case "price-gt": return p.price > Number(v);
          case "compare-at-price-gt": return (p.compareAtPrice ?? 0) > Number(v);
          case "title-contains": return p.name.toLowerCase().includes(v.toLowerCase());
          case "vendor": return (p.vendor ?? "").toLowerCase() === v.toLowerCase();
          case "product-type": return (p.productType ?? "").toLowerCase() === v.toLowerCase();
          case "in-stock": return v === "false" ? p.stock === 0 : p.stock > 0;
          case "featured": return v === "false" ? !p.featured : !!p.featured;
          default: return true;
        }
      };
      return (form.match ?? "all") === "any" ? form.rules!.some(fn) : form.rules!.every(fn);
    };
    return products.filter(test).map((p) => p.id);
  }, [form.kind, form.rules, form.match, products, categories]);

  const shownProducts = useMemo(() => {
    const q = pQuery.toLowerCase().trim();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 200);
  }, [products, pQuery]);

  const submit = () => {
    if (!form.name?.trim()) { pushToast("error", "Collection name required"); return; }
    onSave(form);
  };

  return (
    <ModalShell open={open} onClose={onClose} title={initial?.id ? "Edit collection" : "New collection"} sub="Collection" maxWidth="max-w-4xl"
      footer={<>
        <button onClick={onClose} className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs">Cancel</button>
        <button onClick={submit} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
          <Check className="h-3.5 w-3.5" /> Save
        </button>
      </>}>
      <div className="mb-4 inline-flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
        {(["general", "products", "seo"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 h-8 rounded-lg text-xs capitalize", tab === t ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>{t}</button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" span={2}><input className={inputCls} value={form.name ?? ""} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Handle"><input className={inputCls} placeholder="auto from name" value={form.handle ?? ""} onChange={(e) => set({ handle: e.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status ?? "Active"} onChange={(e) => set({ status: e.target.value as Collection["status"] })}>
              <option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option>
            </select>
          </Field>
          <Field label="Type">
            <select className={inputCls} value={form.kind ?? "manual"} onChange={(e) => set({ kind: e.target.value as Collection["kind"] })}>
              <option value="manual">Manual — hand-picked</option>
              <option value="auto">Automated — by rules</option>
            </select>
          </Field>
          <Field label="Sort order"><input type="number" className={inputCls} value={form.sortOrder ?? 0} onChange={(e) => set({ sortOrder: Number(e.target.value) })} /></Field>
          <Field label="Description" span={2}><textarea className={areaCls} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></Field>
          <Field label="Thumbnail">
            <div className="flex items-center gap-3">
              {form.imageUrl && <img src={form.imageUrl} className="h-16 w-16 rounded-lg object-cover border border-white/10" alt="" />}
              <button type="button" onClick={() => pickImg("imageUrl")} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg glass hover:bg-white/10 text-[11px]"><ImagePlus className="h-3 w-3" /> Choose</button>
              {form.imageUrl && <button type="button" onClick={() => set({ imageUrl: undefined })} className="text-[11px] text-rose-300 hover:underline">Remove</button>}
            </div>
          </Field>
          <Field label="Banner">
            <div className="flex items-center gap-3">
              {form.bannerUrl && <img src={form.bannerUrl} className="h-16 w-32 rounded-lg object-cover border border-white/10" alt="" />}
              <button type="button" onClick={() => pickImg("bannerUrl")} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg glass hover:bg-white/10 text-[11px]"><ImagePlus className="h-3 w-3" /> Choose</button>
              {form.bannerUrl && <button type="button" onClick={() => set({ bannerUrl: undefined })} className="text-[11px] text-rose-300 hover:underline">Remove</button>}
            </div>
          </Field>
        </div>
      )}

      {tab === "products" && (form.kind === "auto" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">Products must match</span>
            <select className={cn(inputCls, "h-8 w-auto")} value={form.match ?? "all"} onChange={(e) => set({ match: e.target.value as "all" | "any" })}>
              <option value="all">all conditions</option>
              <option value="any">any condition</option>
            </select>
          </div>
          <div className="space-y-2">
            {(form.rules ?? []).length === 0 && <div className="text-xs text-muted-foreground rounded-xl border border-dashed border-white/10 p-4">No rules yet — add one below to auto-populate this collection.</div>}
            {(form.rules ?? []).map((r, i) => {
              const meta = RULE_FIELDS.find((f) => f.value === r.field);
              return (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <select className={inputCls} value={r.field} onChange={(e) => updateRule(i, { field: e.target.value as any })}>
                    {RULE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <input className={inputCls} placeholder={meta?.hint ?? "Value"} value={r.value} onChange={(e) => updateRule(i, { value: e.target.value })} />
                  <button onClick={() => removeRule(i)} className="h-10 w-10 grid place-items-center rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
            <button onClick={addRule} className="inline-flex items-center gap-1 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs"><Plus className="h-3.5 w-3.5" /> Add condition</button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Live preview</span>
              <span className="font-medium">{previewIds ? `${previewIds.length} products match` : "0 products"}</span>
            </div>
            {previewIds && previewIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {previewIds.slice(0, 12).map((id) => {
                  const p = products.find((pp) => pp.id === id);
                  return <span key={id} className="px-2 py-0.5 rounded bg-white/5 text-[11px]">{p?.name}</span>;
                })}
                {previewIds.length > 12 && <span className="text-[11px] text-muted-foreground">+ {previewIds.length - 12} more</span>}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={pQuery} onChange={(e) => setPQuery(e.target.value)} placeholder="Search products by name or SKU" className={cn(inputCls, "pl-9")} />
          </div>
          <div className="text-xs text-muted-foreground">{(form.productIds ?? []).length} products selected</div>
          <div className="rounded-xl border border-white/10 max-h-80 overflow-auto divide-y divide-white/5">
            {shownProducts.length === 0 && <div className="p-4 text-xs text-muted-foreground">No products match.</div>}
            {shownProducts.map((p) => {
              const on = (form.productIds ?? []).includes(p.id);
              return (
                <label key={p.id} className={cn("flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/[0.03] cursor-pointer", on && "bg-primary/5")}>
                  <input type="checkbox" checked={on} onChange={() => toggleP(p.id)} />
                  {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-white/5" />}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">{p.sku} · {p.category}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{money(p.price)}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {tab === "seo" && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="SEO title" span={2}><input className={inputCls} value={form.seoTitle ?? ""} onChange={(e) => set({ seoTitle: e.target.value })} /></Field>
          <Field label="Meta description" span={2}><textarea className={areaCls} value={form.seoDescription ?? ""} onChange={(e) => set({ seoDescription: e.target.value })} /></Field>
          <Field label="Keywords" span={2}><input className={inputCls} value={form.keywords ?? ""} onChange={(e) => set({ keywords: e.target.value })} /></Field>
        </div>
      )}
    </ModalShell>
  );
}

export function CollectionsPage() {
  const item = findItem("collections") ?? findItem("categories")!;
  const products = useStoreData((s) => s.products);
  const {
    addCollection, updateCollection, removeCollection,
    duplicateCollection, archiveCollection, restoreCollection,
    bulkUpdateCollections, bulkRemoveCollections, recomputeAutoCollections,
  } = useStoreData.getState();

  // Use API-based hook for Item Groups
  const { data: itemGroups = [], isLoading, isError, error, refetch } = useItemGroups();

  // Map Frappe Item Groups to frontend Collection format
  const collections = useMemo(() => {
    return itemGroups?.map((group: any) => ({
      id: group.name,
      name: group.item_group_name,
      handle: group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: "",
      imageUrl: "",
      bannerUrl: "",
      kind: "auto",
      match: "all",
      productIds: [],
      rules: [{ field: "category", value: group.name }],
      status: "Active",
      sortOrder: 0,
      seoTitle: "",
      seoDescription: "",
      keywords: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })) || [];
  }, [itemGroups]);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"All" | "Manual" | "Automated" | "Archived">("All");
  const [modal, setModal] = useState<{ open: boolean; initial: Partial<Collection> | null }>({ open: false, initial: null });
  const [selection, setSelection] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return collections.filter((c) => {
      if (tab === "Archived") { if (c.status !== "Archived") return false; }
      else if (tab === "Manual" && c.kind !== "manual") return false;
      else if (tab === "Automated" && c.kind !== "auto") return false;
      else if (tab === "All" && c.status === "Archived") return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q);
    });
  }, [collections, query, tab]);

  const toggle = (id: string) => setSelection((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSel = () => setSelection(new Set());

  const stats: Stat[] = [
    { label: "Collections", value: String(collections.length) },
    { label: "Manual", value: String(collections.filter((c) => c.kind === "manual" && c.status !== "Archived").length) },
    { label: "Automated", value: String(collections.filter((c) => c.kind === "auto" && c.status !== "Archived").length) },
    { label: "Archived", value: String(collections.filter((c) => c.status === "Archived").length) },
  ];

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Collections" />
      <PageHeader icon={item.icon} title="Collections" subtitle="Merchandise your catalog with hand-picked or automated groupings."
        primaryAction="New collection" onPrimary={() => setModal({ open: true, initial: null })}
        onExport={() => downloadCSV("collections", [{ key: "name", label: "Name" }, { key: "kind", label: "Type" }, { key: "products", label: "Products" }], filtered.map((c) => ({ name: c.name, kind: c.kind, products: c.productIds.length })))} />
      <StatsRow stats={stats} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          {(["All", "Manual", "Automated", "Archived"] as const).map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={cn("h-8 px-3 rounded-lg text-xs", tab === s ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
        <button onClick={() => { recomputeAutoCollections(); pushToast("success", "Auto-collections recomputed"); }}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-xl glass hover:bg-white/10 text-xs"><Layers className="h-3.5 w-3.5" /> Recompute automated</button>
        <div className="relative ml-auto">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search collections" className={cn(inputCls, "h-9 pl-9 w-72")} />
        </div>
      </div>

      <AnimatePresence>
        {selection.size > 0 && (
          <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}
            className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-xl glass-strong border border-white/10 px-3 py-2">
            <div className="text-xs font-medium">{selection.size} selected</div>
            <button onClick={() => { bulkUpdateCollections([...selection], { status: "Active" }); pushToast("success", "Activated"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Activate</button>
            <button onClick={() => { for (const id of selection) archiveCollection(id); pushToast("success", "Archived"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs inline-flex items-center gap-1"><Archive className="h-3.5 w-3.5" /> Archive</button>
            <button onClick={() => { for (const id of selection) restoreCollection(id); pushToast("success", "Restored"); clearSel(); }} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs inline-flex items-center gap-1"><ArchiveRestore className="h-3.5 w-3.5" /> Restore</button>
            <button onClick={() => { if (confirm(`Delete ${selection.size} collections?`)) { bulkRemoveCollections([...selection]); pushToast("success", "Deleted"); clearSel(); } }} className="h-8 px-3 rounded-lg glass hover:bg-rose-500/10 hover:text-rose-300 text-xs inline-flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            <button onClick={clearSel} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <EmptyState title="No collections yet" desc="Group products for merchandising, campaigns, or storefront display." action="New collection" onAction={() => setModal({ open: true, initial: null })} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => {
            const selected = selection.has(c.id);
            const preview = c.productIds.slice(0, 4).map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
            return (
              <motion.div key={c.id} whileHover={{ y: -2 }}
                className={cn("relative rounded-2xl border overflow-hidden glass p-3 cursor-pointer", selected ? "border-primary/40 bg-primary/5" : "border-white/10")}
                onClick={() => setModal({ open: true, initial: c as Partial<Collection> })}>
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected} onChange={() => toggle(c.id)} />
                </div>
                <div className="aspect-[16/8] rounded-xl overflow-hidden border border-white/10 relative"
                  style={c.bannerUrl || c.imageUrl ? { background: `url(${c.bannerUrl || c.imageUrl}) center/cover` } : { background: "linear-gradient(135deg, hsl(var(--primary) / 0.2), transparent)" }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1">
                    <StatusPill label={c.status ?? "Active"} />
                    <span className="text-[10px] uppercase tracking-widest bg-black/40 text-white px-2 py-0.5 rounded">{c.kind === "auto" ? "Auto" : "Manual"}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">/{c.handle} · {c.productIds.length} products</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <InlineActionMenu
                      items={[
                        { label: "Edit", onClick: () => setModal({ open: true, initial: c as Partial<Collection> }) },
                        { label: "Duplicate", onClick: () => { duplicateCollection(c.id); pushToast("success", "Duplicated"); } },
                        c.status === "Archived"
                          ? { label: "Restore", onClick: () => { restoreCollection(c.id); pushToast("success", "Restored"); } }
                          : { label: "Archive", onClick: () => { archiveCollection(c.id); pushToast("success", "Archived"); } },
                        { label: "Delete", danger: true, onClick: () => { if (confirm("Delete collection?")) { removeCollection(c.id); pushToast("success", "Deleted"); } } },
                      ]}
                    />
                  </div>

                </div>
                {preview.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-1.5">
                    {preview.map((p) => (
                      <div key={p.id} className="aspect-square rounded-md overflow-hidden bg-white/5">
                        {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : null}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <CollectionModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} initial={modal.initial}
        onSave={(c) => {
          if (modal.initial?.id) { updateCollection(modal.initial.id, c); pushToast("success", "Collection updated"); }
          else { addCollection(c); pushToast("success", "Collection created"); }
          setModal({ open: false, initial: null });
        }} />
    </div>
  );
}

/* ============================================================
 * ORDERS
 * ============================================================ */
function OrderDrawer({ order, onClose, onFulfill, onRefund, onDelete }: {
  order: Order | null; onClose: () => void;
  onFulfill: () => void; onRefund: () => void; onDelete: () => void;
}) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            className="fixed top-0 right-0 z-50 h-screen w-full max-w-lg glass-strong border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Order</div>
                <div className="font-display text-lg font-semibold mt-0.5">{order.number}</div>
              </div>
              <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <InfoTile label="Status"><StatusPill label={order.status} /></InfoTile>
                <InfoTile label="Fulfillment"><StatusPill label={order.fulfillment} /></InfoTile>
                <InfoTile label="Customer">{order.customerName}<div className="text-xs text-muted-foreground">{order.customerEmail}</div></InfoTile>
                <InfoTile label="Total">{money(order.total)}</InfoTile>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">Items</div>
                <ul className="space-y-2">
                  {order.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      {i.image && <img src={i.image} alt="" className="h-10 w-10 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{i.name}</div>
                        <div className="text-xs text-muted-foreground">Qty {i.qty} · {money(i.price)}</div>
                      </div>
                      <div className="text-sm">{money(i.price * i.qty)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-xs">
                  <Line label="Subtotal" value={money(order.subtotal)} />
                  {order.discount > 0 && <Line label={`Discount ${order.couponCode ? `(${order.couponCode})` : ""}`} value={`- ${money(order.discount)}`} />}
                  {order.shippingCost > 0 && <Line label="Shipping" value={money(order.shippingCost)} />}
                  {order.tax > 0 && <Line label="Tax" value={money(order.tax)} />}
                  <Line label="Total" value={money(order.total)} bold />
                </div>
              </div>
              {order.shipping && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">Ship to</div>
                  <div className="text-sm">{order.shipping.name}</div>
                  <div className="text-xs text-muted-foreground whitespace-pre-line">
                    {[order.shipping.line1, order.shipping.line2, [order.shipping.city, order.shipping.state, order.shipping.zip].filter(Boolean).join(" "), order.shipping.country].filter(Boolean).join("\n")}
                  </div>
                </div>
              )}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">Timeline</div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  {order.timeline.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
                      <span>{new Date(t.at).toLocaleString()} — {t.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-white/[0.06] flex items-center gap-2">
              <button onClick={onDelete} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300 text-xs"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              <button onClick={onRefund} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs">Refund</button>
              <button onClick={onFulfill} className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                <Check className="h-3.5 w-3.5" /> Mark fulfilled
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{label}</div>
      <div className="text-sm mt-1">{children}</div>
    </div>
  );
}
function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={cn("flex items-center justify-between", bold && "text-foreground font-semibold text-sm pt-1")}><span>{label}</span><span>{value}</span></div>;
}

export function OrdersPage() {
  const item = findItem("orders")!;
  const orders = useStoreData((s) => s.orders);
  const { fulfillOrder, refundOrder, removeOrder } = useStoreData.getState();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [selected, setSelected] = useState<Order | null>(null);

  const rows = orders.map((o) => ({
    __id: o.id, id: o.number, customer: o.customerName, email: o.customerEmail,
    total: money(o.total), status: o.status, date: dt(o.createdAt),
  }));
  const filtered = useFiltered(rows, query, active, ["id", "customer", "email", "status"]);
  const { page, pages, paged, setPage } = usePaged(filtered);
  const columns: Column[] = [
    { key: "id", label: "Order" },
    { key: "customer", label: "Customer" },
    { key: "email", label: "Email" },
    { key: "total", label: "Total" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date", className: "text-right" },
  ];
  const revenue = orders.reduce((s, o) => s + (o.status === "Refunded" ? 0 : o.total), 0);
  const stats: Stat[] = [
    { label: "Orders", value: String(orders.length) },
    { label: "Revenue", value: money(revenue) },
    { label: "Avg order", value: money(orders.length ? revenue / orders.length : 0) },
    { label: "Unfulfilled", value: String(orders.filter((o) => o.fulfillment !== "Fulfilled").length) },
  ];

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Orders" />
      <PageHeader icon={item.icon} title="Orders" subtitle="Every order placed through your storefront."
        primaryAction="Refresh" onPrimary={() => pushToast("info", "Data is live — updates automatically")}
        onExport={() => downloadCSV("orders", columns, filtered)} />
      <StatsRow stats={stats} />
      <Toolbar filters={["All", "Paid", "Unfulfilled", "Fulfilled", "Refunded", "Cancelled"]}
        active={active} onActive={(f) => { setActive(f); setPage(1); }}
        query={query} onQuery={(q) => { setQuery(q); setPage(1); }} />
      {paged.length ? (
        <>
          <DataTable columns={columns} rows={paged}
            onRowClick={(r) => { const o = orders.find((x) => x.id === (r as any).__id); if (o) setSelected(o); }}
            onAction={(a, r) => {
              const o = orders.find((x) => x.id === (r as any).__id); if (!o) return;
              if (a === "view" || a === "edit") setSelected(o);
              if (a === "duplicate") pushToast("info", "Orders cannot be duplicated");
              if (a === "delete") { removeOrder(o.id); pushToast("success", "Order deleted"); }
            }} />
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      ) : (
        <EmptyState title="No orders yet" desc="Orders will appear here as customers check out on your live storefront."
          action="View storefront" onAction={() => pushToast("info", "Publish your website to start receiving orders")} />
      )}
      <OrderDrawer order={selected} onClose={() => setSelected(null)}
        onFulfill={() => { if (selected) { fulfillOrder(selected.id); pushToast("success", `${selected.number} fulfilled`); setSelected(null); } }}
        onRefund={() => { if (selected) { refundOrder(selected.id); pushToast("success", `${selected.number} refunded`); setSelected(null); } }}
        onDelete={() => { if (selected) { removeOrder(selected.id); pushToast("success", `${selected.number} deleted`); setSelected(null); } }}
      />
    </div>
  );
}

/* ============================================================
 * CUSTOMERS
 * ============================================================ */
export type CustomersVariant = "all" | "portal" | "direct";

export function CustomersPage({ variant = "all" }: { variant?: CustomersVariant } = {}) {
  const item = findItem("customers")!;
  const { data: customerResponse, isLoading, isError, refetch } = useCustomers(variant === "all" ? undefined : variant);
  const customers = Array.isArray(customerResponse?.data) ? customerResponse.data : [];
  const orders = useStoreData((s) => s.orders);
  const { updateCustomer, removeCustomer } = useStoreData.getState();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("All");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => { if (selected) setEditNotes(selected.notes ?? ""); }, [selected]);

  // Infer type/status for legacy customers so filters and badges work retroactively.
  const enriched = useMemo(() => {
    return customers.map((c) => {
      const linkedOrders = orders.filter((o) => o.customerId === c.id);
      const lastOrderAt = c.lastOrderAt ?? (linkedOrders[0]?.createdAt);
      const type: CustomerType = c.type ?? (c.userId ? "portal" : "direct");
      const status: CustomerStatus = c.status ?? "active";
      return { ...c, type, status, lastOrderAt };
    });
  }, [customers, orders]);

  const scoped = useMemo(() => {
    if (variant === "portal") return enriched.filter((c) => c.type === "portal");
    if (variant === "direct") return enriched.filter((c) => c.type === "direct");
    return enriched;
  }, [enriched, variant]);

  const highSpendThreshold = useMemo(() => {
    if (!scoped.length) return Infinity;
    const totals = scoped.map((c) => c.totalSpent).sort((a, b) => b - a);
    return totals[Math.floor(totals.length * 0.2)] || 500;
  }, [scoped]);
  const newCutoff = Date.now() - 30 * 86400000;

  const filters = variant === "all"
    ? ["All", "Portal", "Direct", "Active", "Inactive", "High spending", "New"]
    : ["All", "Active", "Inactive", "High spending", "New"];

  const filteredByChip = useMemo(() => {
    switch (active) {
      case "Portal": return scoped.filter((c) => c.type === "portal");
      case "Direct": return scoped.filter((c) => c.type === "direct");
      case "Active": return scoped.filter((c) => c.status !== "inactive");
      case "Inactive": return scoped.filter((c) => c.status === "inactive");
      case "High spending": return scoped.filter((c) => c.totalSpent >= highSpendThreshold);
      case "New": return scoped.filter((c) => c.createdAt >= newCutoff);
      default: return scoped;
    }
  }, [scoped, active, highSpendThreshold, newCutoff]);

  const q = query.trim().toLowerCase();
  const searched = q
    ? filteredByChip.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
      )
    : filteredByChip;

  const rows = searched.map((c) => ({
    __id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "—",
    type: c.type === "portal" ? "Portal" : "Direct",
    orders: c.ordersCount,
    spent: money(c.totalSpent),
    lastOrder: c.lastOrderAt ? dt(c.lastOrderAt) : "—",
    status: c.status === "inactive" ? "Inactive" : "Active",
    joined: dt(c.createdAt),
  }));
  const { page, pages, paged, setPage } = usePaged(rows);

  const columns: Column[] = variant === "direct"
    ? [
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "orders", label: "Orders" },
        { key: "spent", label: "Spent" },
        { key: "lastOrder", label: "Last purchase", className: "text-right" },
      ]
    : variant === "portal"
    ? [
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "orders", label: "Orders" },
        { key: "spent", label: "Spent" },
        { key: "status", label: "Status" },
        { key: "joined", label: "Registered", className: "text-right" },
      ]
    : [
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "type", label: "Type" },
        { key: "orders", label: "Orders" },
        { key: "spent", label: "Spent" },
        { key: "lastOrder", label: "Last order" },
        { key: "status", label: "Status" },
        { key: "joined", label: "Joined", className: "text-right" },
      ];

  const stats: Stat[] = [
    { label: variant === "portal" ? "Portal customers" : variant === "direct" ? "Direct customers" : "Customers", value: String(scoped.length) },
    { label: "Repeat", value: String(scoped.filter((c) => c.ordersCount > 1).length) },
    { label: "Lifetime value", value: money(scoped.reduce((s, c) => s + c.totalSpent, 0)) },
    { label: "Avg spend", value: money(scoped.length ? scoped.reduce((s, c) => s + c.totalSpent, 0) / scoped.length : 0) },
  ];
  const customerOrders = (id: string) => orders.filter((o) => o.customerId === id);

  const title = variant === "portal" ? "Portal Customers" : variant === "direct" ? "Direct Customers" : "Customers";
  const subtitle = variant === "portal"
    ? "Registered shoppers who checked out while signed in."
    : variant === "direct"
    ? "Guests who purchased without creating an account."
    : "Every shopper who has placed an order — registered or guest.";

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label={title} parent={variant === "all" ? null : { label: "Customers", slug: "customers" }} />
      <PageHeader
        icon={item.icon}
        title={title}
        subtitle={subtitle}
        primaryAction="Refresh"
        onPrimary={() => { refetch(); pushToast("info", "Customer data refreshed"); }}
        onExport={() => downloadCSV(variant === "all" ? "customers" : `customers-${variant}`, columns, rows)}
      />
      {isLoading && <div className="text-sm text-muted-foreground">Loading customers...</div>}
      {isError && <div className="text-sm text-rose-300">Unable to load customers from the backend.</div>}
      <StatsRow stats={stats} />
      <Toolbar
        filters={filters}
        active={active}
        onActive={(f) => { setActive(f); setPage(1); }}
        query={query}
        onQuery={(v) => { setQuery(v); setPage(1); }}
      />
      {isLoading ? null : paged.length ? (
        <>
          <DataTable
            columns={columns}
            rows={paged}
            onRowClick={(r) => { const c = customers.find((x) => x.id === (r as any).__id); if (c) setSelected(c); }}
            onAction={(a, r) => {
              const c = customers.find((x) => x.id === (r as any).__id); if (!c) return;
              if (a === "view" || a === "edit") setSelected(c);
              if (a === "delete") { removeCustomer(c.id); pushToast("success", "Customer deleted"); }
            }}
          />
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title={variant === "portal" ? "No portal customers yet" : variant === "direct" ? "No guest customers yet" : "No customers yet"}
          desc={variant === "portal"
            ? "Customers appear here after they sign in and complete a checkout."
            : variant === "direct"
            ? "Customers appear here after checking out as a guest."
            : "Customer profiles are created automatically after the first order."}
          action="View orders"
          onAction={() => pushToast("info", "Visit Orders to see checkouts")}
        />
      )}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed top-0 right-0 z-50 h-screen w-full max-w-md glass-strong border-l border-white/10 flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {(selected.type ?? (selected.userId ? "portal" : "direct")) === "portal" ? "Portal customer" : "Direct customer"}
                  </div>
                  <div className="font-display text-lg font-semibold mt-0.5">{selected.name}</div>
                </div>
                <button onClick={() => setSelected(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
                <InfoTile label="Email">{selected.email}</InfoTile>
                {selected.phone && <InfoTile label="Phone">{selected.phone}</InfoTile>}
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile label="Orders">{selected.ordersCount}</InfoTile>
                  <InfoTile label="Total spent">{money(selected.totalSpent)}</InfoTile>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile label="Last order">{selected.lastOrderAt ? dt(selected.lastOrderAt) : "—"}</InfoTile>
                  <InfoTile label="Joined">{dt(selected.createdAt)}</InfoTile>
                </div>
                {(selected.type ?? (selected.userId ? "portal" : "direct")) === "portal" && (
                  <div className="grid grid-cols-2 gap-2">
                    <InfoTile label="Reward points">{selected.rewardPoints ?? 0}</InfoTile>
                    <InfoTile label="Last login">{selected.lastLoginAt ? dt(selected.lastLoginAt) : "—"}</InfoTile>
                  </div>
                )}
                {selected.addresses?.[0] && (
                  <InfoTile label="Address">
                    <div className="text-xs text-muted-foreground whitespace-pre-line">
                      {[selected.addresses[0].line1, selected.addresses[0].line2, [selected.addresses[0].city, selected.addresses[0].state, selected.addresses[0].zip].filter(Boolean).join(" "), selected.addresses[0].country].filter(Boolean).join("\n")}
                    </div>
                  </InfoTile>
                )}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">Recent orders</div>
                  {customerOrders(selected.id).length === 0 && <div className="text-xs text-muted-foreground">No orders yet.</div>}
                  <ul className="space-y-1.5">
                    {customerOrders(selected.id).slice(0, 8).map((o) => (
                      <li key={o.id} className="flex items-center justify-between text-xs">
                        <span>{o.number} · {dt(o.createdAt)}</span>
                        <span>{money(o.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Field label="Notes">
                  <textarea className={areaCls} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                </Field>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      const next: CustomerStatus = (selected.status ?? "active") === "active" ? "inactive" : "active";
                      updateCustomer(selected.id, { status: next });
                      setSelected({ ...selected, status: next });
                      pushToast("success", next === "inactive" ? "Account disabled" : "Account re-enabled");
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs"
                  >
                    {(selected.status ?? "active") === "active" ? "Disable account" : "Enable account"}
                  </button>
                  {(selected.type ?? (selected.userId ? "portal" : "direct")) === "direct" && (
                    <button
                      onClick={() => pushToast("info", "Invite to portal — coming soon")}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs"
                    >
                      Convert to portal
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-white/[0.06] flex items-center gap-2">
                <button onClick={() => { removeCustomer(selected.id); pushToast("success", "Customer deleted"); setSelected(null); }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300 text-xs"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                <button onClick={() => { updateCustomer(selected.id, { notes: editNotes }); pushToast("success", "Notes saved"); setSelected(null); }}
                  className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
 * INVENTORY
 * ============================================================ */
export function InventoryPage() {
  const item = findItem("inventory")!;

  // Use the new API-based hook with inventory data
  const { data: products = [], isLoading, isError, error, refetch } = useAllInventory();

  const { updateProduct } = useStoreData.getState();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <ToastHost />
        <Breadcrumb label="Inventory" />
        <PageHeader
  icon={item.icon}
  title="Inventory"
  subtitle="Live stock updates whenever a customer buys."
  primaryAction="Refresh"
/>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading inventory from Frappe...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <ToastHost />
        <Breadcrumb label="Inventory" />
       <PageHeader
  icon={item.icon}
  title="Inventory"
  subtitle="Live stock updates whenever a customer buys."
  primaryAction="Refresh"
/>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-rose-400">Failed to load inventory from Frappe</p>
            <p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
            <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // const products = useStoreData((s) => s.products); // Fallback for any other usage
  // const { updateProduct } = useStoreData.getState();
  // const [query, setQuery] = useState("");
  // const [active, setActive] = useState("All");

const view = useMemo(() => {
  let out = products.map((p) => ({
    __id: p.id,
    sku: p.sku,
    product: p.name,
    stock: p.stock,
    status:
      !p.trackInventory
        ? "Untracked"
        : p.stock <= 0
        ? "Out of stock"
        : p.stock < (p.lowStockThreshold ?? 10)
        ? "Low"
        : "In stock",
  }));

  if (active !== "All") {
    out = out.filter((r) =>
      r.status.toLowerCase().includes(active.toLowerCase())
    );
  }

  if (query.trim()) {
    const q = query.toLowerCase();

    out = out.filter(
      (r) =>
        r.product.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q)
    );
  }

  return out;
}, [products, active, query]);
  const { page, pages, paged, setPage } = usePaged(view);

  const columns: Column[] = [
  
    { key: "sku", label: "SKU" },
    { key: "product", label: "Product" },
    { key: "stock", label: "On hand" },
    { key: "status", label: "Status", className: "text-right" },
  ];
  const totalUnits = products.reduce((s, p) => s + (p.trackInventory !== false ? p.stock : 0), 0);
  const stats: Stat[] = [
    { label: "Units on hand", value: String(totalUnits) },
    { label: "SKUs", value: String(products.length) },
    { label: "Low stock", value: String(products.filter((p) => p.trackInventory !== false && p.stock > 0 && p.stock < 10).length) },
    { label: "Out of stock", value: String(products.filter((p) => p.trackInventory !== false && p.stock === 0).length) },
  ];

 return (
  <div className="space-y-6">
    <ToastHost />

    <Breadcrumb label="Inventory" />

    <PageHeader
      icon={item.icon}
      title="Inventory"
      subtitle="Live stock updates whenever a customer buys."
      primaryAction="Refresh"
      onPrimary={() => pushToast("info", "Inventory is live")}
      onExport={() => downloadCSV("inventory", columns, view)}
    />

    <StatsRow stats={stats} />

    <Toolbar
      filters={["All", "In stock", "Low", "Out"]}
      active={active}
      onActive={(f) => {
        setActive(f);
        setPage(1);
      }}
      query={query}
      onQuery={(q) => {
        setQuery(q);
        setPage(1);
      }}
    />

    {paged.length ? (
      <>
        <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={cn(
                        "px-4 py-3 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium",
                        c.className
                      )}
                    >
                      {c.label}
                    </th>
                  ))}

                  <th className="w-40 text-right pr-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium">
                    Adjust
                  </th>
                </tr>
              </thead>

              <tbody>
                {paged.map((r) => (
                  <tr
                    key={r.__id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03]"
                  >
                    {/* SKU */}
                    <td className="px-4 py-3 text-[13px]">
                      {r.sku}
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3 text-[13px]">
                      {r.product}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 text-[13px]">
                      <input
                        type="number"
                        className="h-8 w-24 px-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                        value={r.stock}
                        onChange={(e) =>
                          updateProduct(r.__id, {
                            stock: Math.max(0, Number(e.target.value)),
                          })
                        }
                      />
                    </td>

                    {/* Status */}
                    <td
                      className={cn(
                        "px-4 py-3 text-[13px]",
                        columns[4].className
                      )}
                    >
                      <StatusPill label={r.status} />
                    </td>

                    {/* Buttons */}
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() =>
                          updateProduct(r.__id, {
                            stock: r.stock + 10,
                          })
                        }
                        className="h-7 px-2 rounded-lg glass hover:bg-white/10 text-xs"
                      >
                        +10
                      </button>

                      <button
                        onClick={() =>
                          updateProduct(r.__id, {
                            stock: Math.max(0, r.stock - 10),
                          })
                        }
                        className="h-7 px-2 rounded-lg glass hover:bg-white/10 text-xs"
                      >
                        -10
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} pages={pages} onPage={setPage} />
      </>
    ) : (
      <EmptyState
        title="No inventory yet"
        desc="Add products to see live stock levels."
        action="Add product"
        onAction={() =>
          pushToast("info", "Go to Products to add one")
        }
      />
    )}
  </div>
);
}


/* ============================================================
 * MEDIA LIBRARY (connected)
 * ============================================================ */
export function ConnectedMediaLibrary() {
  const item = findItem("media")!;
  const media = useStoreData((s) => s.media);
  const folders = useStoreData((s) => s.mediaFolders);
  const products = useStoreData((s) => s.products);
  const st = useStoreData.getState();
  const siteState = useSiteStore.getState();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"All" | "Images" | "Videos" | "SVG" | "Documents" | "Unused">("All");
  const [sort, setSort] = useState<"newest" | "oldest" | "az" | "largest" | "smallest" | "mostused">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<MediaAsset | null>(null);
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [drag, setDrag] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Usage index: assetUrl -> list of "where"
  const usageIndex = useMemo(() => {
    const map = new Map<string, string[]>();
    const push = (url: string, where: string) => {
      if (!url) return;
      const arr = map.get(url) ?? [];
      if (!arr.includes(where)) arr.push(where);
      map.set(url, arr);
    };
    for (const p of products) {
      (p.images ?? []).forEach((u) => push(u, `Product · ${p.name}`));
      (p.variants ?? []).forEach((v) => v.image && push(v.image, `Variant · ${p.name}`));
    }
    if (siteState.logoUrl) push(siteState.logoUrl, "Store · Logo");
    for (const page of siteState.pages ?? []) {
      for (const s of page.sections ?? []) {
        const walk = (val: any) => {
          if (typeof val === "string" && (val.startsWith("data:") || val.startsWith("http") || val.startsWith("/"))) {
            if (/\.(png|jpe?g|webp|avif|svg|gif|mp4|webm|pdf)/i.test(val) || val.startsWith("data:")) {
              push(val, `Page · ${page.label || page.slug} · ${s.type}`);
            }
          } else if (Array.isArray(val)) val.forEach(walk);
          else if (val && typeof val === "object") Object.values(val).forEach(walk);
        };
        walk((s as any).data);
      }
    }
    return map;
  }, [products, siteState]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const added = await uploadFilesToLibrary(files, { folderId });
    if (added.length) pushToast("success", `${added.length} file${added.length === 1 ? "" : "s"} uploaded`);
  };

  const filtered = useMemo(() => {
    let arr = media.slice();
    arr = arr.filter((m) => (m.folderId ?? null) === folderId);
    if (kindFilter !== "All") {
      arr = arr.filter((m) => {
        if (kindFilter === "Images") return m.kind === "image" && !/svg/i.test(m.mimeType ?? "");
        if (kindFilter === "Videos") return m.kind === "video";
        if (kindFilter === "SVG") return /svg/i.test(m.mimeType ?? "") || /\.svg$/i.test(m.name);
        if (kindFilter === "Documents") return m.kind === "doc";
        if (kindFilter === "Unused") return !usageIndex.has(m.url);
        return true;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((m) => m.name.toLowerCase().includes(q)
        || (m.alt ?? "").toLowerCase().includes(q)
        || (m.tags ?? []).some((t) => t.toLowerCase().includes(q)));
    }
    const useCount = (m: MediaAsset) => usageIndex.get(m.url)?.length ?? 0;
    arr.sort((a, b) => {
      if (sort === "newest") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      if (sort === "oldest") return (a.createdAt ?? 0) - (b.createdAt ?? 0);
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "largest") return b.size - a.size;
      if (sort === "smallest") return a.size - b.size;
      if (sort === "mostused") return useCount(b) - useCount(a);
      return 0;
    });
    return arr;
  }, [media, folderId, kindFilter, query, sort, usageIndex]);

  const toggleSel = (id: string) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  const clearSel = () => setSelected([]);

  const totalSize = media.reduce((s, m) => s + m.size, 0);
  const currentFolder = folders.find((f) => f.id === folderId) ?? null;

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    st.addFolder(newFolderName.trim(), folderId);
    setNewFolderName(""); setNewFolderOpen(false);
    pushToast("success", "Folder created");
  };

  const bulkDelete = () => {
    st.removeManyMedia(selected);
    pushToast("success", `${selected.length} asset${selected.length === 1 ? "" : "s"} removed`);
    clearSel();
  };
  const bulkMove = (target: string | null) => {
    st.moveMediaToFolder(selected, target);
    pushToast("success", "Moved");
    clearSel();
  };

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Media Library" />
      <PageHeader icon={item.icon} title="Media Library"
        subtitle="One source of truth. Every product, page and template reads from here."
        primaryAction="Upload" onPrimary={() => inputRef.current?.click()}
        onExport={() => pushToast("info", "Media is stored locally")} />
      <input ref={inputRef} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />

      <StatsRow stats={[
        { label: "Assets", value: String(media.length) },
        { label: "Folders", value: String(folders.length) },
        { label: "Storage used", value: fmtBytes(totalSize) },
        { label: "Unused", value: String(media.filter((m) => !usageIndex.has(m.url)).length) },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Folder sidebar */}
        <div className="glass rounded-2xl border border-white/10 p-3 h-fit">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Folders</div>
            <button onClick={() => setNewFolderOpen(true)} className="h-6 w-6 rounded-md hover:bg-white/10 grid place-items-center" title="New folder">
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => setFolderId(null)}
            className={cn("w-full flex items-center gap-2 h-8 px-2 rounded-lg text-sm text-left", folderId === null ? "bg-white/10" : "hover:bg-white/5")}>
            <FolderIcon className="h-3.5 w-3.5" /> All files
            <span className="ml-auto text-[10px] text-muted-foreground">{media.filter((m) => !m.folderId).length}</span>
          </button>
          {folders.map((f) => (
            <div key={f.id} className={cn("group flex items-center gap-2 h-8 px-2 rounded-lg", folderId === f.id ? "bg-white/10" : "hover:bg-white/5")}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/media-id");
                if (id) { st.moveMediaToFolder([id], f.id); pushToast("success", `Moved to ${f.name}`); }
              }}>
              <button onClick={() => setFolderId(f.id)} className="flex-1 flex items-center gap-2 text-sm text-left">
                <FolderIcon className="h-3.5 w-3.5" /> {f.name}
                <span className="ml-auto text-[10px] text-muted-foreground">{media.filter((m) => m.folderId === f.id).length}</span>
              </button>
              <button onClick={() => {
                const name = prompt("Rename folder", f.name);
                if (name?.trim()) st.renameFolder(f.id, name.trim());
              }} className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-white/10 grid place-items-center" title="Rename">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => {
                if (confirm(`Delete folder "${f.name}"? Files inside will be moved to All files.`)) {
                  st.removeFolder(f.id); if (folderId === f.id) setFolderId(null);
                }
              }} className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded hover:bg-white/10 grid place-items-center text-rose-400" title="Delete">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {newFolderOpen && (
            <div className="mt-2 flex gap-1">
              <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setNewFolderOpen(false); }}
                placeholder="Folder name"
                className="flex-1 h-7 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none" />
              <button onClick={createFolder} className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-xs">Add</button>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="glass rounded-2xl border border-white/10 p-2 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, alt or tag…"
                className="w-full h-8 pl-7 pr-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs outline-none" />
            </div>
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)}
              className="h-8 px-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs outline-none">
              {["All","Images","Videos","SVG","Documents","Unused"].map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}
              className="h-8 px-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A → Z</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
              <option value="mostused">Most used</option>
            </select>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button onClick={() => setView("grid")} className={cn("h-8 w-8 grid place-items-center", view === "grid" ? "bg-white/10" : "hover:bg-white/5")}><GridIcon className="h-3.5 w-3.5" /></button>
              <button onClick={() => setView("list")} className={cn("h-8 w-8 grid place-items-center", view === "list" ? "bg-white/10" : "hover:bg-white/5")}><ListIcon className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="glass rounded-xl border border-white/10 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
              <span>{selected.length} selected</span>
              <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                <select onChange={(e) => { if (e.target.value) bulkMove(e.target.value === "__root" ? null : e.target.value); e.currentTarget.value = ""; }}
                  className="h-7 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs">
                  <option value="">Move to…</option>
                  <option value="__root">All files</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
                <button onClick={bulkDelete} className="h-7 px-2 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
                <button onClick={clearSel} className="h-7 px-2 rounded-md border border-white/10">Cancel</button>
              </div>
            </div>
          )}

          {/* Drop zone / content */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
            className={cn("rounded-2xl transition min-h-[280px]", drag && "ring-2 ring-primary/50 bg-primary/5")}
          >
            {filtered.length === 0 ? (
              <EmptyState title={currentFolder ? `${currentFolder.name} is empty` : "No media yet"}
                desc="Drop files here or use the Upload button. Reused everywhere in your store."
                action="Upload files" onAction={() => inputRef.current?.click()} />
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filtered.map((m) => {
                  const uses = usageIndex.get(m.url) ?? [];
                  const isSel = selected.includes(m.id);
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      draggable onDragStart={(e: any) => e.dataTransfer?.setData("text/media-id", m.id)}
                      className={cn("group relative rounded-2xl overflow-hidden border bg-white/[0.03] cursor-pointer",
                        isSel ? "border-primary ring-2 ring-primary/40" : "border-white/10 hover:border-white/20")}
                      onClick={(e) => { if ((e as any).shiftKey || (e as any).metaKey || (e as any).ctrlKey) toggleSel(m.id); else setDetail(m); }}
                    >
                      <div className="relative aspect-square">
                        <MediaThumb asset={m} className="h-full w-full" />
                        <button onClick={(e) => { e.stopPropagation(); toggleSel(m.id); }}
                          className={cn("absolute top-2 left-2 h-5 w-5 rounded-md border grid place-items-center transition",
                            isSel ? "bg-primary border-primary" : "bg-black/40 border-white/30 opacity-0 group-hover:opacity-100")}>
                          {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                        </button>
                        {uses.length > 0 && (
                          <span className="absolute top-2 right-2 h-5 px-1.5 rounded-full text-[9px] font-medium bg-emerald-500/80 text-white grid place-items-center">
                            {uses.length}×
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setPreview(m); }} className="h-6 w-6 rounded bg-white/20 backdrop-blur grid place-items-center" title="Preview"><Eye className="h-3 w-3 text-white" /></button>
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(m.url); pushToast("success", "URL copied"); }} className="h-6 w-6 rounded bg-white/20 backdrop-blur grid place-items-center" title="Copy URL"><LinkIcon className="h-3 w-3 text-white" /></button>
                          <button onClick={(e) => { e.stopPropagation(); st.duplicateMedia(m.id); pushToast("success", "Duplicated"); }} className="h-6 w-6 rounded bg-white/20 backdrop-blur grid place-items-center" title="Duplicate"><Copy className="h-3 w-3 text-white" /></button>
                          <a href={m.url} download={m.name} onClick={(e) => e.stopPropagation()} className="h-6 w-6 rounded bg-white/20 backdrop-blur grid place-items-center" title="Download"><Download className="h-3 w-3 text-white" /></a>
                          <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${m.name}"?`)) { st.removeMedia(m.id); pushToast("success", "Removed"); } }} className="ml-auto h-6 w-6 rounded bg-rose-500/80 grid place-items-center" title="Delete"><Trash2 className="h-3 w-3 text-white" /></button>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] font-medium truncate">{m.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {m.width && m.height ? <span>{m.width}×{m.height}</span> : <span className="uppercase">{m.kind}</span>}
                          <span>·</span><span>{fmtBytes(m.size)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                <div className="grid grid-cols-[24px_60px_1fr_100px_110px_80px_60px] items-center gap-3 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-white/10">
                  <div></div><div>Preview</div><div>Name</div><div>Size</div><div>Dimensions</div><div>Used</div><div></div>
                </div>
                {filtered.map((m) => {
                  const uses = usageIndex.get(m.url) ?? [];
                  const isSel = selected.includes(m.id);
                  return (
                    <div key={m.id} className={cn("grid grid-cols-[24px_60px_1fr_100px_110px_80px_60px] items-center gap-3 px-3 py-2 border-b border-white/5 hover:bg-white/[0.03] cursor-pointer text-xs",
                      isSel && "bg-primary/10")} onClick={() => setDetail(m)}>
                      <button onClick={(e) => { e.stopPropagation(); toggleSel(m.id); }}
                        className={cn("h-4 w-4 rounded border grid place-items-center", isSel ? "bg-primary border-primary" : "border-white/30")}>
                        {isSel && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </button>
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-white/5"><MediaThumb asset={m} className="h-full w-full" /></div>
                      <div className="truncate"><div className="truncate font-medium">{m.name}</div><div className="text-[10px] text-muted-foreground truncate">{m.alt || m.mimeType || m.kind}</div></div>
                      <div className="text-muted-foreground">{fmtBytes(m.size)}</div>
                      <div className="text-muted-foreground">{m.width && m.height ? `${m.width}×${m.height}` : "—"}</div>
                      <div>{uses.length ? <span className="inline-flex h-5 px-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] items-center">{uses.length}</span> : <span className="text-muted-foreground">—</span>}</div>
                      <div className="flex justify-end">
                        <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${m.name}"?`)) { st.removeMedia(m.id); pushToast("success", "Removed"); } }} className="h-6 w-6 rounded hover:bg-rose-500/20 grid place-items-center text-rose-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {detail && (
          <MediaDetailPanel asset={detail} usage={usageIndex.get(detail.url) ?? []} onClose={() => setDetail(null)}
            onPreview={() => setPreview(detail)} />
        )}
      </AnimatePresence>

      {/* Fullscreen preview */}
      <AnimatePresence>
        {preview && <MediaPreviewModal asset={preview} onClose={() => setPreview(null)} />}
      </AnimatePresence>

      <UploadQueueBar />
    </div>
  );
}

function MediaDetailPanel({ asset, usage, onClose, onPreview }: {
  asset: MediaAsset; usage: string[]; onClose: () => void; onPreview: () => void;
}) {
  const st = useStoreData.getState();
  const folders = useStoreData((s) => s.mediaFolders);
  const [name, setName] = useState(asset.name);
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const [description, setDescription] = useState(asset.description ?? "");
  const [tags, setTags] = useState((asset.tags ?? []).join(", "));
  const [folderId, setFolderId] = useState<string | "">(asset.folderId ?? "");

  useEffect(() => {
    setName(asset.name); setAlt(asset.alt ?? ""); setCaption(asset.caption ?? "");
    setDescription(asset.description ?? ""); setTags((asset.tags ?? []).join(", "));
    setFolderId(asset.folderId ?? "");
  }, [asset.id]);

  const save = () => {
    st.updateMedia(asset.id, {
      name: name.trim() || asset.name, alt, caption, description,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      folderId: folderId || null,
    });
    pushToast("success", "Saved");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex justify-end">
      <motion.div initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }} onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md glass border-l border-white/10 overflow-y-auto">
        <div className="sticky top-0 z-10 backdrop-blur bg-background/70 border-b border-white/10 flex items-center justify-between p-4">
          <div className="font-semibold text-sm truncate">{asset.name}</div>
          <button onClick={onClose} className="h-7 w-7 rounded-md hover:bg-white/10 grid place-items-center"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <button onClick={onPreview} className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] group">
            <MediaThumb asset={asset} className="h-full w-full" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition grid place-items-center">
              <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100" />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Info label="Size" value={fmtBytes(asset.size)} />
            <Info label="Type" value={asset.mimeType ?? asset.kind} />
            {asset.width && asset.height && <Info label="Dimensions" value={`${asset.width}×${asset.height}`} />}
            <Info label="Uploaded" value={new Date(asset.createdAt).toLocaleDateString()} />
          </div>

          <div className="flex gap-1.5">
            <button onClick={() => { navigator.clipboard?.writeText(asset.url); pushToast("success", "URL copied"); }} className="flex-1 h-8 rounded-lg glass border border-white/10 text-xs inline-flex items-center justify-center gap-1"><LinkIcon className="h-3 w-3" /> Copy URL</button>
            <a href={asset.url} download={asset.name} className="flex-1 h-8 rounded-lg glass border border-white/10 text-xs inline-flex items-center justify-center gap-1"><Download className="h-3 w-3" /> Download</a>
            <button onClick={() => { st.duplicateMedia(asset.id); pushToast("success", "Duplicated"); }} className="h-8 w-8 rounded-lg glass border border-white/10 grid place-items-center" title="Duplicate"><Copy className="h-3 w-3" /></button>
          </div>

          <Field2 label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className="w-full h-8 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none" /></Field2>
          <Field2 label="Alt text"><input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe this image for screen readers"
            className="w-full h-8 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none" /></Field2>
          <Field2 label="Caption"><input value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full h-8 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none" /></Field2>
          <Field2 label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
            className="w-full px-2 py-1.5 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none resize-none" /></Field2>
          <Field2 label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hero, banner, marketing"
            className="w-full h-8 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none" /></Field2>
          <Field2 label="Folder">
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="w-full h-8 px-2 rounded-md bg-white/[0.05] border border-white/10 text-xs outline-none">
              <option value="">All files (root)</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field2>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Used in ({usage.length})</div>
            {usage.length ? (
              <ul className="space-y-1">{usage.map((u, i) => <li key={i} className="text-[11px] px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/10">{u}</li>)}</ul>
            ) : <div className="text-[11px] text-muted-foreground">Not used anywhere yet.</div>}
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button onClick={save} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Save changes</button>
            <button onClick={() => { if (confirm(`Delete "${asset.name}"?`)) { st.removeMedia(asset.id); pushToast("success", "Removed"); onClose(); } }}
              className="h-9 px-3 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5">
    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="truncate">{value}</div>
  </div>;
}
function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>{children}</label>;
}

function MediaPreviewModal({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between p-3 text-white text-xs" onClick={(e) => e.stopPropagation()}>
        <div className="truncate">{asset.name} · {fmtBytes(asset.size)}{asset.width ? ` · ${asset.width}×${asset.height}` : ""}</div>
        <div className="flex items-center gap-1">
          {asset.kind === "image" && (<>
            <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="h-8 w-8 rounded hover:bg-white/10 grid place-items-center"><ZoomOut className="h-4 w-4" /></button>
            <span className="w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="h-8 w-8 rounded hover:bg-white/10 grid place-items-center"><ZoomIn className="h-4 w-4" /></button>
            <button onClick={() => setRot((r) => r + 90)} className="h-8 w-8 rounded hover:bg-white/10 grid place-items-center"><RotateCw className="h-4 w-4" /></button>
          </>)}
          <a href={asset.url} download={asset.name} onClick={(e) => e.stopPropagation()} className="h-8 w-8 rounded hover:bg-white/10 grid place-items-center"><Download className="h-4 w-4" /></a>
          <button onClick={onClose} className="h-8 w-8 rounded hover:bg-white/10 grid place-items-center"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 grid place-items-center overflow-auto p-4" onClick={onClose}>
        {asset.kind === "image" ? (
          <img src={asset.url} alt={asset.alt || asset.name} onClick={(e) => e.stopPropagation()}
            style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
            className="max-w-full max-h-full object-contain transition-transform" />
        ) : asset.kind === "video" ? (
          <video src={asset.url} controls autoPlay onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full" />
        ) : (
          <div className="text-white text-sm">Preview not available. <a href={asset.url} download={asset.name} className="underline">Download</a></div>
        )}
      </div>
    </motion.div>
  );
}

