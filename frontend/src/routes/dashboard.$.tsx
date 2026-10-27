import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight, Search, SlidersHorizontal, Download, Plus, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, ChevronLeft, Sparkles,
  Eye, Pencil, Copy, Trash2, X, Check, AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { findItem, NAV } from "@/components/dashboard/nav-config";
import { cn } from "@/lib/utils";
import { FloatingLayer } from "@/components/ui/floating-menu";
import {
  ProductsPage as ConnectedProducts,
  CategoriesPage as ConnectedCategories,
  CollectionsPage as ConnectedCollections,
  CustomersPage as ConnectedCustomers,
  InventoryPage as ConnectedInventory,
  ConnectedMediaLibrary as ConnectedMediaLibraryPage,
} from "@/components/dashboard/connected-pages";
import { OrdersManagementPage, OrderDetailsPage, AbandonedCheckoutsPage } from "@/components/dashboard/orders-management";
import { InventoryManagementPage } from "@/components/dashboard/inventory-management";
import { PurchaseOrdersPage } from "@/components/dashboard/purchase-orders-page";
import { PurchaseInvoicesPage } from "@/components/dashboard/purchase-invoices-page";
import { SalesInvoicesPage } from "@/components/dashboard/sale-invoices-page";
import { GrowthDashboardPage, AttributionPage, CampaignsPage } from "@/components/dashboard/growth";
import { OnlineStorePage } from "@/components/dashboard/online-store";
import React from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsData } from "@/api/analytics";



export const Route = createFileRoute("/dashboard/$")({
  component: DashboardCatchAll,
});

