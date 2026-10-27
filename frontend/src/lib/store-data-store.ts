import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getOrders } from "@/api/orders";

/* ============================================================
 * Business-data store: single source of truth for e-commerce.
 * Dashboard, Website Builder, and Published Website all read
 * from this store.
 *
 * Multi-tenant: while the app is frontend-only we keep one
 * active tenant's data in the root state. To swap tenants (e.g.
 * on user sign-in), call `switchTenant(userId)`. Data for each
 * tenant is kept in `tenants[userId]` and hydrated in/out.
 * The public read surface (products, orders, customers, cart…)
 * always reflects the ACTIVE tenant. A future backend swap
 * only needs to replace the persistence layer.
 * ============================================================ */

export type ProductOption = { name: string; values: string[] };
export type ProductVariant = {
  id: string;
  options: Record<string, string>;    // e.g. { Color: "Black", Size: "M" }
  sku?: string;
  price?: number;                     // overrides base price
  stock?: number;
  image?: string;                     // data URL / URL
};

export type Product = {
  id: string;
  name: string;
  handle: string;                    // URL slug, unique per store
  sku: string;
  barcode?: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  category: string;                  // category id or free label
  collectionIds?: string[];
  brand?: string;
  vendor?: string;
  productType?: string;
  stock: number;                     // on-hand across warehouses (see stockByWarehouse for split)
  trackInventory?: boolean;
  lowStockThreshold?: number;
  continueSellingWhenOutOfStock?: boolean;
  // Inventory accounting (all optional, default 0)
  reserved?: number;                 // committed to open orders / carts
  incoming?: number;                 // on inbound purchase orders / transfers
  damaged?: number;                  // written off but not yet removed
  returned?: number;                 // returned by customers, awaiting inspection
  stockByWarehouse?: Record<string, number>;  // warehouseId → units on hand
  status: "Published" | "Draft" | "Archived";

  images: string[];                  // ordered gallery (first is thumbnail)
  imageAlts?: string[];              // parallel array with image alt text
  imageUrl?: string;                 // legacy thumbnail (kept for compat)
  description?: string;
  shortDescription?: string;
  tags?: string[];
  weight?: number;                   // grams
  weightUnit?: string;
  dimensions?: { l?: number; w?: number; h?: number };
  taxable?: boolean;
  requiresShipping?: boolean;
  isDigital?: boolean;
  options?: ProductOption[];
  variants?: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  featured?: boolean;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
};

export type Category = {
  id: string;
  name: string;
  handle: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  parentId?: string;
  status?: "Active" | "Draft" | "Archived";
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
};

export type CollectionRuleField =
  | "tag" | "category" | "collection"
  | "price-lt" | "price-gt" | "compare-at-price-gt"
  | "title-contains" | "vendor" | "product-type"
  | "in-stock" | "featured";

export type CollectionRule = {
  field: CollectionRuleField;
  value: string;
};

export type Collection = {
  id: string;
  name: string;
  handle: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  kind: "manual" | "auto";
  match?: "all" | "any";              // rule matching mode for auto
  productIds: string[];              // used for manual, cached for auto
  rules?: CollectionRule[];
  status?: "Active" | "Draft" | "Archived";
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  createdAt: number;
  updatedAt?: number;
  archivedAt?: number;
};

export type Coupon = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  value: number;                     // percent (0-100) or fixed amount
  active: boolean;
  minSubtotal?: number;
  freeShipping?: boolean;            // adds free shipping on top of discount
  expiresAt?: number;                // epoch ms
  createdAt: number;
};

export type CartItem = { productId: string; qty: number; variantId?: string; addedAt?: number };
export type ShippingRate = {
  id: string;
  label: string;
  cost: number;
  etaDays?: [number, number];
  freeAbove?: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  sku?: string;
  variant?: string;
};

export type Address = {
  label?: string;                    // "Home", "Work", …
  firstName?: string;
  lastName?: string;
  name?: string;                     // legacy full name
  email?: string;
  company?: string;
  line1?: string;
  line2?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
};

export type OrderShippingMethod = {
  id: string;
  label: string;
  cost: number;
  etaDays?: [number, number];
};

export type OrderStatus =
  | "Draft" | "Pending" | "Confirmed" | "Paid" | "Processing" | "Packed"
  | "Shipped" | "Out for delivery" | "Delivered"
  | "Cancelled" | "Returned" | "Refunded" | "Failed"
  // legacy values from earlier schema, kept for back-compat
  | "Unfulfilled" | "Fulfilled";

export type PaymentStatus =
  | "Unpaid" | "Pending" | "Paid" | "Partially refunded" | "Refunded" | "Failed";

export type ShippingStatus =
  | "Not shipped" | "Processing" | "Packed" | "Shipped"
  | "Out for delivery" | "Delivered" | "Returned";

export type OrderTimelineEvent = {
  at: number;
  label: string;
  status?: OrderStatus;
  description?: string;
  kind?: "system" | "note" | "email";
};

export type Order = {
  id: string;
  number: string;                    // human-friendly, e.g. #1042
  invoiceNumber: string;             // e.g. INV-2001
  transactionId?: string;            // e.g. TXN-XXXX
  customerId?: string;
  company?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  itemsCount: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  couponCode?: string;
  shipping?: Address;
  billing?: Address;
  billingSameAsShipping?: boolean;
  paymentMethod?: string;
  shippingMethod?: OrderShippingMethod;
  estimatedDelivery?: { earliest: number; latest: number };
  notes?: string;
  trackingNumber?: string;
  carrier?: string;
  status: OrderStatus;
  workflowState?: string;
  frappeStatus?: string;
  deliveryNote?: string;
  salesInvoice?: string;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  fulfillment: "Unfulfilled" | "Fulfilled" | "Partially fulfilled";
  timeline: OrderTimelineEvent[];
  createdAt: number;
  updatedAt?: number;
};



export type CustomerType = "portal" | "direct";
export type CustomerStatus = "active" | "inactive";

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
  ordersCount: number;
  totalSpent: number;
  notes?: string;
  createdAt: number;
  /** classification: portal = signed-in checkout, direct = guest checkout */
  type?: CustomerType;
  status?: CustomerStatus;
  lastOrderAt?: number;
  lastLoginAt?: number;
  rewardPoints?: number;
  /** linked auth user id when the customer purchased while signed in */
  userId?: string;
};

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  kind: "image" | "video" | "doc" | "audio";
  mimeType?: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  description?: string;
  tags?: string[];
  folderId?: string | null;
  createdAt: number;
  updatedAt?: number;
};

export type MediaFolder = {
  id: string;
  name: string;
  parentId?: string | null;
  createdAt: number;
};

/* ============================================================
 * INVENTORY & WAREHOUSE
 * ============================================================ */

export type Warehouse = {
  id: string;
  name: string;
  code: string;           // short code, e.g. "MAIN"
  location?: string;      // city / address
  manager?: string;
  capacity?: number;      // total units it can hold
  status: "Active" | "Inactive";
  isDefault?: boolean;
  createdAt: number;
  updatedAt?: number;
};

export type MovementReason =
  | "product-created" | "manual-adjustment" | "stock-added" | "stock-removed"
  | "stock-reserved" | "stock-released"
  | "order-placed" | "order-cancelled" | "order-refunded"
  | "purchase-received" | "warehouse-transfer"
  | "damaged" | "returned";

export type StockMovement = {
  id: string;
  at: number;
  productId: string;
  productName: string;
  warehouseId?: string;
  reason: MovementReason;
  delta: number;          // + or -
  before: number;         // on-hand before
  after: number;          // on-hand after
  user?: string;
  orderId?: string;
  poId?: string;
  transferId?: string;
  note?: string;
};

export type PurchaseOrderLine = {
  productId: string;
  qty: number;
  cost: number;
  received?: number;      // running total received
};

export type PurchaseOrderStatus = "Draft" | "Ordered" | "Partially received" | "Received" | "Cancelled";

export type PurchaseOrder = {
  id: string;
  number: string;                 // "PO-1001"
  supplier: string;
  supplierEmail?: string;
  warehouseId: string;
  lines: PurchaseOrderLine[];
  status: PurchaseOrderStatus;
  expectedDate?: number;
  receivedDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
};

export type StockTransferStatus = "Draft" | "In transit" | "Received" | "Cancelled";

export type StockTransferLine = { productId: string; qty: number };

export type StockTransfer = {
  id: string;
  number: string;                 // "TR-2001"
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: StockTransferLine[];
  status: StockTransferStatus;
  transferredBy?: string;
  transferDate?: number;
  receivedDate?: number;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
};


type TenantData = {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  media: MediaAsset[];
  mediaFolders: MediaFolder[];
  categories: Category[];
  collections: Collection[];
  coupons: Coupon[];
  cart: CartItem[];
  savedForLater: CartItem[];
  wishlist: string[];                  // product ids
  recentlyViewed: string[];            // product ids, most-recent first
  addCounts: Record<string, number>;   // productId → times added to cart (for "most added")
  wishlistCounts: Record<string, number>; // productId → times added to wishlist
  cartUpdatedAt?: number | null;       // last mutation timestamp (for abandonment)
  shippingRates: ShippingRate[];
  taxRate: number;                     // 0-1
  freeShippingThreshold?: number;
  appliedCoupon?: string | null;
  visitors: number;
  orderCounter: number;
  invoiceCounter: number;
  // Inventory & warehouse
  warehouses: Warehouse[];
  movements: StockMovement[];
  purchaseOrders: PurchaseOrder[];
  transfers: StockTransfer[];
  poCounter: number;
  transferCounter: number;
};


const DEFAULT_SHIPPING_RATES: ShippingRate[] = [
  { id: "standard", label: "Standard", cost: 6, etaDays: [3, 5], freeAbove: 75 },
  { id: "express", label: "Express", cost: 19, etaDays: [1, 2] },
  { id: "pickup", label: "In-store pickup", cost: 0, etaDays: [0, 1] },
];

function defaultWarehouse(): Warehouse {
  return {
    id: "wh_main", name: "Main Warehouse", code: "MAIN",
    location: "—", status: "Active", isDefault: true, createdAt: Date.now(),
  };
}

function emptyTenant(): TenantData {
  return {
    products: [], orders: [], customers: [], media: [], mediaFolders: [],
    categories: [], collections: [], coupons: [],
    cart: [], savedForLater: [], wishlist: [], recentlyViewed: [],
    addCounts: {}, wishlistCounts: {}, cartUpdatedAt: null,
    shippingRates: DEFAULT_SHIPPING_RATES, taxRate: 0.08, freeShippingThreshold: 75,
    appliedCoupon: null, visitors: 0, orderCounter: 1000, invoiceCounter: 2000,
    warehouses: [defaultWarehouse()],
    movements: [], purchaseOrders: [], transfers: [],
    poCounter: 1000, transferCounter: 2000,
  };
}


