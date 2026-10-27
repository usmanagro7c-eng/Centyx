import {
  Home, LayoutTemplate, Wand2,
  ShoppingCart, Package, Library, Boxes, FileText, Gift,
  Users, UserCircle2, UserPlus,
  Megaphone, Target,
  BarChart3, Image as ImageIcon,
  Settings, LifeBuoy, Accessibility,
  ClipboardList, Ban, HelpCircle,FileSpreadsheet
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  slug: string;      // "" = home (index)
  label: string;
  labelKey: string;
  icon: LucideIcon;
  href?: string;     // absolute route override
  children?: NavItem[];
};

export type NavGroup = { title?: string; titleKey?: string; items: NavItem[] };

/**
 * Store operations navigation.
 * All slugs are appended to /store/$storeId/ by the sidebar. Legacy /dashboard
 * routes still resolve so existing internal links continue working.
 */
export const NAV: NavGroup[] = [
  {
    title: "Overview", titleKey: "nav.group.overview",
    items: [
      { slug: "", label: "Dashboard", labelKey: "nav.dashboard", icon: Home },
      { slug: "analytics", label: "Analytics", labelKey: "nav.analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Commerce", titleKey: "nav.group.commerce",
    items: [
      {
        slug: "orders", label: "Orders", labelKey: "nav.orders", icon: ShoppingCart,
        children: [
          { slug: "orders/drafts", label: "Draft Orders", labelKey: "nav.orders.drafts", icon: FileText },
          { slug: "orders/abandoned", label: "Abandoned Checkouts", labelKey: "nav.orders.abandoned", icon: Ban },
        ],
      },
      {
        slug: "products", label: "Products", labelKey: "nav.products", icon: Package,
        children: [
          { slug: "products/collections", label: "Collections", labelKey: "nav.collections", icon: Library },
          { slug: "products/inventory", label: "Inventory", labelKey: "nav.inventory", icon: Boxes },
          { slug: "products/purchase-orders", label: "Purchase Orders", labelKey: "nav.purchaseOrders", icon: FileText },
          { slug: "products/purchase-invoices", label: "Purchase Invoices", labelKey: "nav.purchaseInvoices", icon: FileSpreadsheet },
          { slug: "products/sale-invoices", label: "Sale Invoices", labelKey: "nav.saleInvoices", icon: ShoppingCart },
          { slug: "products/gift-cards", label: "Gift Cards", labelKey: "nav.giftCards", icon: Gift },
        ],
      },
    ],
  },
  {
    title: "Audience", titleKey: "nav.group.audience",
    items: [
      {
        slug: "customers", label: "Customers", labelKey: "nav.customers", icon: Users,
        children: [
          { slug: "customers/portal", label: "Portal Customers", labelKey: "nav.customers.portal", icon: UserCircle2 },
          { slug: "customers/direct", label: "Direct Customers", labelKey: "nav.customers.direct", icon: UserPlus },
        ],
      },
      {
        slug: "growth", label: "Growth", labelKey: "nav.growth", icon: Megaphone,
        children: [
          { slug: "growth/attribution", label: "Attribution", labelKey: "nav.growth.attribution", icon: Target },
          { slug: "growth/campaigns", label: "Campaigns", labelKey: "nav.growth.campaigns", icon: Megaphone },
        ],
      },
    ],
  },
  {
    title: "Content", titleKey: "nav.group.content",
    items: [
      { slug: "online-store", label: "Online Store", labelKey: "nav.onlineStore", icon: LayoutTemplate },
      
      { slug: "media", label: "Media Library", labelKey: "nav.media", icon: ImageIcon },
    ],
  },
  {
    title: "Workspace", titleKey: "nav.group.workspace",
    items: [
      { slug: "accessibility", label: "Accessibility", labelKey: "nav.accessibility", icon: Accessibility, href: "/dashboard/accessibility" },
    ],
  },
];

/** Footer nav — the "Store Settings" entry navigating to a dedicated dashboard. */
export const SETTINGS_ITEM: NavItem = {
  slug: "settings", label: "Store Settings", labelKey: "nav.storeSettings", icon: Settings,
};

/** Safe placeholder used when a page requests an unknown slug. Never null so
 *  callers doing `findItem(slug)!.icon` can't crash. */
function safeItem(slug: string): NavItem {
  const label = slug
    .split("/").pop()!
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { slug, label, labelKey: `nav.${slug}`, icon: HelpCircle };
}

export function findItem(slug: string): NavItem {
  const target = (slug ?? "").toLowerCase();
  for (const g of NAV) for (const it of g.items) {
    if (it.slug === target) return it;
    if (it.children) for (const c of it.children) {
      if (c.slug === target) return c;
      // Also match by last path segment so callers can use short slugs
      // (e.g. "collections" resolves to the "products/collections" child).
      const last = c.slug.split("/").pop();
      if (last && last === target) return c;
    }
  }
  if (typeof console !== "undefined") console.warn(`[nav-config] Unknown slug "${slug}", falling back to placeholder.`);
  return safeItem(slug || "unknown");
}

/* -----------------------------------------------------------
 * Store Settings navigation
 * ----------------------------------------------------------- */

export type SettingsItem = { slug: string; label: string; labelKey: string; icon: LucideIcon };
import {
  Building2, Sparkles as SparklesIcon, Wallet, UserCog,
  CreditCard, ShoppingBag, Truck, MapPin, Globe, Scale,
} from "lucide-react";

export const SETTINGS_NAV: SettingsItem[] = [
  { slug: "store-details", label: "Store Details", labelKey: "settings.storeDetails", icon: Building2 },
  { slug: "plan", label: "Plan", labelKey: "settings.plan", icon: SparklesIcon },
  { slug: "billing", label: "Billing", labelKey: "settings.billing", icon: Wallet },
  { slug: "users", label: "Users", labelKey: "settings.users", icon: UserCog },
  { slug: "payments", label: "Payments", labelKey: "settings.payments", icon: CreditCard },
  { slug: "checkout", label: "Checkout", labelKey: "settings.checkout", icon: ShoppingBag },
  { slug: "shipping", label: "Shipping & Delivery", labelKey: "settings.shipping", icon: Truck },
  { slug: "locations", label: "Locations", labelKey: "settings.locations", icon: MapPin },
  { slug: "domains", label: "Domains", labelKey: "settings.domains", icon: Globe },
  { slug: "policies", label: "Policies", labelKey: "settings.policies", icon: Scale },
  { slug: "help", label: "Help Center", labelKey: "nav.help", icon: LifeBuoy },
];