/* ============================================================
 * Toast system (module-local, simple)
 * ============================================================ */
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
let toastId = 0;
const toastListeners = new Set<(t: Toast) => void>();
export function pushToast(kind: Toast["kind"], text: string) {
  const t: Toast = { id: ++toastId, kind, text };
  toastListeners.forEach((l) => l(t));
}
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l = (t: Toast) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== t.id)), 3200);
    };
    toastListeners.add(l);
    return () => { toastListeners.delete(l); };
  }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-2 rounded-xl glass-strong border border-white/10 px-4 py-2.5 text-xs shadow-glow">
            {t.kind === "success" && <Check className="h-3.5 w-3.5 text-emerald-300" />}
            {t.kind === "error" && <AlertCircle className="h-3.5 w-3.5 text-rose-300" />}
            {t.kind === "info" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
 * Types + per-slug config
 * ============================================================ */

export type Stat = { label: string; value: string; delta?: string; trend?: "up" | "down" };
export type Column = { key: string; label: string; className?: string };
export type Row = Record<string, string | number>;
type PageConfig = {
  subtitle: string;
  primaryAction: string;
  filters: string[];
  stats: Stat[];
  columns: Column[];
  rows: Row[];
  empty?: { title: string; desc: string };
};

const PAGES: Record<string, PageConfig> = {
  projects: {
    subtitle: "Every workspace, site and store you're building.",
    primaryAction: "New project",
    filters: ["All", "Active", "Draft", "Archived"],
    stats: [
      { label: "Active projects", value: "18", delta: "+3", trend: "up" },
      { label: "In draft", value: "4" },
      { label: "Deploys this week", value: "27", delta: "+12%", trend: "up" },
      { label: "Contributors", value: "9" },
    ],
    columns: [
      { key: "name", label: "Project" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status" },
      { key: "updated", label: "Updated", className: "text-right" },
    ],
    rows: [
      { name: "Aether Autumn 2026", owner: "You",       status: "Active",   updated: "2h ago" },
      { name: "Nordic Ceramics",     owner: "M. Lund",   status: "Draft",    updated: "Yesterday" },
      { name: "Field & Forge",       owner: "R. Aoki",   status: "Active",   updated: "3d ago" },
      { name: "Halo Skincare",       owner: "T. Rivera", status: "Active",   updated: "1w ago" },
      { name: "Lumen Studio",        owner: "You",       status: "Archived", updated: "2w ago" },
      { name: "Verse & Vinyl",       owner: "J. Park",   status: "Active",   updated: "5h ago" },
    ],
  },

  orders: {
    subtitle: "Fulfil, refund and track every order.",
    primaryAction: "Create order",
    filters: ["All", "Unfulfilled", "Paid", "Refunded", "Cancelled"],
    stats: [
      { label: "Orders today",       value: "142", delta: "+18%", trend: "up" },
      { label: "Gross sales",        value: "$28,412", delta: "+9.2%", trend: "up" },
      { label: "Average order",      value: "$96.40", delta: "-1.1%", trend: "down" },
      { label: "Pending fulfilment", value: "23" },
    ],
    columns: [
      { key: "id", label: "Order" },
      { key: "customer", label: "Customer" },
      { key: "total", label: "Total" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date", className: "text-right" },
    ],
    rows: [
      { id: "#10842", customer: "Amelia Wells",   total: "$128.00", status: "Paid",        date: "2 min ago" },
      { id: "#10841", customer: "Ravi Menon",      total: "$62.50",  status: "Unfulfilled", date: "12 min ago" },
      { id: "#10840", customer: "Sofia Álvarez",   total: "$248.90", status: "Paid",        date: "34 min ago" },
      { id: "#10839", customer: "Kenji Watanabe",  total: "$54.00",  status: "Refunded",    date: "1h ago" },
      { id: "#10838", customer: "Priya Anand",     total: "$412.00", status: "Paid",        date: "2h ago" },
      { id: "#10837", customer: "Luca Bianchi",    total: "$88.20",  status: "Cancelled",   date: "3h ago" },
      { id: "#10836", customer: "Nia Okafor",      total: "$146.75", status: "Paid",        date: "5h ago" },
    ],
  },

  products: {
    subtitle: "Everything you sell — physical, digital and services.",
    primaryAction: "Add product",
    filters: ["All", "Active", "Draft", "Out of stock"],
    stats: [
      { label: "Products",  value: "348", delta: "+12", trend: "up" },
      { label: "Active",    value: "312" },
      { label: "Low stock", value: "9",   trend: "down" },
      { label: "SKUs",      value: "1,204" },
    ],
    columns: [
      { key: "name",  label: "Product" },
      { key: "sku",   label: "SKU" },
      { key: "price", label: "Price" },
      { key: "stock", label: "Stock" },
      { key: "status", label: "Status", className: "text-right" },
    ],
    rows: [
      { name: "Runner Pro Knit",     sku: "RP-001", price: "$149.00", stock: 214, status: "Active" },
      { name: "Cloud Merino Tee",    sku: "CM-244", price: "$48.00",  stock: 512, status: "Active" },
      { name: "Trail Insulated Jkt", sku: "TI-013", price: "$298.00", stock: 12,  status: "Active" },
      { name: "Everyday Tote",       sku: "ET-091", price: "$68.00",  stock: 0,   status: "Out of stock" },
      { name: "Studio Ceramic Cup",  sku: "SC-118", price: "$32.00",  stock: 87,  status: "Draft" },
      { name: "Field Cap",           sku: "FC-207", price: "$28.00",  stock: 340, status: "Active" },
    ],
  },

  categories: {
    subtitle: "Organise your catalog into browseable groups.",
    primaryAction: "New category",
    filters: ["All", "Featured", "Hidden"],
    stats: [
      { label: "Categories",     value: "24" },
      { label: "Featured",       value: "6" },
      { label: "Avg products",   value: "14" },
      { label: "Deepest tree",   value: "3 levels" },
    ],
    columns: [
      { key: "name",     label: "Category" },
      { key: "parent",   label: "Parent" },
      { key: "products", label: "Products" },
      { key: "visible",  label: "Visibility", className: "text-right" },
    ],
    rows: [
      { name: "Footwear",    parent: "—",         products: 42, visible: "Public" },
      { name: "Sneakers",    parent: "Footwear",  products: 26, visible: "Public" },
      { name: "Boots",       parent: "Footwear",  products: 12, visible: "Public" },
      { name: "Apparel",     parent: "—",         products: 88, visible: "Public" },
      { name: "Accessories", parent: "—",         products: 34, visible: "Public" },
      { name: "Sale Corner", parent: "—",         products: 19, visible: "Hidden" },
    ],
  },

  collections: {
    subtitle: "Curated groups of products for merchandising and campaigns.",
    primaryAction: "New collection",
    filters: ["All", "Automated", "Manual", "Scheduled"],
    stats: [
      { label: "Collections",   value: "31" },
      { label: "Automated",     value: "18" },
      { label: "Scheduled",     value: "4" },
      { label: "Conversion",    value: "3.8%", delta: "+0.4%", trend: "up" },
    ],
    columns: [
      { key: "name",     label: "Collection" },
      { key: "type",     label: "Type" },
      { key: "products", label: "Products" },
      { key: "updated",  label: "Updated", className: "text-right" },
    ],
    rows: [
      { name: "Autumn Essentials",    type: "Manual",    products: 24, updated: "Today" },
      { name: "Under $50",            type: "Automated", products: 96, updated: "1d ago" },
      { name: "New Arrivals",         type: "Automated", products: 42, updated: "2h ago" },
      { name: "Weekend Drop",         type: "Scheduled", products: 12, updated: "In 3d" },
      { name: "Gifts for Runners",    type: "Manual",    products: 18, updated: "5d ago" },
    ],
  },

  inventory: {
    subtitle: "Live stock levels across every location and channel.",
    primaryAction: "Adjust inventory",
    filters: ["All", "In stock", "Low", "Out"],
    stats: [
      { label: "Units on hand", value: "48,213" },
      { label: "Low stock",     value: "16", delta: "-3", trend: "down" },
      { label: "Committed",     value: "1,204" },
      { label: "Inbound",       value: "3,800" },
    ],
    columns: [
      { key: "sku",       label: "SKU" },
      { key: "product",   label: "Product" },
      { key: "location",  label: "Location" },
      { key: "onhand",    label: "On hand" },
      { key: "status",    label: "Status", className: "text-right" },
    ],
    rows: [
      { sku: "RP-001-42", product: "Runner Pro 42",  location: "Berlin",  onhand: 84,  status: "In stock" },
      { sku: "RP-001-43", product: "Runner Pro 43",  location: "Berlin",  onhand: 12,  status: "Low" },
      { sku: "CM-244-M",  product: "Merino Tee M",   location: "Tokyo",   onhand: 0,   status: "Out" },
      { sku: "TI-013-L",  product: "Trail Jacket L", location: "NYC",     onhand: 6,   status: "Low" },
      { sku: "ET-091",    product: "Everyday Tote",  location: "Berlin",  onhand: 220, status: "In stock" },
    ],
  },

  discounts: {
    subtitle: "Codes, automatic promotions and campaign bundles.",
    primaryAction: "Create discount",
    filters: ["All", "Active", "Scheduled", "Expired"],
    stats: [
      { label: "Active codes",  value: "12" },
      { label: "Redemptions",   value: "3,214", delta: "+22%", trend: "up" },
      { label: "Revenue lift",  value: "$18,420" },
      { label: "Avg discount",  value: "-14%" },
    ],
    columns: [
      { key: "code",   label: "Code" },
      { key: "type",   label: "Type" },
      { key: "value",  label: "Value" },
      { key: "uses",   label: "Uses" },
      { key: "status", label: "Status", className: "text-right" },
    ],
    rows: [
      { code: "AUTUMN20",   type: "Percentage", value: "20% off",  uses: 812, status: "Active" },
      { code: "FREESHIP",   type: "Shipping",   value: "Free",     uses: 2140, status: "Active" },
      { code: "WELCOME10",  type: "Amount",     value: "$10",      uses: 92,  status: "Active" },
      { code: "VIP-EARLY",  type: "Percentage", value: "30% off",  uses: 0,   status: "Scheduled" },
      { code: "SUMMER15",   type: "Percentage", value: "15% off",  uses: 1_204, status: "Expired" },
    ],
  },

  payments: {
    subtitle: "Providers, payouts and disputes across every gateway.",
    primaryAction: "Add provider",
    filters: ["All", "Succeeded", "Refunded", "Failed"],
    stats: [
      { label: "Processed (30d)", value: "$412,890", delta: "+11%", trend: "up" },
      { label: "Next payout",     value: "$28,412" },
      { label: "Refund rate",     value: "1.8%", delta: "-0.3%", trend: "down" },
      { label: "Disputes open",   value: "2" },
    ],
    columns: [
      { key: "id",        label: "Transaction" },
      { key: "provider",  label: "Provider" },
      { key: "amount",    label: "Amount" },
      { key: "status",    label: "Status" },
      { key: "date",      label: "Date", className: "text-right" },
    ],
    rows: [
      { id: "tx_8H2Q", provider: "Stripe", amount: "$128.00", status: "Succeeded", date: "2 min ago" },
      { id: "tx_8H2P", provider: "PayPal", amount: "$62.50",  status: "Succeeded", date: "18 min ago" },
      { id: "tx_8H2N", provider: "Stripe", amount: "$54.00",  status: "Refunded",  date: "1h ago" },
      { id: "tx_8H2M", provider: "Stripe", amount: "$412.00", status: "Succeeded", date: "2h ago" },
      { id: "tx_8H2L", provider: "Klarna", amount: "$88.20",  status: "Failed",    date: "3h ago" },
    ],
  },

  shipping: {
    subtitle: "Carriers, zones and rates that customers see at checkout.",
    primaryAction: "New rate",
    filters: ["All", "Domestic", "International"],
    stats: [
      { label: "Carriers",       value: "5" },
      { label: "Zones",          value: "12" },
      { label: "Avg cost",       value: "$6.80" },
      { label: "Free-ship rate", value: "38%" },
    ],
    columns: [
      { key: "zone",    label: "Zone" },
      { key: "carrier", label: "Carrier" },
      { key: "service", label: "Service" },
      { key: "rate",    label: "Rate" },
      { key: "eta",     label: "ETA", className: "text-right" },
    ],
    rows: [
      { zone: "US Domestic",  carrier: "UPS",     service: "Ground",       rate: "$6.00",   eta: "3–5 days" },
      { zone: "US Domestic",  carrier: "UPS",     service: "2-Day",        rate: "$14.00",  eta: "2 days" },
      { zone: "EU",           carrier: "DHL",     service: "Express",      rate: "€12.00",  eta: "2–3 days" },
      { zone: "UK",           carrier: "Royal",   service: "Tracked 48",   rate: "£4.50",   eta: "2 days" },
      { zone: "APAC",         carrier: "FedEx",   service: "Intl Economy", rate: "$28.00",  eta: "5–7 days" },
    ],
  },

  customers: {
    subtitle: "Everyone who has ever bought or engaged with your brand.",
    primaryAction: "Add customer",
    filters: ["All", "Subscribers", "Repeat", "At-risk"],
    stats: [
      { label: "Customers",     value: "14,208" },
      { label: "New (30d)",     value: "812",  delta: "+9%",  trend: "up" },
      { label: "Repeat rate",   value: "42%",  delta: "+3%",  trend: "up" },
      { label: "LTV",           value: "$284" },
    ],
    columns: [
      { key: "name",   label: "Name" },
      { key: "email",  label: "Email" },
      { key: "orders", label: "Orders" },
      { key: "spent",  label: "Spent" },
      { key: "last",   label: "Last order", className: "text-right" },
    ],
    rows: [
      { name: "Amelia Wells",   email: "amelia@wells.co",     orders: 12, spent: "$1,428", last: "2 min ago" },
      { name: "Ravi Menon",     email: "ravi.m@fastmail.com", orders: 3,  spent: "$286",   last: "12 min ago" },
      { name: "Sofia Álvarez",  email: "sofia@studio.es",     orders: 8,  spent: "$920",   last: "34 min ago" },
      { name: "Kenji Watanabe", email: "kenji@w.jp",          orders: 21, spent: "$3,412", last: "1h ago" },
      { name: "Priya Anand",    email: "priya@anand.in",      orders: 5,  spent: "$612",   last: "2h ago" },
    ],
  },

  reviews: {
    subtitle: "Product reviews across your storefront and marketplaces.",
    primaryAction: "Request reviews",
    filters: ["All", "5★", "4★", "≤3★", "Flagged"],
    stats: [
      { label: "Avg rating", value: "4.7 ★" },
      { label: "Reviews",    value: "3,214" },
      { label: "Response %", value: "94%", delta: "+2%", trend: "up" },
      { label: "Flagged",    value: "3" },
    ],
    columns: [
      { key: "product", label: "Product" },
      { key: "author",  label: "Author" },
      { key: "rating",  label: "Rating" },
      { key: "excerpt", label: "Excerpt" },
      { key: "date",    label: "Date", className: "text-right" },
    ],
    rows: [
      { product: "Runner Pro Knit",  author: "Amelia W.",  rating: "5 ★", excerpt: "Best runners I've owned.",            date: "2h ago" },
      { product: "Cloud Merino Tee", author: "Ravi M.",    rating: "4 ★", excerpt: "Soft, but wrinkles quickly.",         date: "1d ago" },
      { product: "Trail Jacket",     author: "Kenji W.",   rating: "5 ★", excerpt: "Warm and packable.",                   date: "2d ago" },
      { product: "Everyday Tote",    author: "Sofia Á.",   rating: "3 ★", excerpt: "Cute, but the strap frayed.",         date: "4d ago" },
    ],
  },

  marketing: {
    subtitle: "Campaigns, automations and channels driving revenue.",
    primaryAction: "New campaign",
    filters: ["All", "Email", "SMS", "Social", "Automations"],
    stats: [
      { label: "Sent (30d)",   value: "412,801" },
      { label: "Open rate",    value: "38.2%", delta: "+2.1%", trend: "up" },
      { label: "Click rate",   value: "6.8%",  delta: "+0.4%", trend: "up" },
      { label: "Revenue",      value: "$94,210" },
    ],
    columns: [
      { key: "name",     label: "Campaign" },
      { key: "channel",  label: "Channel" },
      { key: "audience", label: "Audience" },
      { key: "sent",     label: "Sent" },
      { key: "status",   label: "Status", className: "text-right" },
    ],
    rows: [
      { name: "Autumn Drop Launch",   channel: "Email", audience: "All buyers",   sent: "24,120", status: "Sent" },
      { name: "Cart Abandoners 3h",   channel: "Auto",  audience: "Abandoned",    sent: "1,204",  status: "Active" },
      { name: "VIP Early Access",     channel: "SMS",   audience: "Top 5%",       sent: "412",    status: "Scheduled" },
      { name: "Welcome Series",       channel: "Auto",  audience: "New",          sent: "8,204",  status: "Active" },
    ],
  },

  domains: {
    subtitle: "Custom domains, SSL and DNS across every project.",
    primaryAction: "Connect domain",
    filters: ["All", "Primary", "Redirect", "Pending"],
    stats: [
      { label: "Domains",   value: "8" },
      { label: "SSL valid", value: "8 / 8" },
      { label: "Pending",   value: "0" },
      { label: "Traffic",   value: "1.2M / mo" },
    ],
    columns: [
      { key: "domain",   label: "Domain" },
      { key: "project",  label: "Project" },
      { key: "ssl",      label: "SSL" },
      { key: "role",     label: "Role" },
      { key: "expires",  label: "Expires", className: "text-right" },
    ],
    rows: [
      { domain: "aether.co",         project: "Aether Autumn", ssl: "Active", role: "Primary",  expires: "Mar 2027" },
      { domain: "www.aether.co",     project: "Aether Autumn", ssl: "Active", role: "Redirect", expires: "Mar 2027" },
      { domain: "shop.halo.beauty",  project: "Halo Skincare", ssl: "Active", role: "Primary",  expires: "Jan 2027" },
      { domain: "nordicceramics.se", project: "Nordic",        ssl: "Active", role: "Primary",  expires: "Nov 2026" },
    ],
  },

  team: {
    subtitle: "Invite people, assign roles and manage access.",
    primaryAction: "Invite member",
    filters: ["All", "Owners", "Editors", "Viewers", "Pending"],
    stats: [
      { label: "Seats used",     value: "9 / 15" },
      { label: "Pending invites", value: "2" },
      { label: "Owners",         value: "2" },
      { label: "Active today",   value: "6" },
    ],
    columns: [
      { key: "name",   label: "Member" },
      { key: "email",  label: "Email" },
      { key: "role",   label: "Role" },
      { key: "active", label: "Last active", className: "text-right" },
    ],
    rows: [
      { name: "You",             email: "you@aether.co",       role: "Owner",  active: "Now" },
      { name: "Maren Lund",      email: "maren@aether.co",     role: "Editor", active: "12 min ago" },
      { name: "Ryu Aoki",        email: "ryu@aether.co",       role: "Editor", active: "2h ago" },
      { name: "Talia Rivera",    email: "talia@aether.co",     role: "Viewer", active: "Yesterday" },
      { name: "invite pending",  email: "sam@partner.co",      role: "Editor", active: "Pending" },
    ],
  },
};

/* ============================================================
 * Route component: dispatch by slug
 * ============================================================ */

function DashboardCatchAll() {
  const { _splat } = Route.useParams();
  return <DashboardDispatch slug={_splat ?? ""} />;
}

/** Slug → view dispatcher, reused by /store/$storeId/$. */
export function DashboardDispatch({ slug }: { slug: string }) {
  // connected (live store data) views
  if (slug === "products" || slug === "products/all") return <PageBoundary label="Products"><ConnectedProducts /></PageBoundary>;
  if (slug === "products/collections" || slug === "collections") return <PageBoundary label="Collections"><ConnectedCollections /></PageBoundary>;
  if (slug === "products/inventory" || slug === "inventory") return <PageBoundary label="Inventory"><InventoryManagementPage /></PageBoundary>;
  if (slug === "products/purchase-orders" || slug === "purchase-orders") return <PageBoundary label="Purchase Orders"><PurchaseOrdersPage /></PageBoundary>;
  if (slug === "products/purchase-invoices" || slug === "purchase-invoices") return <PageBoundary label="Purchase Invoices"><PurchaseInvoicesPage /></PageBoundary>;
  if (slug === "products/sale-invoices" || slug === "sale-invoices") return <PageBoundary label="Sale Invoices"><SalesInvoicesPage /></PageBoundary>;
  if (slug === "products/gift-cards") return <PageBoundary label="Gift Cards"><GiftCardsPage /></PageBoundary>;

  if (slug === "categories")  return <PageBoundary label="Categories"><ConnectedCategories /></PageBoundary>;

  if (slug === "orders" || slug === "orders/all") return <OrdersManagementPage variant="all" />;
  if (slug === "orders/drafts") return <OrdersManagementPage variant="drafts" />;
  if (slug === "orders/abandoned") return <AbandonedCheckoutsPage />;
  if (slug.startsWith("orders/")) return <OrderDetailsPage id={slug.slice("orders/".length)} />;

  const item = findItem(slug);

  if (slug === "customers") return <ConnectedCustomers variant="all" />;
  if (slug === "customers/portal") return <ConnectedCustomers variant="portal" />;
  if (slug === "customers/direct") return <ConnectedCustomers variant="direct" />;

  if (slug === "growth") return <GrowthDashboardPage />;
  if (slug === "growth/attribution") return <AttributionPage />;
  if (slug === "growth/campaigns") return <CampaignsPage />;

  if (slug === "media")       return <ConnectedMediaLibraryPage />;

  if (slug === "online-store" || slug === "templates") return <PageBoundary label="Online Store"><OnlineStorePage /></PageBoundary>;



  // custom views
  if (slug === "analytics") return <AnalyticsLivePage />;

  const cfg = PAGES[slug];
  if (cfg && item) return <TablePage slug={slug} icon={item.icon} title={item.label} cfg={cfg} />;

  // fallback — unknown slug
  return <FallbackPage slug={slug} />;
}

function ComingSoonPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-24">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow mb-4">
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
      <p className="mt-6 text-xs text-muted-foreground/70">Coming soon in this workspace.</p>
    </div>
  );
}

function GiftCardsPage() {
  return <ComingSoonPage title="Gift Cards" subtitle="Issue, sell and redeem gift cards across your store." />;
}

class PageBoundary extends React.Component<
  { label: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Dashboard] "${this.props.label}" failed:`, error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <div className="max-w-xl mx-auto text-center rounded-2xl border border-dashed border-white/10 bg-card/40 p-8">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{this.props.label}</div>
            <h2 className="mt-2 font-display text-2xl font-semibold">This section is temporarily unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {this.state.error.message || "The page hit an unexpected error."}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/* ============================================================
 * Shared building blocks
 * ============================================================ */

export function Breadcrumb({ label, parent }: { label: string; parent?: { label: string; slug: string } | null }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
      {parent && (
        <>
          <ChevronRight className="h-3 w-3" />
          <Link to="/dashboard/$" params={{ _splat: parent.slug }} className="hover:text-foreground transition-colors">
            {parent.label}
          </Link>
        </>
      )}
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground">{label}</span>
    </motion.nav>
  );
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  primaryAction,
  onPrimary,
  secondaryAction,
  onSecondary,
  onExport,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  primaryAction: string;
  onPrimary?: () => void;
  secondaryAction?: string;
  onSecondary?: () => void;
  onExport?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 220, damping: 18 }}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </motion.span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight truncate">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {secondaryAction && onSecondary && (
          <button onClick={onSecondary}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium transition">
            {secondaryAction}
          </button>
        )}
        <button onClick={onExport}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl glass hover:bg-white/10 text-xs font-medium transition">
          <Download className="h-3.5 w-3.5" /> Export
        </button>
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onPrimary}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow">
          <Plus className="h-3.5 w-3.5" /> {primaryAction}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function StatsRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + i * 0.05, duration: 0.35 }}
          className="relative overflow-hidden rounded-2xl glass-strong border border-white/[0.08] p-4"
        >
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">{s.label}</div>
          <div className="mt-1.5 flex items-end justify-between gap-2">
            <div className="font-display text-xl md:text-2xl font-semibold tracking-tight">{s.value}</div>
            {s.delta && (
              <span className={cn(
                "inline-flex items-center gap-0.5 text-[11px] font-medium rounded-full px-1.5 py-0.5",
                s.trend === "up" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300",
              )}>
                {s.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {s.delta}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function Toolbar({
  filters, active, onActive, query, onQuery, onFiltersToggle, filtersOpen,
}: {
  filters: string[]; active: string; onActive: (f: string) => void;
  query: string; onQuery: (q: string) => void;
  onFiltersToggle?: () => void; filtersOpen?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search…"
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition"
        />
      </div>
      <div className="flex items-center gap-1 rounded-xl glass border border-white/[0.08] p-1">
        {filters.map((f) => (
          <button key={f} onClick={() => onActive(f)}
            className={cn(
              "h-7 px-3 rounded-lg text-xs transition",
              active === f ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
            )}>
            {f}
          </button>
        ))}
      </div>
      <button onClick={onFiltersToggle}
        className={cn(
          "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition",
          filtersOpen && "bg-white/10 text-foreground",
        )}>
        <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
      </button>
    </div>
  );
}

export type RowAction = "view" | "edit" | "duplicate" | "delete";
export function DataTable({
  columns, rows, onRowClick, onAction,
}: {
  columns: Column[]; rows: Row[];
  onRowClick?: (r: Row, index: number) => void;
  onAction?: (a: RowAction, r: Row, index: number) => void;
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {columns.map((c) => (
                <th key={c.key}
                  className={cn("px-4 py-3 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80 font-medium", c.className)}>
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => onRowClick?.(r, i)}
                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 text-[13px]", c.className)}>
                    {c.key === "status" || c.key === "visible" ? <StatusPill label={String(r[c.key])} /> : String(r[c.key] ?? "")}
                  </td>
                ))}
                <td className="px-2 text-right">
                  <RowMenu onAction={(a) => onAction?.(a, r, i)} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowMenu({ onAction }: { onAction: (a: RowAction) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const items: { key: RowAction; label: string; icon: LucideIcon; danger?: boolean }[] = [
    { key: "view", label: "View details", icon: Eye },
    { key: "edit", label: "Edit", icon: Pencil },
    { key: "duplicate", label: "Duplicate", icon: Copy },
    { key: "delete", label: "Delete", icon: Trash2, danger: true },
  ];
  return (
    <span className="inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <FloatingLayer open={open} onClose={() => setOpen(false)} anchorRef={btnRef} align="end" className="w-44 p-1 text-left">
        {items.map((it) => (
          <button key={it.key}
            onClick={() => { setOpen(false); onAction(it.key); }}
            className={cn(
              "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition",
              it.danger ? "text-rose-300 hover:bg-rose-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5",
            )}>
            <it.icon className="h-3.5 w-3.5" />
            {it.label}
          </button>
        ))}
      </FloatingLayer>
    </span>
  );
}


export function StatusPill({ label }: { label: string }) {
  const l = label.toLowerCase();
  const tone =
    /paid|active|succeed|success|in stock|public/.test(l) ? "bg-emerald-400/10 text-emerald-300" :
    /draft|schedul|pending|redirect/.test(l)              ? "bg-amber-400/10 text-amber-300" :
    /refund|low/.test(l)                                   ? "bg-orange-400/10 text-orange-300" :
    /fail|cancel|out|expired|archiv|hidden/.test(l)        ? "bg-rose-400/10 text-rose-300" :
                                                             "bg-white/[0.06] text-muted-foreground";
  return <span className={cn("inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium", tone)}>{label}</span>;
}

export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="text-muted-foreground">Page {page} of {pages}</div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg glass hover:bg-white/10 disabled:opacity-40 transition">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {Array.from({ length: pages }).map((_, i) => (
          <button key={i} onClick={() => onPage(i + 1)}
            className={cn("h-8 min-w-8 px-2 rounded-lg text-xs transition",
              page === i + 1 ? "bg-primary-gradient text-primary-foreground shadow-glow" : "glass hover:bg-white/10")}>
            {i + 1}
          </button>
        ))}
        <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg glass hover:bg-white/10 disabled:opacity-40 transition">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, desc, action, onAction }: { title: string; desc: string; action: string; onAction?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-strong border border-white/[0.08] p-10 text-center">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow mb-3">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{desc}</p>
      <button onClick={onAction}
        className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-medium shadow-glow">
        <Plus className="h-3.5 w-3.5" /> {action}
      </button>
    </motion.div>
  );
}

/* ============================================================
 * Detail Drawer + Create/Edit Modal + Advanced Filters panel
 * ============================================================ */

export function DetailDrawer({
  open, onClose, row, columns, title, onEdit, onDuplicate, onDelete,
}: {
  open: boolean; onClose: () => void; row: Row | null; columns: Column[]; title: string;
  onEdit: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  return (
    <AnimatePresence>
      {open && row && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
            className="fixed top-0 right-0 z-50 h-screen w-full max-w-md glass-strong border-l border-white/10 flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{title} details</div>
                <div className="font-display text-lg font-semibold mt-0.5 truncate">{String(row[columns[0].key])}</div>
              </div>
              <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {columns.map((c) => (
                <div key={c.key} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">{c.label}</div>
                  <div className="text-sm mt-1">
                    {c.key === "status" || c.key === "visible"
                      ? <StatusPill label={String(row[c.key])} />
                      : String(row[c.key] ?? "—")}
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">Activity</div>
                <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shadow-glow" /> Record created</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" /> Metadata synced</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Last viewed just now</li>
                </ul>
              </div>
            </div>
            <div className="p-4 border-t border-white/[0.06] flex items-center gap-2">
              <button onClick={onDelete}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-rose-500/10 hover:text-rose-300 text-xs transition">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button onClick={onDuplicate}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition">
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button onClick={onEdit}
                className="ml-auto inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function RecordModal({
  open, onClose, mode, title, columns, initial, onSave,
}: {
  open: boolean; onClose: () => void; mode: "create" | "edit"; title: string;
  columns: Column[]; initial?: Row | null; onSave: (r: Row) => void;
}) {
  const [form, setForm] = useState<Row>({});
  useEffect(() => {
    if (open) {
      const seed: Row = {};
      columns.forEach((c) => { seed[c.key] = initial?.[c.key] ?? ""; });
      setForm(seed);
    }
  }, [open, initial, columns]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xl" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-lg glass-strong border border-white/10 rounded-2xl shadow-glow overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {mode === "create" ? "Create new" : "Edit"}
                  </div>
                  <div className="font-display text-lg font-semibold mt-0.5">{title}</div>
                </div>
                <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); onSave(form); }}
                className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                {columns.map((c) => (
                  <label key={c.key} className="block">
                    <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">{c.label}</span>
                    <input
                      value={String(form[c.key] ?? "")}
                      onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))}
                      className="w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:bg-white/[0.05] focus:shadow-glow transition"
                      placeholder={c.label}
                    />
                  </label>
                ))}
              </form>
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button onClick={onClose}
                  className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs transition">Cancel</button>
                <button onClick={() => onSave(form)}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow">
                  <Check className="h-3.5 w-3.5" /> {mode === "create" ? "Create" : "Save changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AdvancedFilters({
  open, columns, values, onChange, onClear,
}: {
  open: boolean; columns: Column[]; values: Record<string, string>;
  onChange: (k: string, v: string) => void; onClear: () => void;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden">
          <div className="rounded-2xl glass-strong border border-white/[0.08] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.map((c) => (
              <label key={c.key} className="block">
                <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">Filter · {c.label}</span>
                <input
                  value={values[c.key] ?? ""}
                  onChange={(e) => onChange(c.key, e.target.value)}
                  placeholder={`Contains…`}
                  className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition"
                />
              </label>
            ))}
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button onClick={onClear} className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs">Clear filters</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
 * Standard table page (interactive)
 * ============================================================ */

export function downloadCSV(name: string, columns: Column[], rows: Row[]) {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    columns.map((c) => esc(c.label)).join(","),
    ...rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function TablePage({
  slug, icon, title, cfg,
}: { slug: string; icon: LucideIcon; title: string; cfg: PageConfig }) {
  const [rows, setRows] = useState<Row[]>(cfg.rows);
  useEffect(() => { setRows(cfg.rows); }, [cfg.rows]);

  const [active, setActive] = useState(cfg.filters[0]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});
  const perPage = 8;

  const [drawer, setDrawer] = useState<{ open: boolean; row: Row | null; index: number }>({ open: false, row: null, index: -1 });
  const [modal, setModal] = useState<{ open: boolean; mode: "create" | "edit"; row: Row | null; index: number }>({
    open: false, mode: "create", row: null, index: -1,
  });

  const filtered = useMemo(() => {
    let out = rows;
    if (active && active !== "All") {
      out = out.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(active.toLowerCase())));
    }
    if (query) {
      const q = query.toLowerCase();
      out = out.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
    }
    for (const [k, v] of Object.entries(colFilters)) {
      if (!v) continue;
      const lv = v.toLowerCase();
      out = out.filter((r) => String(r[k] ?? "").toLowerCase().includes(lv));
    }
    return out;
  }, [rows, active, query, colFilters]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const singular = title.replace(/s$/, "");

  const handleAction = (a: RowAction, r: Row) => {
    const idx = rows.indexOf(r);
    if (a === "view") { setDrawer({ open: true, row: r, index: idx }); return; }
    if (a === "edit") { setModal({ open: true, mode: "edit", row: r, index: idx }); return; }
    if (a === "duplicate") {
      const copy: Row = { ...r };
      const nameKey = cfg.columns[0].key;
      copy[nameKey] = `${copy[nameKey]} (copy)`;
      setRows((prev) => {
        const next = [...prev];
        next.splice(idx + 1, 0, copy);
        return next;
      });
      pushToast("success", `${singular} duplicated`);
      return;
    }
    if (a === "delete") {
      setRows((prev) => prev.filter((x) => x !== r));
      pushToast("success", `${singular} deleted`);
    }
  };

  const handleSave = (r: Row) => {
    if (modal.mode === "create") {
      setRows((prev) => [r, ...prev]);
      pushToast("success", `${singular} created`);
    } else {
      setRows((prev) => prev.map((x, i) => (i === modal.index ? r : x)));
      pushToast("success", `${singular} updated`);
    }
    setModal({ open: false, mode: "create", row: null, index: -1 });
  };

  return (
    <div className="space-y-6" key={slug}>
      <ToastHost />
      <Breadcrumb label={title} />
      <PageHeader
        icon={icon} title={title} subtitle={cfg.subtitle} primaryAction={cfg.primaryAction}
        onPrimary={() => setModal({ open: true, mode: "create", row: null, index: -1 })}
        onExport={() => { downloadCSV(slug || "export", cfg.columns, filtered); pushToast("info", `Exported ${filtered.length} rows`); }}
      />
      <StatsRow stats={cfg.stats} />
      <Toolbar
        filters={cfg.filters} active={active} onActive={(f) => { setActive(f); setPage(1); }}
        query={query} onQuery={(q) => { setQuery(q); setPage(1); }}
        filtersOpen={filtersOpen} onFiltersToggle={() => setFiltersOpen((o) => !o)}
      />
      <AdvancedFilters
        open={filtersOpen} columns={cfg.columns} values={colFilters}
        onChange={(k, v) => { setColFilters((s) => ({ ...s, [k]: v })); setPage(1); }}
        onClear={() => setColFilters({})}
      />
      {paged.length ? (
        <>
          <DataTable
            columns={cfg.columns} rows={paged}
            onRowClick={(r) => setDrawer({ open: true, row: r, index: rows.indexOf(r) })}
            onAction={handleAction}
          />
          <Pagination page={page} pages={pages} onPage={setPage} />
        </>
      ) : (
        <EmptyState
          title={cfg.empty?.title ?? "Nothing here yet"}
          desc={cfg.empty?.desc ?? "Try clearing filters or add your first item."}
          action={cfg.primaryAction}
          onAction={() => setModal({ open: true, mode: "create", row: null, index: -1 })}
        />
      )}

      <DetailDrawer
        open={drawer.open} onClose={() => setDrawer({ open: false, row: null, index: -1 })}
        row={drawer.row} columns={cfg.columns} title={singular}
        onEdit={() => {
          const r = drawer.row; const i = drawer.index;
          setDrawer({ open: false, row: null, index: -1 });
          setModal({ open: true, mode: "edit", row: r, index: i });
        }}
        onDuplicate={() => { if (drawer.row) { handleAction("duplicate", drawer.row); setDrawer({ open: false, row: null, index: -1 }); } }}
        onDelete={() => { if (drawer.row) { handleAction("delete", drawer.row); setDrawer({ open: false, row: null, index: -1 }); } }}
      />
      <RecordModal
        open={modal.open} mode={modal.mode}
        onClose={() => setModal({ open: false, mode: "create", row: null, index: -1 })}
        title={singular} columns={cfg.columns} initial={modal.row}
        onSave={handleSave}
      />
    </div>
  );
}

/* ============================================================
 * Analytics — custom KPI + chart view
 * ============================================================ */

function AnalyticsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl glass-strong border border-white/[0.08] p-5"><div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">{title}</div><div className="mt-4 space-y-2.5">{children}</div></div>;
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="font-medium text-foreground">{value}</span></div>;
}

function Unavailable({ text = "No data available for this period." }: { text?: string }) {
  return <div className="text-xs text-muted-foreground">{text}</div>;
}

function AnalyticsLivePage() {
  const item = findItem("analytics")!;
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [today] = useState(() => new Date());
  const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;
  const toDate = new Date(today);
  const fromDate = new Date(today); fromDate.setDate(fromDate.getDate() - days + 1);
  const previousToDate = new Date(fromDate); previousToDate.setDate(previousToDate.getDate() - 1);
  const previousFromDate = new Date(previousToDate); previousFromDate.setDate(previousFromDate.getDate() - days + 1);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const rangeData = { from: iso(fromDate), to: iso(toDate), previousFrom: iso(previousFromDate), previousTo: iso(previousToDate) };
  const { data, isLoading, isError, refetch } = useAnalytics(rangeData);
  const analytics: AnalyticsData = data ?? {
    revenue: 0, previousRevenue: 0, revenueGrowth: 0, orders: 0, previousOrders: 0, ordersGrowth: 0,
    customers: 0, previousCustomers: 0, customersGrowth: 0, averageOrderValue: 0, dailyRevenue: [],
    channels: [], topProducts: [], invoiceCount: 0, orderCount: 0, refundAmount: 0, returnedOrders: 0,
    newCustomers: 0, returningCustomers: 0, totalCustomers: 0, repeatPurchaseRate: 0,
    orderStatusCounts: {}, payment: { available: false, paid: 0, unpaid: 0, methods: [] },
    trafficAttributionAvailable: false,
  };
  const money = (value: number) => `PKR ${value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
  const growth = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  const dailyPoints = analytics.dailyRevenue.length ? analytics.dailyRevenue : [{ date: rangeData.from, value: 0 }];
  const points = range === "1y"
    ? [...dailyPoints.reduce((months, point) => {
        const month = point.date.slice(0, 7);
        months.set(month, (months.get(month) ?? 0) + point.value);
        return months;
      }, new Map<string, number>())].map(([date, value]) => ({ date, value }))
    : dailyPoints;
  const max = Math.max(...points.map((point) => point.value), 1);
  const colors = ["bg-primary", "bg-emerald-400", "bg-fuchsia-400", "bg-cyan-400", "bg-amber-400"];
  const stats: Stat[] = [
    { label: `Orders (${range})`, value: analytics.orders.toLocaleString(), delta: growth(analytics.ordersGrowth), trend: analytics.ordersGrowth >= 0 ? "up" : "down" },
    { label: "Conversion", value: "N/A", delta: "Visitor tracking unavailable", trend: "up" },
    { label: "Revenue", value: money(analytics.revenue), delta: growth(analytics.revenueGrowth), trend: analytics.revenueGrowth >= 0 ? "up" : "down" },
    { label: "Avg order", value: money(analytics.averageOrderValue), delta: `${analytics.totalCustomers.toLocaleString()} customers`, trend: "up" },
  ];
  const rows: Row[] = analytics.topProducts.map((product) => ({ page: product.name, views: product.qty.toLocaleString(), avg: product.orders.toLocaleString(), bounce: "—", revenue: money(product.revenue) }));

  return (
    <div className="space-y-6">
      <Breadcrumb label="Analytics" />
      <PageHeader icon={item.icon} title="Analytics" subtitle="Real-time performance across every channel." primaryAction="New report"
        onPrimary={() => { refetch(); pushToast("success", "Analytics refreshed"); }}
        onExport={() => { refetch(); pushToast("success", "Analytics snapshot refreshed"); }} />
      <StatsRow stats={stats} />
      {isLoading && <div className="text-sm text-muted-foreground">Loading analytics...</div>}
      {isError && <div className="text-sm text-rose-300">Unable to load analytics from the Frappe backend.</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 rounded-2xl glass-strong border border-white/[0.08] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Revenue</div>
              <div className="font-display text-2xl font-semibold tracking-tight mt-1">{money(analytics.revenue)}</div>
            </div>
            <div className="flex items-center gap-1 rounded-xl glass border border-white/[0.08] p-1 text-xs">
              {["7d", "30d", "90d", "1y"].map((option) => <button key={option} onClick={() => setRange(option as typeof range)} className={cn("h-7 px-2.5 rounded-lg", range === option ? "bg-primary-gradient text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground")}>{option}</button>)}
            </div>
          </div>
          <div className="relative mt-5 h-48 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-3 opacity-30">
              {[0, 1, 2, 3].map((line) => <div key={line} className="border-t border-dashed border-white/20" />)}
            </div>
            <div className="relative z-10 flex h-full items-end gap-1.5 px-2 pt-2">
              {points.map((point, index) => <motion.div key={point.date} initial={{ height: 0 }} animate={{ height: `${(point.value / max) * 100}%` }} transition={{ delay: index * 0.02, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="min-h-0.5 flex-1 rounded-t-md bg-[color-mix(in_oklab,var(--glow)_84%,white_16%)] opacity-90 shadow-[0_0_18px_-5px_color-mix(in_oklab,var(--glow)_90%,transparent)] transition-opacity hover:opacity-100" title={`${point.date}: ${money(point.value)}`} />)}
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl glass-strong border border-white/[0.08] p-5"><div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">Traffic by channel</div><div className="mt-4 space-y-3">{analytics.channels.length ? analytics.channels.map((channel, index) => <div key={channel.name}><div className="flex items-center justify-between text-xs"><span>{channel.name}</span><span className="text-muted-foreground">{channel.pct}%</span></div><div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${channel.pct}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={cn("h-full rounded-full", colors[index % colors.length])} /></div></div>) : <Unavailable />}{!analytics.trafficAttributionAvailable && <div className="pt-1 text-[11px] text-muted-foreground">Frappe has no tracked source, medium, campaign, or referral data for this period.</div>}</div></motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <AnalyticsPanel title="Customer analytics">
          <MetricLine label="Customers" value={analytics.totalCustomers.toLocaleString()} />
          <MetricLine label="New customers" value={analytics.newCustomers.toLocaleString()} />
          <MetricLine label="Returning customers" value={analytics.returningCustomers.toLocaleString()} />
          <MetricLine label="Repeat purchase rate" value={`${analytics.repeatPurchaseRate.toFixed(1)}%`} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Order analytics">
          {Object.entries(analytics.orderStatusCounts).length ? Object.entries(analytics.orderStatusCounts).map(([status, count]) => <MetricLine key={status} label={status} value={count.toLocaleString()} />) : <Unavailable />}
          <MetricLine label="Returned orders" value={analytics.returnedOrders.toLocaleString()} />
          <MetricLine label="Refunded amount" value={money(analytics.refundAmount)} />
        </AnalyticsPanel>
        <AnalyticsPanel title="Payment analytics">
          {analytics.payment.available ? <>
            <MetricLine label="Paid amount" value={money(analytics.payment.paid)} />
            <MetricLine label="Unpaid amount" value={money(analytics.payment.unpaid)} />
            {analytics.payment.methods.map((method) => <MetricLine key={method.name} label={method.name} value={money(method.value)} />)}
          </> : <Unavailable />}
        </AnalyticsPanel>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnalyticsPanel title="Conversion funnel">
          <MetricLine label="Orders" value={analytics.orders.toLocaleString()} />
          <Unavailable text="Visitors, product views, cart and checkout events are not tracked by the available Frappe data." />
        </AnalyticsPanel>
        <AnalyticsPanel title="Geographic analytics">
          <Unavailable text="Customer address data is not available in this analytics response." />
        </AnalyticsPanel>
      </div>
      {rows.length ? <DataTable columns={[{ key: "page", label: "Product" }, { key: "views", label: "Units sold" }, { key: "avg", label: "Orders" }, { key: "bounce", label: "Tracking" }, { key: "revenue", label: "Revenue", className: "text-right" }]} rows={rows} /> : <EmptyState title="No data available for this period" desc="No submitted sales invoices or invoice items were found in this date range." action="Refresh" onAction={() => refetch()} />}
    </div>
  );
}

/* ============================================================
 * Media Library — grid view
 * ============================================================ */

function MediaLibraryPage() {
  const item = findItem("media")!;
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const tints = [
    "from-violet-500 to-fuchsia-500", "from-cyan-500 to-sky-500",
    "from-amber-500 to-orange-500",   "from-emerald-500 to-teal-500",
    "from-rose-500 to-orange-500",    "from-fuchsia-500 to-pink-500",
    "from-slate-700 to-slate-900",    "from-sky-500 to-indigo-500",
    "from-yellow-400 to-amber-600",   "from-primary to-fuchsia-500",
    "from-emerald-400 to-cyan-500",   "from-rose-400 to-fuchsia-500",
  ];

  const fileRef = useRef<HTMLInputElement>(null);
  const triggerUpload = () => fileRef.current?.click();
  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.files?.length ?? 0;
    if (n) pushToast("success", `${n} file${n === 1 ? "" : "s"} uploaded`);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label="Media Library" />
      <PageHeader icon={item.icon} title="Media Library" subtitle="Every image, video and file across your workspace." primaryAction="Upload"
        onPrimary={triggerUpload}
        onExport={() => pushToast("info", "Media manifest exported")} />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={onFiles} />
      <StatsRow stats={[
        { label: "Assets",   value: "4,812" },
        { label: "Storage",  value: "38.2 GB / 100 GB" },
        { label: "Uploaded (30d)", value: "412", delta: "+8%", trend: "up" },
        { label: "Optimised", value: "98%" },
      ]} />
      <Toolbar filters={["All","Images","Videos","Documents","Trash"]} active={active} onActive={setActive} query={query} onQuery={setQuery} />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tints.map((t, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -3 }}
            onClick={() => pushToast("info", `Opening asset-${String(i + 1).padStart(3, "0")}.jpg`)}
            className={cn("group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br cursor-pointer", t)}
          >
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 left-2 right-2 text-[10px] text-white/90 truncate opacity-0 group-hover:opacity-100 transition">
              asset-{String(i + 1).padStart(3, "0")}.jpg
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * Fallback
 * ============================================================ */

function FallbackPage({ slug }: { slug: string }) {
  const parts = slug.split("/");
  const parent = parts.length > 1 ? NAV.flatMap((g) => g.items).find((i) => i.slug === parts[0]) : null;
  const item = findItem(slug);
  const Icon = item?.icon ?? Sparkles;
  const label = item?.label ?? "Page";
  return (
    <div className="space-y-6">
      <ToastHost />
      <Breadcrumb label={label} parent={parent ? { label: parent.label, slug: parent.slug } : null} />
      <PageHeader icon={Icon} title={label} subtitle="This workspace is ready — pick an action to start." primaryAction="Create"
        onPrimary={() => pushToast("info", `Creating in ${label}…`)}
        onExport={() => pushToast("info", "Nothing to export yet")} />
      <EmptyState title={`${label} is set up`} desc="Nothing yet — create your first entry to see it appear here." action="Get started"
        onAction={() => pushToast("info", `Let's set up ${label}`)} />
    </div>
  );
}