type State = TenantData & {
  activeTenantId: string;
  tenants: Record<string, TenantData>;
  switchTenant: (tenantId: string) => void;


  // Products
  syncProducts: (products: Product[]) => void;
  addProduct: (p: Partial<Product>) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  duplicateProduct: (id: string) => void;
  archiveProduct: (id: string) => void;
  restoreProduct: (id: string) => void;
  bulkUpdateProducts: (ids: string[], patch: Partial<Product>) => void;
  bulkRemoveProducts: (ids: string[]) => void;

  // Categories
  addCategory: (c: Partial<Category>) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  duplicateCategory: (id: string) => Category | null;
  archiveCategory: (id: string) => void;
  restoreCategory: (id: string) => void;
  bulkUpdateCategories: (ids: string[], patch: Partial<Category>) => void;
  bulkRemoveCategories: (ids: string[]) => void;
  reorderCategories: (orderedIds: string[]) => void;

  // Collections
  addCollection: (c: Partial<Collection>) => Collection;
  updateCollection: (id: string, patch: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  duplicateCollection: (id: string) => Collection | null;
  archiveCollection: (id: string) => void;
  restoreCollection: (id: string) => void;
  bulkUpdateCollections: (ids: string[], patch: Partial<Collection>) => void;
  bulkRemoveCollections: (ids: string[]) => void;
  addProductToCollection: (collectionId: string, productId: string) => void;
  removeProductFromCollection: (collectionId: string, productId: string) => void;
  recomputeAutoCollections: () => void;

  // Coupons
  addCoupon: (c: Partial<Coupon>) => Coupon;
  updateCoupon: (id: string, patch: Partial<Coupon>) => void;
  removeCoupon: (id: string) => void;

  // Cart
  addToCart: (productId: string, qty?: number) => { ok: boolean; message: string };
  updateCartQty: (productId: string, qty: number) => { ok: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  clearCoupon: () => void;

  // Wishlist
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => boolean;         // returns new state
  clearWishlist: () => void;
  moveWishlistToCart: (productId: string) => { ok: boolean; message: string };

  // Saved for later
  saveForLater: (productId: string) => void;
  moveSavedToCart: (productId: string) => { ok: boolean; message: string };
  removeSavedForLater: (productId: string) => void;

  // Recently viewed
  trackProductView: (productId: string) => void;

  // Shipping / tax settings
  setShippingRates: (rates: ShippingRate[]) => void;
  setTaxRate: (rate: number) => void;
  setFreeShippingThreshold: (v: number | undefined) => void;

  // Orders & checkout
  placeOrder: (input: {
    email: string;
    name: string;
    phone?: string;
    shipping?: Address;
    billing?: Address;
    billingSameAsShipping?: boolean;
    shippingMethod?: OrderShippingMethod;
    paymentMethod?: string;
    couponCode?: string;
    notes?: string;
    taxRate?: number;
    /** when provided, the customer is classified as portal + linked to the auth user */
    userId?: string;
    userName?: string;
  }) => Order | { error: string };

  updateOrder: (id: string, patch: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  removeManyOrders: (ids: string[]) => void;
  fulfillOrder: (id: string) => void;
  refundOrder: (id: string, opts?: { restock?: boolean }) => void;
  cancelOrder: (id: string, opts?: { restock?: boolean; reason?: string }) => void;
  duplicateOrder: (id: string) => Order | null;
  setOrderStatus: (id: string, status: OrderStatus, note?: string) => void;
  setOrders: (orders: Order[]) => void;
  setOrderPaymentStatus: (id: string, ps: PaymentStatus, note?: string) => void;
  setOrderShippingStatus: (id: string, ss: ShippingStatus, note?: string) => void;
  setOrderTracking: (id: string, tracking: string, carrier?: string) => void;
  addOrderNote: (id: string, text: string) => void;
  bulkOrderStatus: (ids: string[], status: OrderStatus) => void;
  bulkMarkOrdersPaid: (ids: string[]) => void;
  bulkShipOrders: (ids: string[]) => void;
  bulkCancelOrders: (ids: string[], opts?: { restock?: boolean }) => void;


  // Customers
  addCustomer: (c: Partial<Customer>) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;

  // Media
  addMedia: (m: Partial<MediaAsset>) => MediaAsset;
  updateMedia: (id: string, patch: Partial<MediaAsset>) => void;
  removeMedia: (id: string) => void;
  removeManyMedia: (ids: string[]) => void;
  duplicateMedia: (id: string) => MediaAsset | null;
  moveMediaToFolder: (ids: string[], folderId: string | null) => void;
  registerUpload: (a: Partial<MediaAsset> & { url: string }) => MediaAsset;
  // Media folders
  addFolder: (name: string, parentId?: string | null) => MediaFolder;
  renameFolder: (id: string, name: string) => void;
  removeFolder: (id: string, opts?: { cascade?: boolean }) => void;

  // Warehouses
  addWarehouse: (w: Partial<Warehouse>) => Warehouse;
  updateWarehouse: (id: string, patch: Partial<Warehouse>) => void;
  removeWarehouse: (id: string) => void;
  setDefaultWarehouse: (id: string) => void;

  // Stock adjustments & movements
  adjustStock: (input: {
    productId: string; delta: number; reason: MovementReason;
    warehouseId?: string; note?: string; user?: string;
    orderId?: string; poId?: string; transferId?: string;
  }) => void;
  bulkAdjustStock: (ids: string[], mode: "set" | "add" | "sub", value: number, reason?: MovementReason, note?: string) => void;
  bulkAssignWarehouse: (ids: string[], warehouseId: string) => void;
  markDamaged: (productId: string, qty: number, note?: string) => void;
  markReturned: (productId: string, qty: number, note?: string) => void;
  reserveStock: (productId: string, qty: number, orderId?: string) => void;
  releaseStock: (productId: string, qty: number, orderId?: string) => void;

  // Purchase orders
  addPurchaseOrder: (po: Partial<PurchaseOrder>) => PurchaseOrder;
  updatePurchaseOrder: (id: string, patch: Partial<PurchaseOrder>) => void;
  removePurchaseOrder: (id: string) => void;
  receivePurchaseOrder: (id: string, opts?: { partial?: PurchaseOrderLine[] }) => void;
  cancelPurchaseOrder: (id: string) => void;

  // Stock transfers
  addStockTransfer: (t: Partial<StockTransfer>) => StockTransfer;
  updateStockTransfer: (id: string, patch: Partial<StockTransfer>) => void;
  removeStockTransfer: (id: string) => void;
  receiveStockTransfer: (id: string) => void;
  cancelStockTransfer: (id: string) => void;

  bumpVisitors: () => void;
  resetAll: () => void;

};

function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

function slugify(s: string) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item-" + Math.random().toString(36).slice(2, 6);
}

/* Apply a status transition and derive paymentStatus/shippingStatus/fulfillment. */
function applyStatusTransition(o: Order, next: OrderStatus, note?: string): Order {
  const now = Date.now();
  let paymentStatus = o.paymentStatus;
  let shippingStatus = o.shippingStatus;
  let fulfillment = o.fulfillment;
  switch (next) {
    case "Paid": paymentStatus = "Paid"; break;
    case "Processing": shippingStatus = "Processing"; if (paymentStatus === "Unpaid") paymentStatus = "Paid"; break;
    case "Packed": shippingStatus = "Packed"; break;
    case "Shipped": shippingStatus = "Shipped"; break;
    case "Out for delivery": shippingStatus = "Out for delivery"; break;
    case "Delivered": shippingStatus = "Delivered"; fulfillment = "Fulfilled"; break;
    case "Returned": shippingStatus = "Returned"; break;
    case "Refunded": paymentStatus = "Refunded"; break;
    case "Cancelled": break;
    case "Failed": paymentStatus = "Failed"; break;
  }
  return {
    ...o,
    status: next,
    paymentStatus,
    shippingStatus,
    fulfillment,
    updatedAt: now,
    timeline: [...o.timeline, { at: now, label: statusLabel(next), status: next, description: note, kind: "system" }],
  };
}

function statusLabel(s: OrderStatus): string {
  switch (s) {
    case "Paid": return "Payment received";
    case "Processing": return "Processing started";
    case "Packed": return "Order packed";
    case "Shipped": return "Order shipped";
    case "Out for delivery": return "Out for delivery";
    case "Delivered": return "Order delivered";
    case "Cancelled": return "Order cancelled";
    case "Returned": return "Order returned";
    case "Refunded": return "Order refunded";
    case "Failed": return "Order failed";
    case "Confirmed": return "Order confirmed";
    case "Draft": return "Marked as draft";
    default: return `Marked ${s.toLowerCase()}`;
  }
}


/* ------------ helpers that operate on the active tenant ------------- */

function saveTenant(state: State): Partial<State> {
  const {
    products, orders, customers, media, mediaFolders, categories, collections, coupons,
    cart, savedForLater, wishlist, recentlyViewed, addCounts, wishlistCounts, cartUpdatedAt,
    shippingRates, taxRate, freeShippingThreshold,
    appliedCoupon, visitors, orderCounter, invoiceCounter,
    warehouses, movements, purchaseOrders, transfers, poCounter, transferCounter,
  } = state;
  const snapshot: TenantData = {
    products, orders, customers, media, mediaFolders, categories, collections, coupons,
    cart, savedForLater, wishlist, recentlyViewed, addCounts, wishlistCounts, cartUpdatedAt,
    shippingRates, taxRate, freeShippingThreshold,
    appliedCoupon, visitors, orderCounter, invoiceCounter,
    warehouses, movements, purchaseOrders, transfers, poCounter, transferCounter,
  };
  return { tenants: { ...state.tenants, [state.activeTenantId]: snapshot } };
}



function matchRule(p: Product, r: CollectionRule, byCatId?: Map<string, string>): boolean {
  const v = (r.value ?? "").trim();
  switch (r.field) {
    case "tag": return (p.tags ?? []).some((t) => t.toLowerCase() === v.toLowerCase());
    case "category": {
      // value may be a category id or a plain name
      const asName = byCatId?.get(v);
      return p.category === v || (!!asName && p.category === asName);
    }
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
}

function computeAutoCollection(all: Product[], rules?: CollectionRule[], match: "all" | "any" = "all", byCatId?: Map<string, string>): string[] {
  if (!rules?.length) return [];
  const test = (p: Product) => match === "any"
    ? rules.some((r) => matchRule(p, r, byCatId))
    : rules.every((r) => matchRule(p, r, byCatId));
  return all.filter(test).map((p) => p.id);
}

/* --------------------------- store ---------------------------------- */

export const useStoreData = create<State>()(
  persist(
    (set, get) => ({
      activeTenantId: "default",
      tenants: {},
      ...emptyTenant(),

      switchTenant: (tenantId) => {
        const state = get();
        // Persist current tenant snapshot before switching
        const snap: TenantData = {
          products: state.products, orders: state.orders, customers: state.customers,
          media: state.media, mediaFolders: state.mediaFolders,
          categories: state.categories, collections: state.collections,
          coupons: state.coupons,
          cart: state.cart, savedForLater: state.savedForLater, wishlist: state.wishlist,
          recentlyViewed: state.recentlyViewed, addCounts: state.addCounts,
          wishlistCounts: state.wishlistCounts, cartUpdatedAt: state.cartUpdatedAt,
          shippingRates: state.shippingRates, taxRate: state.taxRate,
          freeShippingThreshold: state.freeShippingThreshold,
          appliedCoupon: state.appliedCoupon,
          visitors: state.visitors, orderCounter: state.orderCounter, invoiceCounter: state.invoiceCounter,
          warehouses: state.warehouses, movements: state.movements,
          purchaseOrders: state.purchaseOrders, transfers: state.transfers,
          poCounter: state.poCounter, transferCounter: state.transferCounter,
        };


        const tenants = { ...state.tenants, [state.activeTenantId]: snap };
        const next = tenants[tenantId] ?? emptyTenant();
        set({ activeTenantId: tenantId, tenants, ...next });
      },

      /* -------------------- Products -------------------- */
      syncProducts: (products) => set((s) => {
        return { products, ...saveTenant({ ...s, products }) };
      }),

      addProduct: (p) => {
        const name = p.name ?? "Untitled product";
        const images = p.images ?? (p.imageUrl ? [p.imageUrl] : []);
        const item: Product = {
          id: uid("prod"),
          name,
          handle: p.handle ? slugify(p.handle) : slugify(name),
          sku: p.sku ?? "SKU-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
          barcode: p.barcode,
          price: p.price ?? 0,
          compareAtPrice: p.compareAtPrice,
          category: p.category ?? "Uncategorized",
          collectionIds: p.collectionIds ?? [],
          brand: p.brand,
          vendor: p.vendor,
          productType: p.productType,
          stock: p.stock ?? 0,
          trackInventory: p.trackInventory ?? true,
          status: p.status ?? "Draft",
          images,
          imageUrl: images[0] ?? p.imageUrl,
          description: p.description ?? "",
          shortDescription: p.shortDescription ?? "",
          tags: p.tags ?? [],
          weight: p.weight,
          dimensions: p.dimensions,
          taxable: p.taxable ?? true,
          requiresShipping: p.requiresShipping ?? true,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          featured: p.featured ?? false,
          costPerItem: p.costPerItem,
          lowStockThreshold: p.lowStockThreshold ?? 5,
          continueSellingWhenOutOfStock: p.continueSellingWhenOutOfStock ?? false,
          isDigital: p.isDigital ?? false,
          options: p.options ?? [],
          variants: p.variants ?? [],
          imageAlts: p.imageAlts ?? [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => {
          const products = [item, ...s.products];
          const wh = s.warehouses.find((w) => w.isDefault)?.id;
          const mv: StockMovement = {
            id: `mv_${Date.now().toString(36)}`, at: Date.now(),
            productId: item.id, productName: item.name, warehouseId: wh,
            reason: "product-created", delta: item.stock, before: 0, after: item.stock,
            note: "Initial stock",
          };
          const movements = [mv, ...s.movements].slice(0, 2000);
          return { products, movements, ...saveTenant({ ...s, products, movements }) };
        });
        return item;
      },

      updateProduct: (id, patch) => set((s) => {
        const products = s.products.map((x) => {
          if (x.id !== id) return x;
          const merged = { ...x, ...patch, updatedAt: Date.now() };
          if (patch.images) merged.imageUrl = patch.images[0] ?? merged.imageUrl;
          if (patch.name && !patch.handle) merged.handle = slugify(patch.name);
          return merged;
        });
        return { products, ...saveTenant({ ...s, products }) };
      }),
      removeProduct: (id) => set((s) => {
        const products = s.products.filter((x) => x.id !== id);
        const cart = s.cart.filter((c) => c.productId !== id);
        return { products, cart, ...saveTenant({ ...s, products, cart }) };
      }),
      duplicateProduct: (id) => set((s) => {
        const src = s.products.find((x) => x.id === id);
        if (!src) return s;
        const now = Date.now();
        const clone: Product = {
          ...src, id: uid("prod"),
          name: src.name + " (copy)",
          handle: slugify(src.name + " copy " + Math.random().toString(36).slice(2, 5)),
          sku: (src.sku || "SKU") + "-COPY",
          status: "Draft",
          variants: (src.variants ?? []).map((v) => ({ ...v, id: uid("var") })),
          createdAt: now, updatedAt: now, archivedAt: undefined,
        };
        const products = [clone, ...s.products];
        return { products, ...saveTenant({ ...s, products }) };
      }),
      archiveProduct: (id) => set((s) => {
        const now = Date.now();
        const products = s.products.map((p) => p.id === id ? { ...p, status: "Archived" as const, archivedAt: now, updatedAt: now } : p);
        return { products, ...saveTenant({ ...s, products }) };
      }),
      restoreProduct: (id) => set((s) => {
        const now = Date.now();
        const products = s.products.map((p) => p.id === id ? { ...p, status: "Draft" as const, archivedAt: undefined, updatedAt: now } : p);
        return { products, ...saveTenant({ ...s, products }) };
      }),
      bulkUpdateProducts: (ids, patch) => set((s) => {
        const now = Date.now();
        const set2 = new Set(ids);
        const products = s.products.map((p) => set2.has(p.id) ? { ...p, ...patch, updatedAt: now } : p);
        return { products, ...saveTenant({ ...s, products }) };
      }),
      bulkRemoveProducts: (ids) => set((s) => {
        const set2 = new Set(ids);
        const products = s.products.filter((p) => !set2.has(p.id));
        const cart = s.cart.filter((c) => !set2.has(c.productId));
        return { products, cart, ...saveTenant({ ...s, products, cart }) };
      }),

      /* -------------------- Categories -------------------- */
      addCategory: (c) => {
        const name = c.name ?? "New category";
        const now = Date.now();
        const item: Category = {
          id: uid("cat"), name, handle: c.handle ? slugify(c.handle) : slugify(name),
          description: c.description, imageUrl: c.imageUrl,
          bannerUrl: c.bannerUrl, iconUrl: c.iconUrl,
          parentId: c.parentId,
          status: c.status ?? "Active",
          sortOrder: c.sortOrder ?? 0,
          seoTitle: c.seoTitle, seoDescription: c.seoDescription, keywords: c.keywords,
          createdAt: now, updatedAt: now,
        };
        set((s) => ({ categories: [item, ...s.categories], ...saveTenant({ ...s, categories: [item, ...s.categories] }) }));
        return item;
      },
      updateCategory: (id, patch) => set((s) => {
        const now = Date.now();
        const categories = s.categories.map((x) => x.id === id ? { ...x, ...patch, updatedAt: now } : x);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      removeCategory: (id) => set((s) => {
        // Reparent children to the removed node's parent so we don't orphan them.
        const removed = s.categories.find((c) => c.id === id);
        const newParent = removed?.parentId;
        const categories = s.categories
          .filter((x) => x.id !== id)
          .map((x) => (x.parentId === id ? { ...x, parentId: newParent, updatedAt: Date.now() } : x));
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      duplicateCategory: (id) => {
        const src = get().categories.find((c) => c.id === id);
        if (!src) return null;
        return get().addCategory({
          ...src, id: undefined as any,
          name: src.name + " (copy)",
          handle: slugify(src.name + " copy " + Math.random().toString(36).slice(2, 5)),
          status: "Draft",
        });
      },
      archiveCategory: (id) => set((s) => {
        const now = Date.now();
        const categories = s.categories.map((c) => c.id === id ? { ...c, status: "Archived" as const, archivedAt: now, updatedAt: now } : c);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      restoreCategory: (id) => set((s) => {
        const now = Date.now();
        const categories = s.categories.map((c) => c.id === id ? { ...c, status: "Active" as const, archivedAt: undefined, updatedAt: now } : c);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      bulkUpdateCategories: (ids, patch) => set((s) => {
        const set2 = new Set(ids); const now = Date.now();
        const categories = s.categories.map((c) => set2.has(c.id) ? { ...c, ...patch, updatedAt: now } : c);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      bulkRemoveCategories: (ids) => set((s) => {
        const set2 = new Set(ids);
        const categories = s.categories.filter((c) => !set2.has(c.id))
          .map((c) => c.parentId && set2.has(c.parentId) ? { ...c, parentId: undefined } : c);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),
      reorderCategories: (orderedIds) => set((s) => {
        const idx = new Map(orderedIds.map((id, i) => [id, i]));
        const categories = s.categories.map((c) => idx.has(c.id) ? { ...c, sortOrder: idx.get(c.id)! } : c);
        return { categories, ...saveTenant({ ...s, categories }) };
      }),

      /* -------------------- Collections -------------------- */
      addCollection: (c) => {
        const name = c.name ?? "New collection";
        const now = Date.now();
        const item: Collection = {
          id: uid("col"), name, handle: c.handle ? slugify(c.handle) : slugify(name),
          description: c.description, imageUrl: c.imageUrl, bannerUrl: c.bannerUrl,
          kind: c.kind ?? "manual", match: c.match ?? "all",
          productIds: c.productIds ?? [], rules: c.rules,
          status: c.status ?? "Active", sortOrder: c.sortOrder ?? 0,
          seoTitle: c.seoTitle, seoDescription: c.seoDescription, keywords: c.keywords,
          createdAt: now, updatedAt: now,
        };
        if (item.kind === "auto") {
          const byId = new Map(get().categories.map((c) => [c.id, c.name] as const));
          item.productIds = computeAutoCollection(get().products, item.rules, item.match, byId);
        }
        set((s) => ({ collections: [item, ...s.collections], ...saveTenant({ ...s, collections: [item, ...s.collections] }) }));
        return item;
      },
      updateCollection: (id, patch) => set((s) => {
        const now = Date.now();
        const byId = new Map(s.categories.map((c) => [c.id, c.name] as const));
        const collections = s.collections.map((x) => {
          if (x.id !== id) return x;
          const merged = { ...x, ...patch, updatedAt: now };
          if (merged.kind === "auto") merged.productIds = computeAutoCollection(s.products, merged.rules, merged.match ?? "all", byId);
          return merged;
        });
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      removeCollection: (id) => set((s) => {
        const collections = s.collections.filter((x) => x.id !== id);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      duplicateCollection: (id) => {
        const src = get().collections.find((c) => c.id === id);
        if (!src) return null;
        return get().addCollection({
          ...src, id: undefined as any,
          name: src.name + " (copy)",
          handle: slugify(src.name + " copy " + Math.random().toString(36).slice(2, 5)),
          status: "Draft",
        });
      },
      archiveCollection: (id) => set((s) => {
        const now = Date.now();
        const collections = s.collections.map((c) => c.id === id ? { ...c, status: "Archived" as const, archivedAt: now, updatedAt: now } : c);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      restoreCollection: (id) => set((s) => {
        const now = Date.now();
        const collections = s.collections.map((c) => c.id === id ? { ...c, status: "Active" as const, archivedAt: undefined, updatedAt: now } : c);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      bulkUpdateCollections: (ids, patch) => set((s) => {
        const set2 = new Set(ids); const now = Date.now();
        const byId = new Map(s.categories.map((c) => [c.id, c.name] as const));
        const collections = s.collections.map((c) => {
          if (!set2.has(c.id)) return c;
          const merged = { ...c, ...patch, updatedAt: now };
          if (merged.kind === "auto") merged.productIds = computeAutoCollection(s.products, merged.rules, merged.match ?? "all", byId);
          return merged;
        });
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      bulkRemoveCollections: (ids) => set((s) => {
        const set2 = new Set(ids);
        const collections = s.collections.filter((c) => !set2.has(c.id));
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      recomputeAutoCollections: () => set((s) => {
        const byId = new Map(s.categories.map((c) => [c.id, c.name] as const));
        const collections = s.collections.map((c) => c.kind === "auto"
          ? { ...c, productIds: computeAutoCollection(s.products, c.rules, c.match ?? "all", byId) }
          : c);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      addProductToCollection: (collectionId, productId) => set((s) => {
        const collections = s.collections.map((c) => c.id === collectionId
          ? { ...c, productIds: c.productIds.includes(productId) ? c.productIds : [...c.productIds, productId] }
          : c);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),
      removeProductFromCollection: (collectionId, productId) => set((s) => {
        const collections = s.collections.map((c) => c.id === collectionId
          ? { ...c, productIds: c.productIds.filter((p) => p !== productId) }
          : c);
        return { collections, ...saveTenant({ ...s, collections }) };
      }),

      /* -------------------- Coupons -------------------- */
      addCoupon: (c) => {
        const item: Coupon = {
          id: uid("cpn"),
          code: (c.code ?? "SAVE10").toUpperCase(),
          kind: c.kind ?? "percent",
          value: c.value ?? 10,
          active: c.active ?? true,
          minSubtotal: c.minSubtotal,
          createdAt: Date.now(),
        };
        set((s) => ({ coupons: [item, ...s.coupons], ...saveTenant({ ...s, coupons: [item, ...s.coupons] }) }));
        return item;
      },
      updateCoupon: (id, patch) => set((s) => {
        const coupons = s.coupons.map((x) => x.id === id ? { ...x, ...patch, code: (patch.code ?? x.code).toUpperCase() } : x);
        return { coupons, ...saveTenant({ ...s, coupons }) };
      }),
      removeCoupon: (id) => set((s) => {
        const coupons = s.coupons.filter((x) => x.id !== id);
        return { coupons, ...saveTenant({ ...s, coupons }) };
      }),

      /* -------------------- Cart -------------------- */
      addToCart: (productId, qty = 1) => {
        const s = get();
        const p = s.products.find((pp) => pp.id === productId);
        if (!p) return { ok: false, message: "Product not found." };
        if (p.status !== "Published") return { ok: false, message: "This product is not available." };
        const existing = s.cart.find((c) => c.productId === productId);
        const nextQty = (existing?.qty ?? 0) + qty;
        if (p.trackInventory !== false && p.continueSellingWhenOutOfStock !== true) {
          if (p.stock <= 0) return { ok: false, message: `${p.name} is out of stock.` };
          if (nextQty > p.stock) return { ok: false, message: `Only ${p.stock} of ${p.name} in stock.` };
        }
        const now = Date.now();
        const cart = existing
          ? s.cart.map((c) => c.productId === productId ? { ...c, qty: nextQty, addedAt: now } : c)
          : [...s.cart, { productId, qty, addedAt: now }];
        // Once moved to cart, drop from saved-for-later.
        const savedForLater = s.savedForLater.filter((c) => c.productId !== productId);
        const addCounts = { ...s.addCounts, [productId]: (s.addCounts[productId] ?? 0) + qty };
        set((st) => ({ cart, savedForLater, addCounts, cartUpdatedAt: now,
          ...saveTenant({ ...st, cart, savedForLater, addCounts, cartUpdatedAt: now }) }));
        return { ok: true, message: `${p.name} added to cart.` };
      },
      updateCartQty: (productId, qty) => {
        const s = get();
        if (qty <= 0) {
          const cart = s.cart.filter((c) => c.productId !== productId);
          const now = Date.now();
          set((st) => ({ cart, cartUpdatedAt: now, ...saveTenant({ ...st, cart, cartUpdatedAt: now }) }));
          return { ok: true, message: "Removed from cart." };
        }
        const p = s.products.find((pp) => pp.id === productId);
        if (p && p.trackInventory !== false && p.continueSellingWhenOutOfStock !== true && qty > p.stock) {
          return { ok: false, message: `Only ${p.stock} in stock.` };
        }
        const now = Date.now();
        const cart = s.cart.map((c) => c.productId === productId ? { ...c, qty } : c);
        set((st) => ({ cart, cartUpdatedAt: now, ...saveTenant({ ...st, cart, cartUpdatedAt: now }) }));
        return { ok: true, message: "" };
      },
      removeFromCart: (productId) => set((s) => {
        const now = Date.now();
        const cart = s.cart.filter((c) => c.productId !== productId);
        return { cart, cartUpdatedAt: now, ...saveTenant({ ...s, cart, cartUpdatedAt: now }) };
      }),
      clearCart: () => set((s) => ({
        cart: [], appliedCoupon: null, cartUpdatedAt: Date.now(),
        ...saveTenant({ ...s, cart: [], appliedCoupon: null, cartUpdatedAt: Date.now() }),
      })),
      applyCoupon: (code) => {
        const s = get();
        const c = s.coupons.find((x) => x.code === code.toUpperCase() && x.active);
        if (!c) return { ok: false, message: "Invalid or expired coupon code." };
        if (c.expiresAt && c.expiresAt < Date.now()) return { ok: false, message: `Coupon ${c.code} has expired.` };
        const subtotal = s.cart.reduce((sum, ci) => {
          const p = s.products.find((pp) => pp.id === ci.productId);
          return sum + (p ? p.price * ci.qty : 0);
        }, 0);
        if (c.minSubtotal && subtotal < c.minSubtotal) {
          return { ok: false, message: `Minimum order of ${c.minSubtotal} required.` };
        }
        set((st) => ({ appliedCoupon: c.code, ...saveTenant({ ...st, appliedCoupon: c.code }) }));
        return { ok: true, message: `Coupon ${c.code} applied.` };
      },

      clearCoupon: () => set((s) => ({ appliedCoupon: null, ...saveTenant({ ...s, appliedCoupon: null }) })),

      /* -------------------- Wishlist -------------------- */
      addToWishlist: (productId) => set((s) => {
        if (s.wishlist.includes(productId)) return {} as any;
        const wishlist = [productId, ...s.wishlist];
        const wishlistCounts = { ...s.wishlistCounts, [productId]: (s.wishlistCounts[productId] ?? 0) + 1 };
        return { wishlist, wishlistCounts, ...saveTenant({ ...s, wishlist, wishlistCounts }) };
      }),
      removeFromWishlist: (productId) => set((s) => {
        const wishlist = s.wishlist.filter((id) => id !== productId);
        return { wishlist, ...saveTenant({ ...s, wishlist }) };
      }),
      toggleWishlist: (productId) => {
        const s = get();
        const isIn = s.wishlist.includes(productId);
        if (isIn) { s.removeFromWishlist(productId); return false; }
        s.addToWishlist(productId); return true;
      },
      clearWishlist: () => set((s) => ({ wishlist: [], ...saveTenant({ ...s, wishlist: [] }) })),
      moveWishlistToCart: (productId) => {
        const r = get().addToCart(productId, 1);
        if (r.ok) get().removeFromWishlist(productId);
        return r;
      },

      /* -------------------- Saved for later -------------------- */
      saveForLater: (productId) => set((s) => {
        const line = s.cart.find((c) => c.productId === productId);
        if (!line) return {} as any;
        const cart = s.cart.filter((c) => c.productId !== productId);
        const savedForLater = [{ productId, qty: line.qty, addedAt: Date.now() }, ...s.savedForLater.filter((c) => c.productId !== productId)];
        return { cart, savedForLater, cartUpdatedAt: Date.now(), ...saveTenant({ ...s, cart, savedForLater, cartUpdatedAt: Date.now() }) };
      }),
      moveSavedToCart: (productId) => {
        const s = get();
        const line = s.savedForLater.find((c) => c.productId === productId);
        const r = get().addToCart(productId, line?.qty ?? 1);
        if (r.ok) {
          const savedForLater = get().savedForLater.filter((c) => c.productId !== productId);
          set((st) => ({ savedForLater, ...saveTenant({ ...st, savedForLater }) }));
        }
        return r;
      },
      removeSavedForLater: (productId) => set((s) => {
        const savedForLater = s.savedForLater.filter((c) => c.productId !== productId);
        return { savedForLater, ...saveTenant({ ...s, savedForLater }) };
      }),

      /* -------------------- Recently viewed -------------------- */
      trackProductView: (productId) => set((s) => {
        const recentlyViewed = [productId, ...s.recentlyViewed.filter((id) => id !== productId)].slice(0, 20);
        return { recentlyViewed, ...saveTenant({ ...s, recentlyViewed }) };
      }),

      /* -------------------- Shipping / tax settings -------------------- */
      setShippingRates: (rates) => set((s) => ({ shippingRates: rates, ...saveTenant({ ...s, shippingRates: rates }) })),
      setTaxRate: (rate) => set((s) => ({ taxRate: rate, ...saveTenant({ ...s, taxRate: rate }) })),
      setFreeShippingThreshold: (v) => set((s) => ({ freeShippingThreshold: v, ...saveTenant({ ...s, freeShippingThreshold: v }) })),

      /* -------------------- Orders & Checkout -------------------- */
      placeOrder: (input) => {
        const s = get();
        if (!s.cart.length) return { error: "Your cart is empty." };
        // Build items & check stock
        const items: OrderItem[] = [];
        for (const ci of s.cart) {
          const p = s.products.find((pp) => pp.id === ci.productId);
          if (!p) continue;
          if (p.trackInventory !== false && !p.continueSellingWhenOutOfStock && p.stock < ci.qty) {
            return { error: `Not enough stock for ${p.name}.` };
          }
          items.push({
            productId: p.id, name: p.name, price: p.price, qty: ci.qty,
            image: p.images?.[0] ?? p.imageUrl, sku: p.sku,
          });
        }
        if (!items.length) return { error: "Cart contains no valid products." };

        const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        // Discount
        const couponCode = (input.couponCode ?? s.appliedCoupon ?? "").toString().toUpperCase();
        const coupon = couponCode ? s.coupons.find((c) => c.code === couponCode && c.active) : undefined;
        let discount = 0;
        if (coupon) {
          if (coupon.expiresAt && coupon.expiresAt < Date.now()) {
            return { error: `Coupon ${coupon.code} has expired.` };
          }
          if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
            return { error: `Coupon ${coupon.code} requires a minimum subtotal of ${coupon.minSubtotal}.` };
          }
          discount = coupon.kind === "percent" ? subtotal * (coupon.value / 100) : Math.min(coupon.value, subtotal);
        }
        const requiresShipping = items.some((i) => {
          const p = s.products.find((pp) => pp.id === i.productId);
          return p ? (p.requiresShipping ?? true) && !p.isDigital : true;
        });
        const rate = input.shippingMethod;
        const method: OrderShippingMethod | undefined = rate ? { ...rate } : undefined;
        let shippingCost = requiresShipping ? (method?.cost ?? 0) : 0;
        const qualifiesFree =
          (coupon?.freeShipping) ||
          (s.freeShippingThreshold != null && subtotal - discount >= s.freeShippingThreshold) ||
          (rate?.id && s.shippingRates.find((r) => r.id === rate.id)?.freeAbove != null &&
            subtotal - discount >= (s.shippingRates.find((r) => r.id === rate.id)?.freeAbove ?? Infinity));
        if (qualifiesFree) shippingCost = 0;
        if (method) method.cost = shippingCost;

        const taxable = Math.max(0, subtotal - discount);
        const taxRate = input.taxRate ?? s.taxRate ?? 0;
        const tax = Math.max(0, taxable * taxRate);
        const total = Math.max(0, taxable + shippingCost + tax);

        // Estimated delivery window
        const now = Date.now();
        const [minDays, maxDays] = method?.etaDays ?? [3, 7];
        const estimatedDelivery = {
          earliest: now + minDays * 86400000,
          latest: now + maxDays * 86400000,
        };

        // Upsert customer + merge saved address
        const mergeAddresses = (existing: Address[] = [], next?: Address) => {
          if (!next) return existing;
          const sig = (a: Address) => [a.line1, a.line2, a.apartment, a.city, a.state, a.zip, a.country].map((x) => (x ?? "").toString().trim().toLowerCase()).join("|");
          return existing.some((a) => sig(a) === sig(next)) ? existing : [next, ...existing];
        };
        const classification: CustomerType = input.userId ? "portal" : "direct";
        const nowTs = Date.now();
        let customer = s.customers.find((c) => c.email.toLowerCase() === input.email.toLowerCase());
        if (customer) {
          customer = {
            ...customer,
            name: customer.name || input.name,
            phone: customer.phone ?? input.phone,
            ordersCount: customer.ordersCount + 1,
            totalSpent: customer.totalSpent + total,
            addresses: mergeAddresses(customer.addresses ?? [], input.shipping),
            // Portal wins over direct: signed-in checkout upgrades classification permanently.
            type: customer.type === "portal" || classification === "portal" ? "portal" : "direct",
            status: customer.status ?? "active",
            lastOrderAt: nowTs,
            userId: customer.userId ?? input.userId,
            rewardPoints: (customer.rewardPoints ?? 0) + Math.round(total),
          };
        } else {
          customer = {
            id: uid("cust"), name: input.name, email: input.email, phone: input.phone,
            addresses: input.shipping ? [input.shipping] : [],
            ordersCount: 1, totalSpent: total, createdAt: nowTs,
            type: classification, status: "active", lastOrderAt: nowTs,
            userId: input.userId, rewardPoints: Math.round(total),
          };
        }

        const orderNumber = "#" + (s.orderCounter + 1);
        const invoiceNumber = "INV-" + (s.invoiceCounter + 1);
        const transactionId = uid("txn").toUpperCase();
        const billingSameAsShipping = input.billingSameAsShipping ?? !input.billing;
        const payMethod = input.paymentMethod ?? "Card";
        const now2 = Date.now();
        const order: Order = {
          id: uid("ord"), number: orderNumber, invoiceNumber, transactionId,
          customerId: customer.id, customerName: input.name, customerEmail: input.email,
          customerPhone: input.phone,
          items, itemsCount: items.reduce((n, i) => n + i.qty, 0),
          subtotal, discount, shippingCost, tax, total,
          couponCode: coupon?.code,
          shipping: input.shipping,
          billing: billingSameAsShipping ? input.shipping : input.billing,
          billingSameAsShipping,
          paymentMethod: payMethod,
          shippingMethod: method,
          estimatedDelivery,
          notes: input.notes,
          status: "Confirmed",
          paymentStatus: "Paid",
          shippingStatus: requiresShipping ? "Processing" : "Not shipped",
          fulfillment: "Unfulfilled",
          timeline: [
            { at: now2, label: "Order placed", status: "Pending", description: `${items.length} item${items.length === 1 ? "" : "s"} · ${input.email}`, kind: "system" },
            { at: now2 + 1, label: "Order confirmed", status: "Confirmed", description: `Confirmation email queued to ${input.email}`, kind: "email" },
            { at: now2 + 2, label: "Payment received", status: "Paid", description: `${payMethod} · ${transactionId}`, kind: "system" },
            ...(requiresShipping ? [{ at: now2 + 3, label: "Processing", status: "Processing" as OrderStatus, description: "Fulfilment team notified", kind: "system" as const }] : []),
          ],
          createdAt: now2,
          updatedAt: now2,
        };


        // Decrement inventory + log movements
        const wh = s.warehouses.find((w) => w.isDefault)?.id ?? s.warehouses[0]?.id;
        const newMovements: StockMovement[] = [];
        const products = s.products.map((p) => {
          const line = items.find((i) => i.productId === p.id);
          if (!line || p.trackInventory === false) return p;
          const before = p.stock;
          const after = Math.max(0, before - line.qty);
          newMovements.push({
            id: `mv_${Date.now().toString(36)}_${p.id.slice(-4)}`,
            at: Date.now(), productId: p.id, productName: p.name,
            warehouseId: wh, reason: "order-placed", delta: after - before,
            before, after, orderId: order.id, note: `Order ${order.number}`,
          });
          return { ...p, stock: after };
        });
        const movements = [...newMovements, ...s.movements].slice(0, 2000);

        const customers = s.customers.some((c) => c.id === customer!.id)
          ? s.customers.map((c) => c.id === customer!.id ? customer! : c)
          : [customer!, ...s.customers];
        const orders = [order, ...s.orders];
        const orderCounter = s.orderCounter + 1;
        const invoiceCounter = s.invoiceCounter + 1;

        set((st) => ({
          products, customers, orders, orderCounter, invoiceCounter, movements,
          cart: [], appliedCoupon: null,
          ...saveTenant({ ...st, products, customers, orders, orderCounter, invoiceCounter, movements, cart: [], appliedCoupon: null }),
        }));
        return order;
      },


      updateOrder: (id, patch) => set((s) => {
        const orders = s.orders.map((x) => x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      removeOrder: (id) => set((s) => {
        const orders = s.orders.filter((x) => x.id !== id);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      removeManyOrders: (ids) => set((s) => {
        const idSet = new Set(ids);
        const orders = s.orders.filter((x) => !idSet.has(x.id));
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      setOrderStatus: (id, status, note) => set((s) => {
        const orders = s.orders.map((o) => {
          if (o.id !== id) return o;
          return applyStatusTransition(o, status, note);
        });
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      setOrderPaymentStatus: (id, ps, note) => set((s) => {
        const orders = s.orders.map((o) => o.id === id
          ? { ...o, paymentStatus: ps, updatedAt: Date.now(),
              timeline: [...o.timeline, { at: Date.now(), label: `Payment ${ps.toLowerCase()}`, description: note, kind: "system" as const }] }
          : o);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      setOrderShippingStatus: (id, ss, note) => set((s) => {
        const orders = s.orders.map((o) => o.id === id
          ? { ...o, shippingStatus: ss, updatedAt: Date.now(),
              timeline: [...o.timeline, { at: Date.now(), label: `Shipping ${ss.toLowerCase()}`, description: note, kind: "system" as const }] }
          : o);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      setOrderTracking: (id, tracking, carrier) => set((s) => {
        const orders = s.orders.map((o) => o.id === id
          ? { ...o, trackingNumber: tracking, carrier, updatedAt: Date.now(),
              timeline: [...o.timeline, { at: Date.now(), label: "Tracking added", description: `${carrier ? carrier + " · " : ""}${tracking}`, kind: "system" as const }] }
          : o);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      addOrderNote: (id, text) => set((s) => {
        if (!text.trim()) return {} as any;
        const orders = s.orders.map((o) => o.id === id
          ? { ...o, updatedAt: Date.now(),
              timeline: [...o.timeline, { at: Date.now(), label: "Note added", description: text.trim(), kind: "note" as const }] }
          : o);
        return { orders, ...saveTenant({ ...s, orders }) };
      }),
      fulfillOrder: (id) => get().setOrderStatus(id, "Delivered", "Marked delivered from dashboard"),
      refundOrder: (id, opts) => set((s) => {
        const orders = s.orders.map((o) => {
          if (o.id !== id) return o;
          return { ...o, status: "Refunded" as OrderStatus, paymentStatus: "Refunded" as PaymentStatus,
            updatedAt: Date.now(),
            timeline: [...o.timeline, { at: Date.now(), label: "Order refunded", status: "Refunded" as OrderStatus, description: `Amount ${o.total.toFixed(2)} refunded to ${o.paymentMethod ?? "customer"}`, kind: "system" as const }] };
        });
        // optional restock
        let products = s.products;
        let movements = s.movements;
        if (opts?.restock) {
          const o = s.orders.find((x) => x.id === id);
          const wh = s.warehouses.find((w) => w.isDefault)?.id;
          const mv: StockMovement[] = [];
          if (o) products = s.products.map((p) => {
            const line = o.items.find((i) => i.productId === p.id);
            if (!line || p.trackInventory === false) return p;
            const before = p.stock, after = before + line.qty;
            mv.push({ id: `mv_${Date.now().toString(36)}_${p.id.slice(-4)}`, at: Date.now(),
              productId: p.id, productName: p.name, warehouseId: wh, reason: "order-refunded",
              delta: line.qty, before, after, orderId: id, note: `Refund restock ${o.number}` });
            return { ...p, stock: after };
          });
          movements = [...mv, ...s.movements].slice(0, 2000);
        }
        return { orders, products, movements, ...saveTenant({ ...s, orders, products, movements }) };
      }),
      cancelOrder: (id, opts) => set((s) => {
        const orders = s.orders.map((o) => {
          if (o.id !== id) return o;
          return { ...o, status: "Cancelled" as OrderStatus,
            updatedAt: Date.now(),
            timeline: [...o.timeline, { at: Date.now(), label: "Order cancelled", status: "Cancelled" as OrderStatus, description: opts?.reason ?? "Cancelled by admin", kind: "system" as const }] };
        });
        let products = s.products;
        let movements = s.movements;
        if (opts?.restock !== false) {
          const o = s.orders.find((x) => x.id === id);
          const wh = s.warehouses.find((w) => w.isDefault)?.id;
          const mv: StockMovement[] = [];
          if (o && o.status !== "Cancelled") products = s.products.map((p) => {
            const line = o.items.find((i) => i.productId === p.id);
            if (!line || p.trackInventory === false) return p;
            const before = p.stock, after = before + line.qty;
            mv.push({ id: `mv_${Date.now().toString(36)}_${p.id.slice(-4)}`, at: Date.now(),
              productId: p.id, productName: p.name, warehouseId: wh, reason: "order-cancelled",
              delta: line.qty, before, after, orderId: id, note: `Cancel restock ${o.number}` });
            return { ...p, stock: after };
          });
          movements = [...mv, ...s.movements].slice(0, 2000);
        }
        return { orders, products, movements, ...saveTenant({ ...s, orders, products, movements }) };
      }),

      duplicateOrder: (id) => {
        const src = get().orders.find((o) => o.id === id);
        if (!src) return null;
        const s = get();
        const now3 = Date.now();
        const copy: Order = {
          ...src,
          id: uid("ord"),
          number: "#" + (s.orderCounter + 1),
          invoiceNumber: "INV-" + (s.invoiceCounter + 1),
          transactionId: undefined,
          status: "Draft",
          paymentStatus: "Unpaid",
          shippingStatus: "Not shipped",
          fulfillment: "Unfulfilled",
          trackingNumber: undefined,
          carrier: undefined,
          timeline: [{ at: now3, label: "Draft created", description: `Duplicated from ${src.number}`, kind: "system" }],
          createdAt: now3,
          updatedAt: now3,
        };
        set((st) => {
          const orders = [copy, ...st.orders];
          const orderCounter = st.orderCounter + 1;
          const invoiceCounter = st.invoiceCounter + 1;
          return { orders, orderCounter, invoiceCounter, ...saveTenant({ ...st, orders, orderCounter, invoiceCounter }) };
        });
        return copy;
      },
      bulkOrderStatus: (ids, status) => {
        const set2 = new Set(ids);
        set((s) => {
          const orders = s.orders.map((o) => set2.has(o.id) ? applyStatusTransition(o, status, "Bulk update") : o);
          return { orders, ...saveTenant({ ...s, orders }) };
        });
      },
      bulkMarkOrdersPaid: (ids) => {
        const set2 = new Set(ids);
        set((s) => {
          const orders = s.orders.map((o) => set2.has(o.id)
            ? { ...o, paymentStatus: "Paid" as PaymentStatus, status: o.status === "Draft" || o.status === "Pending" || o.status === "Unpaid" as any ? "Paid" as OrderStatus : o.status,
                updatedAt: Date.now(),
                timeline: [...o.timeline, { at: Date.now(), label: "Marked paid", status: "Paid" as OrderStatus, kind: "system" as const, description: "Bulk action" }] }
            : o);
          return { orders, ...saveTenant({ ...s, orders }) };
        });
      },
      bulkShipOrders: (ids) => get().bulkOrderStatus(ids, "Shipped"),
      bulkCancelOrders: (ids, opts) => {
        for (const id of ids) get().cancelOrder(id, { restock: opts?.restock ?? true });
      },
      setOrders: (orders) => set((s) => ({ orders, ...saveTenant({ ...s, orders }) })),


      /* -------------------- Customers -------------------- */
      addCustomer: (c) => {
        const item: Customer = {
          id: uid("cust"),
          name: c.name ?? "New customer",
          email: c.email ?? "",
          phone: c.phone,
          addresses: c.addresses ?? [],
          ordersCount: c.ordersCount ?? 0,
          totalSpent: c.totalSpent ?? 0,
          notes: c.notes,
          createdAt: Date.now(),
        };
        set((s) => ({ customers: [item, ...s.customers], ...saveTenant({ ...s, customers: [item, ...s.customers] }) }));
        return item;
      },
      updateCustomer: (id, patch) => set((s) => {
        const customers = s.customers.map((x) => x.id === id ? { ...x, ...patch } : x);
        return { customers, ...saveTenant({ ...s, customers }) };
      }),
      removeCustomer: (id) => set((s) => {
        const customers = s.customers.filter((x) => x.id !== id);
        return { customers, ...saveTenant({ ...s, customers }) };
      }),

      /* -------------------- Media -------------------- */
      addMedia: (m) => {
        const item: MediaAsset = {
          id: uid("m"),
          name: m.name ?? "Asset",
          url: m.url ?? "",
          kind: m.kind ?? "image",
          mimeType: m.mimeType,
          size: m.size ?? 0,
          width: m.width,
          height: m.height,
          alt: m.alt ?? "",
          caption: m.caption ?? "",
          description: m.description ?? "",
          tags: m.tags ?? [],
          folderId: m.folderId ?? null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ media: [item, ...s.media], ...saveTenant({ ...s, media: [item, ...s.media] }) }));
        return item;
      },
      updateMedia: (id, patch) => set((s) => {
        const media = s.media.map((x) => x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x);
        return { media, ...saveTenant({ ...s, media }) };
      }),
      removeMedia: (id) => set((s) => {
        const media = s.media.filter((x) => x.id !== id);
        return { media, ...saveTenant({ ...s, media }) };
      }),
      removeManyMedia: (ids) => set((s) => {
        const set2 = new Set(ids);
        const media = s.media.filter((x) => !set2.has(x.id));
        return { media, ...saveTenant({ ...s, media }) };
      }),
      duplicateMedia: (id) => {
        const src = get().media.find((x) => x.id === id);
        if (!src) return null;
        return get().addMedia({ ...src, id: undefined as any, name: src.name.replace(/(\.[^.]+)?$/, " (copy)$1") });
      },
      moveMediaToFolder: (ids, folderId) => set((s) => {
        const set2 = new Set(ids);
        const media = s.media.map((x) => set2.has(x.id) ? { ...x, folderId, updatedAt: Date.now() } : x);
        return { media, ...saveTenant({ ...s, media }) };
      }),
      registerUpload: (a) => {
        const existing = get().media.find((m) => m.url === a.url);
        if (existing) return existing;
        return get().addMedia(a);
      },
      addFolder: (name, parentId = null) => {
        const item: MediaFolder = { id: uid("fld"), name: name.trim() || "Folder", parentId: parentId ?? null, createdAt: Date.now() };
        set((s) => ({ mediaFolders: [item, ...s.mediaFolders], ...saveTenant({ ...s, mediaFolders: [item, ...s.mediaFolders] }) }));
        return item;
      },
      renameFolder: (id, name) => set((s) => {
        const mediaFolders = s.mediaFolders.map((f) => f.id === id ? { ...f, name } : f);
        return { mediaFolders, ...saveTenant({ ...s, mediaFolders }) };
      }),
      removeFolder: (id, opts) => set((s) => {
        const mediaFolders = s.mediaFolders.filter((f) => f.id !== id);
        const media = opts?.cascade
          ? s.media.filter((m) => m.folderId !== id)
          : s.media.map((m) => m.folderId === id ? { ...m, folderId: null } : m);
        return { mediaFolders, media, ...saveTenant({ ...s, mediaFolders, media }) };
      }),

      // ---------- Warehouses ----------
      addWarehouse: (w) => {
        const wh: Warehouse = {
          id: `wh_${Date.now().toString(36)}`,
          name: w.name ?? "Warehouse",
          code: w.code ?? (w.name ?? "WH").slice(0, 6).toUpperCase(),
          location: w.location, manager: w.manager, capacity: w.capacity,
          status: w.status ?? "Active",
          isDefault: false,
          createdAt: Date.now(),
        };
        set((s) => {
          const warehouses = [...s.warehouses, wh];
          return { warehouses, ...saveTenant({ ...s, warehouses }) };
        });
        return wh;
      },
      updateWarehouse: (id, patch) => set((s) => {
        const warehouses = s.warehouses.map((w) => w.id === id ? { ...w, ...patch, updatedAt: Date.now() } : w);
        return { warehouses, ...saveTenant({ ...s, warehouses }) };
      }),
      removeWarehouse: (id) => set((s) => {
        if (s.warehouses.length <= 1) return {};
        const target = s.warehouses.find((w) => w.id === id);
        if (target?.isDefault) return {};
        const warehouses = s.warehouses.filter((w) => w.id !== id);
        return { warehouses, ...saveTenant({ ...s, warehouses }) };
      }),
      setDefaultWarehouse: (id) => set((s) => {
        const warehouses = s.warehouses.map((w) => ({ ...w, isDefault: w.id === id }));
        return { warehouses, ...saveTenant({ ...s, warehouses }) };
      }),

      // ---------- Stock adjustments ----------
      adjustStock: ({ productId, delta, reason, warehouseId, note, user, orderId, poId, transferId }) => set((s) => {
        const idx = s.products.findIndex((p) => p.id === productId);
        if (idx < 0) return {};
        const p = s.products[idx];
        const before = p.stock;
        const after = Math.max(0, before + delta);
        const nextP: Product = { ...p, stock: after, updatedAt: Date.now() };
        if (warehouseId) {
          const map = { ...(p.stockByWarehouse ?? {}) };
          map[warehouseId] = Math.max(0, (map[warehouseId] ?? 0) + delta);
          nextP.stockByWarehouse = map;
        }
        const products = [...s.products]; products[idx] = nextP;
        const wh = warehouseId ?? s.warehouses.find((w) => w.isDefault)?.id;
        const mv: StockMovement = {
          id: `mv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          at: Date.now(), productId, productName: p.name,
          warehouseId: wh, reason, delta: after - before, before, after,
          user, orderId, poId, transferId, note,
        };
        const movements = [mv, ...s.movements].slice(0, 2000);
        return { products, movements, ...saveTenant({ ...s, products, movements }) };
      }),
      bulkAdjustStock: (ids, mode, value, reason = "manual-adjustment", note) => {
        const { adjustStock, products } = get();
        ids.forEach((id) => {
          const p = products.find((x) => x.id === id);
          if (!p) return;
          const delta = mode === "set" ? value - p.stock : mode === "add" ? value : -value;
          if (delta !== 0) adjustStock({ productId: id, delta, reason, note });
        });
      },
      bulkAssignWarehouse: (ids, warehouseId) => set((s) => {
        const products = s.products.map((p) => ids.includes(p.id)
          ? { ...p, stockByWarehouse: { ...(p.stockByWarehouse ?? {}), [warehouseId]: p.stock } }
          : p);
        return { products, ...saveTenant({ ...s, products }) };
      }),
      markDamaged: (productId, qty, note) => set((s) => {
        const idx = s.products.findIndex((p) => p.id === productId);
        if (idx < 0) return {};
        const p = s.products[idx];
        const damaged = (p.damaged ?? 0) + qty;
        const after = Math.max(0, p.stock - qty);
        const products = [...s.products];
        products[idx] = { ...p, stock: after, damaged, updatedAt: Date.now() };
        const mv: StockMovement = {
          id: `mv_${Date.now().toString(36)}`, at: Date.now(), productId, productName: p.name,
          reason: "damaged", delta: -qty, before: p.stock, after, note,
        };
        const movements = [mv, ...s.movements].slice(0, 2000);
        return { products, movements, ...saveTenant({ ...s, products, movements }) };
      }),
      markReturned: (productId, qty, note) => set((s) => {
        const idx = s.products.findIndex((p) => p.id === productId);
        if (idx < 0) return {};
        const p = s.products[idx];
        const returned = (p.returned ?? 0) + qty;
        const after = p.stock + qty;
        const products = [...s.products];
        products[idx] = { ...p, stock: after, returned, updatedAt: Date.now() };
        const mv: StockMovement = {
          id: `mv_${Date.now().toString(36)}`, at: Date.now(), productId, productName: p.name,
          reason: "returned", delta: qty, before: p.stock, after, note,
        };
        const movements = [mv, ...s.movements].slice(0, 2000);
        return { products, movements, ...saveTenant({ ...s, products, movements }) };
      }),
      reserveStock: (productId, qty, orderId) => set((s) => {
        const idx = s.products.findIndex((p) => p.id === productId);
        if (idx < 0) return {};
        const p = s.products[idx];
        const reserved = (p.reserved ?? 0) + qty;
        const products = [...s.products];
        products[idx] = { ...p, reserved, updatedAt: Date.now() };
        const mv: StockMovement = {
          id: `mv_${Date.now().toString(36)}`, at: Date.now(), productId, productName: p.name,
          reason: "stock-reserved", delta: 0, before: p.stock, after: p.stock, orderId, note: `Reserved ${qty}`,
        };
        const movements = [mv, ...s.movements].slice(0, 2000);
        return { products, movements, ...saveTenant({ ...s, products, movements }) };
      }),
      releaseStock: (productId, qty, orderId) => set((s) => {
        const idx = s.products.findIndex((p) => p.id === productId);
        if (idx < 0) return {};
        const p = s.products[idx];
        const reserved = Math.max(0, (p.reserved ?? 0) - qty);
        const products = [...s.products];
        products[idx] = { ...p, reserved, updatedAt: Date.now() };
        const mv: StockMovement = {
          id: `mv_${Date.now().toString(36)}`, at: Date.now(), productId, productName: p.name,
          reason: "stock-released", delta: 0, before: p.stock, after: p.stock, orderId, note: `Released ${qty}`,
        };
        const movements = [mv, ...s.movements].slice(0, 2000);
        return { products, movements, ...saveTenant({ ...s, products, movements }) };
      }),

      // ---------- Purchase orders ----------
      addPurchaseOrder: (input) => {
        const po: PurchaseOrder = {
          id: `po_${Date.now().toString(36)}`,
          number: `PO-${get().poCounter + 1}`,
          supplier: input.supplier ?? "Supplier",
          supplierEmail: input.supplierEmail,
          warehouseId: input.warehouseId ?? get().warehouses.find((w) => w.isDefault)?.id ?? get().warehouses[0]?.id ?? "wh_main",
          lines: (input.lines ?? []).map((l) => ({ received: 0, ...l })),
          status: input.status ?? "Draft",
          expectedDate: input.expectedDate,
          notes: input.notes,
          createdAt: Date.now(),
        };
        set((s) => {
          const purchaseOrders = [po, ...s.purchaseOrders];
          const poCounter = s.poCounter + 1;
          return { purchaseOrders, poCounter, ...saveTenant({ ...s, purchaseOrders, poCounter }) };
        });
        return po;
      },
      updatePurchaseOrder: (id, patch) => set((s) => {
        const purchaseOrders = s.purchaseOrders.map((p) => p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p);
        return { purchaseOrders, ...saveTenant({ ...s, purchaseOrders }) };
      }),
      removePurchaseOrder: (id) => set((s) => {
        const purchaseOrders = s.purchaseOrders.filter((p) => p.id !== id);
        return { purchaseOrders, ...saveTenant({ ...s, purchaseOrders }) };
      }),
      receivePurchaseOrder: (id, opts) => {
        const { purchaseOrders, adjustStock } = get();
        const po = purchaseOrders.find((p) => p.id === id);
        if (!po || po.status === "Received" || po.status === "Cancelled") return;
        const receiveLines = opts?.partial ?? po.lines.map((l) => ({ ...l, qty: l.qty - (l.received ?? 0) }));
        receiveLines.forEach((rl) => {
          if (rl.qty > 0) adjustStock({
            productId: rl.productId, delta: rl.qty, reason: "purchase-received",
            warehouseId: po.warehouseId, poId: po.id, note: `PO ${po.number}`,
          });
        });
        set((s) => {
          const purchaseOrders = s.purchaseOrders.map((p) => {
            if (p.id !== id) return p;
            const lines = p.lines.map((l) => {
              const r = receiveLines.find((x) => x.productId === l.productId);
              return r ? { ...l, received: (l.received ?? 0) + r.qty } : l;
            });
            const allReceived = lines.every((l) => (l.received ?? 0) >= l.qty);
            return { ...p, lines, status: allReceived ? "Received" as const : "Partially received" as const, receivedDate: allReceived ? Date.now() : p.receivedDate, updatedAt: Date.now() };
          });
          return { purchaseOrders, ...saveTenant({ ...s, purchaseOrders }) };
        });
      },
      cancelPurchaseOrder: (id) => set((s) => {
        const purchaseOrders = s.purchaseOrders.map((p) => p.id === id ? { ...p, status: "Cancelled" as const, updatedAt: Date.now() } : p);
        return { purchaseOrders, ...saveTenant({ ...s, purchaseOrders }) };
      }),

      // ---------- Stock transfers ----------
      addStockTransfer: (input) => {
        const whs = get().warehouses;
        const t: StockTransfer = {
          id: `tr_${Date.now().toString(36)}`,
          number: `TR-${get().transferCounter + 1}`,
          fromWarehouseId: input.fromWarehouseId ?? whs[0]?.id ?? "wh_main",
          toWarehouseId: input.toWarehouseId ?? whs[1]?.id ?? whs[0]?.id ?? "wh_main",
          lines: input.lines ?? [],
          status: input.status ?? "Draft",
          transferredBy: input.transferredBy,
          transferDate: input.transferDate,
          notes: input.notes,
          createdAt: Date.now(),
        };
        set((s) => {
          const transfers = [t, ...s.transfers];
          const transferCounter = s.transferCounter + 1;
          return { transfers, transferCounter, ...saveTenant({ ...s, transfers, transferCounter }) };
        });
        return t;
      },
      updateStockTransfer: (id, patch) => set((s) => {
        const transfers = s.transfers.map((t) => t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t);
        return { transfers, ...saveTenant({ ...s, transfers }) };
      }),
      removeStockTransfer: (id) => set((s) => {
        const transfers = s.transfers.filter((t) => t.id !== id);
        return { transfers, ...saveTenant({ ...s, transfers }) };
      }),
      receiveStockTransfer: (id) => {
        const { transfers, adjustStock } = get();
        const t = transfers.find((x) => x.id === id);
        if (!t || t.status === "Received" || t.status === "Cancelled") return;
        t.lines.forEach((l) => {
          adjustStock({ productId: l.productId, delta: -l.qty, warehouseId: t.fromWarehouseId, reason: "warehouse-transfer", transferId: t.id, note: `Transfer ${t.number} out` });
          adjustStock({ productId: l.productId, delta: l.qty, warehouseId: t.toWarehouseId, reason: "warehouse-transfer", transferId: t.id, note: `Transfer ${t.number} in` });
        });
        set((s) => {
          const transfers = s.transfers.map((x) => x.id === id ? { ...x, status: "Received" as const, receivedDate: Date.now(), updatedAt: Date.now() } : x);
          return { transfers, ...saveTenant({ ...s, transfers }) };
        });
      },
      cancelStockTransfer: (id) => set((s) => {
        const transfers = s.transfers.map((t) => t.id === id ? { ...t, status: "Cancelled" as const, updatedAt: Date.now() } : t);
        return { transfers, ...saveTenant({ ...s, transfers }) };
      }),

      bumpVisitors: () => set((s) => ({ visitors: s.visitors + 1, ...saveTenant({ ...s, visitors: s.visitors + 1 }) })),
      resetAll: () => set((s) => ({ ...emptyTenant(), tenants: { ...s.tenants, [s.activeTenantId]: emptyTenant() } })),

    }),
    {
      name: "aether.data.v2",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : (undefined as any))),
      version: 7,
      migrate: (persisted: any, _from: number) => {
        if (!persisted) return persisted;
        // v1 → v2: wrap into tenants["default"]; ensure new arrays exist.
        if (!persisted.tenants) {
          const t: any = {
            products: persisted.products ?? [],
            orders: persisted.orders ?? [],
            customers: persisted.customers ?? [],
            media: persisted.media ?? [], mediaFolders: [],
            categories: [], collections: [], coupons: [],
            cart: [], appliedCoupon: null,
            visitors: persisted.visitors ?? 0, orderCounter: 1000, invoiceCounter: 2000,
          };
          t.products = t.products.map((p: any) => ({
            handle: slugify(p.name ?? "product"),
            images: p.imageUrl ? [p.imageUrl] : [],
            collectionIds: [], tags: [], trackInventory: true, taxable: true, requiresShipping: true,
            ...p,
          }));
          persisted = { activeTenantId: "default", tenants: { default: t }, ...t };
        }
        const ensure3 = (t: any) => ({ mediaFolders: [], ...t });
        const ensure4 = (t: any) => ({
          savedForLater: [], wishlist: [], recentlyViewed: [],
          addCounts: {}, wishlistCounts: {}, cartUpdatedAt: null,
          shippingRates: DEFAULT_SHIPPING_RATES, taxRate: 0.08, freeShippingThreshold: 75,
          ...t,
        });
        // v4 → v5: add invoiceCounter to every tenant snapshot.
        const ensure5 = (t: any) => ({ invoiceCounter: 2000, ...t });
        // v5 → v6: normalize orders → paymentStatus / shippingStatus / richer timeline.
        const ensure6 = (t: any) => {
          if (!t.orders) return t;
          const orders = t.orders.map((o: any) => {
            const legacy = o.status;
            const paymentStatus = o.paymentStatus ??
              (legacy === "Refunded" ? "Refunded" :
               legacy === "Cancelled" ? "Unpaid" :
               legacy === "Failed" ? "Failed" : "Paid");
            const shippingStatus = o.shippingStatus ??
              (o.fulfillment === "Fulfilled" ? "Delivered" :
               legacy === "Shipped" ? "Shipped" :
               legacy === "Cancelled" || legacy === "Draft" ? "Not shipped" : "Processing");
            const status = (legacy === "Fulfilled" ? "Delivered"
              : legacy === "Unfulfilled" ? "Processing"
              : legacy) ?? "Confirmed";
            return { ...o, status, paymentStatus, shippingStatus };
          });
          return { ...t, orders };
        };
        // v6 → v7: add warehouses & inventory scaffolding to every tenant.
        const ensure7 = (t: any) => ({
          warehouses: t.warehouses?.length ? t.warehouses : [defaultWarehouse()],
          movements: t.movements ?? [],
          purchaseOrders: t.purchaseOrders ?? [],
          transfers: t.transfers ?? [],
          poCounter: t.poCounter ?? 1000,
          transferCounter: t.transferCounter ?? 2000,
          ...t,
        });
        const ensureAll = (t: any) => ensure7(ensure6(ensure5(ensure4(ensure3(t)))));



        persisted = ensureAll(persisted);
        if (persisted.tenants) {
          const tenants: Record<string, any> = {};
          for (const [k, v] of Object.entries(persisted.tenants)) tenants[k] = ensureAll(v);
          persisted.tenants = tenants;
        }
        return persisted;
      },
    },
  ),
);

/* ============================================================
 * Selectors
 * ============================================================ */

export function useStoreStats() {
  const s = useStoreData();
  const totalRevenue = s.orders.reduce((sum, o) =>
    sum + (o.status !== "Refunded" && o.status !== "Cancelled" ? o.total : 0), 0);
  const publishedProducts = s.products.filter((p) => p.status === "Published").length;
  const draftProducts = s.products.filter((p) => p.status === "Draft").length;
  const unfulfilled = s.orders.filter((o) => o.fulfillment === "Unfulfilled").length;
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const todayOrders = s.orders.filter((o) => o.createdAt >= startOfDay.getTime()).length;
  const pendingOrders = s.orders.filter((o) =>
    ["Draft", "Pending", "Confirmed", "Paid", "Processing", "Packed"].includes(o.status)).length;
  const shippedOrders = s.orders.filter((o) =>
    ["Shipped", "Out for delivery"].includes(o.status)).length;
  const completedOrders = s.orders.filter((o) => o.status === "Delivered" || o.status === "Fulfilled").length;
  const cancelledOrders = s.orders.filter((o) => o.status === "Cancelled").length;
  const refundedOrders = s.orders.filter((o) => o.status === "Refunded").length;
  const paidRevenueOrders = s.orders.filter((o) => o.status !== "Refunded" && o.status !== "Cancelled");
  const avgOrderValue = paidRevenueOrders.length ? totalRevenue / paidRevenueOrders.length : 0;
  const recentOrders = [...s.orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);

  const conversion = s.visitors > 0 ? (s.orders.length / s.visitors) * 100 : 0;
  const storageUsedKB = s.media.reduce((sum, m) => sum + m.size, 0) / 1024;
  const lowStock = s.products.filter((p) => {
    if (p.trackInventory === false) return false;
    const th = p.lowStockThreshold ?? 5;
    return p.stock > 0 && p.stock <= th;
  }).length;
  const outOfStock = s.products.filter((p) => p.trackInventory !== false && p.stock === 0).length;
  const totalInventoryUnits = s.products.reduce((n, p) => n + (p.stock ?? 0), 0);
  const reservedInventoryUnits = s.products.reduce((n, p) => n + (p.reserved ?? 0), 0);
  const availableInventoryUnits = Math.max(0, totalInventoryUnits - reservedInventoryUnits);
  const incomingInventoryUnits = s.products.reduce((n, p) => n + (p.incoming ?? 0), 0);
  const inventoryValue = s.products.reduce((n, p) => n + (p.costPerItem ?? 0) * (p.stock ?? 0), 0);
  const retailInventoryValue = s.products.reduce((n, p) => n + (p.price ?? 0) * (p.stock ?? 0), 0);

  // Abandoned = has items and last updated > 60 minutes ago
  const abandonedCarts = s.cartUpdatedAt && s.cart.length > 0 && Date.now() - s.cartUpdatedAt > 60 * 60 * 1000 ? 1 : 0;
  const activeCarts = s.cart.length > 0 && !abandonedCarts ? 1 : 0;
  type Ranked = { productId: string; name: string; count: number; image?: string };
  const mostAdded: Ranked[] = Object.entries(s.addCounts)
    .map(([id, n]): Ranked | null => {
      const p = s.products.find((pp) => pp.id === id);
      return p ? { productId: id, name: p.name, count: n, image: p.images?.[0] } : null;
    })
    .filter((x): x is Ranked => x !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const topWishlisted: Ranked[] = Object.entries(s.wishlistCounts)
    .map(([id, n]): Ranked | null => {
      const p = s.products.find((pp) => pp.id === id);
      return p ? { productId: id, name: p.name, count: n, image: p.images?.[0] } : null;
    })
    .filter((x): x is Ranked => x !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return {
    totalProducts: s.products.length,
    publishedProducts,
    draftProducts,
    totalOrders: s.orders.length,
    unfulfilled,
    pendingOrders,
    shippedOrders,
    completedOrders,
    cancelledOrders,
    refundedOrders,
    todayOrders,
    avgOrderValue,
    recentOrders,

    totalCustomers: s.customers.length,
    totalRevenue,
    totalVisitors: s.visitors,
    conversionRate: conversion,
    storageUsedKB,
    mediaCount: s.media.length,
    lowStock,
    outOfStock,
    totalInventoryUnits,
    availableInventoryUnits,
    reservedInventoryUnits,
    incomingInventoryUnits,
    inventoryValue,
    retailInventoryValue,
    warehouseCount: s.warehouses.length,
    activeWarehouseCount: s.warehouses.filter((w) => w.status === "Active").length,

    cartCount: s.cart.reduce((n, c) => n + c.qty, 0),
    wishlistCount: s.wishlist.length,
    activeCarts,
    abandonedCarts,
    mostAdded,
    topWishlisted,
    topProducts: rankTopProducts(s.orders).slice(0, 5),
  };
}

function rankTopProducts(orders: Order[]) {
  const map = new Map<string, { productId: string; name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    if (o.status === "Refunded" || o.status === "Cancelled" || !o.items || !Array.isArray(o.items)) continue;
    for (const i of o.items) {
      const cur = map.get(i.productId) ?? { productId: i.productId, name: i.name, qty: 0, revenue: 0 };
      cur.qty += i.qty; cur.revenue += i.price * i.qty;
      map.set(i.productId, cur);
    }
  }
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

export function useCartSelectors() {
  const { cart, products, appliedCoupon, coupons, shippingRates, taxRate, freeShippingThreshold } = useStoreData();
  const lines = cart.map((c) => {
    const p = products.find((pp) => pp.id === c.productId);
    return { ...c, product: p! };
  }).filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const coupon = coupons.find((c) => c.code === appliedCoupon && c.active);
  const discount = coupon ? (coupon.kind === "percent" ? subtotal * (coupon.value / 100) : Math.min(coupon.value, subtotal)) : 0;
  const taxableSubtotal = lines.reduce((s, l) => s + (l.product.taxable !== false ? l.product.price * l.qty : 0), 0);
  const taxedBase = Math.max(0, taxableSubtotal - discount * (subtotal ? taxableSubtotal / subtotal : 0));
  const tax = +(taxedBase * (taxRate ?? 0)).toFixed(2);
  const cheapest = [...(shippingRates ?? [])].sort((a, b) => a.cost - b.cost)[0];
  const requiresShipping = lines.some((l) => l.product.requiresShipping !== false);
  const qualifiesFree =
    (!!coupon?.freeShipping) ||
    (freeShippingThreshold != null && subtotal - discount >= freeShippingThreshold);
  const shipping = !requiresShipping ? 0 : qualifiesFree ? 0 : (cheapest?.cost ?? 0);
  const total = Math.max(0, subtotal - discount) + tax + shipping;
  const count = lines.reduce((n, l) => n + l.qty, 0);
  return { lines, subtotal, discount, tax, shipping, total, count, coupon, shippingRates: shippingRates ?? [], taxRate: taxRate ?? 0, freeShippingThreshold, qualifiesFree, requiresShipping, cheapestShipping: cheapest };
}


export function useWishlistSelectors() {
  const { wishlist, products } = useStoreData();
  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
  return { items, count: items.length };
}

export function useSavedForLaterSelectors() {
  const { savedForLater, products } = useStoreData();
  const items = savedForLater.map((c) => {
    const p = products.find((pp) => pp.id === c.productId);
    return p ? { ...c, product: p } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);
  return { items, count: items.length };
}

export function useRecentlyViewedSelectors(excludeId?: string) {
  const { recentlyViewed, products } = useStoreData();
  const items = recentlyViewed
    .filter((id) => id !== excludeId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p && p.status === "Published");
  return { items, count: items.length };
}

