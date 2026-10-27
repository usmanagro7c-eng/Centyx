/* ============================================================
 * Frappe Data Mappers
 * Transform Frappe ERPNext data to frontend types
 * ============================================================ */

import type {
  Product,
  Category,
  Collection,
  Order,
  OrderItem,
  Customer,
  MediaAsset,
  MediaFolder,
  InventoryItem,
  StockMovement,
  PurchaseOrder,
  GiftCard,
} from "@/lib/store-data-store";
import type {
  FrappeItem,
  FrappeItemGroup,
  FrappeBin,
  FrappeWarehouse,
  FrappePurchaseOrder,
  FrappePurchaseOrderItem,
  FrappeGiftCard,
} from "@/api";

/* ============================================================
 * Products Mapper
 * ============================================================ */

function mapFrappeStatus(status: string, disabled: number): "Published" | "Draft" | "Archived" {
  if (disabled === 1) return "Archived";
  return status === "Draft" ? "Draft" : "Published";
}

export function mapFrappeItemToProduct(item: FrappeItem): Product {
  const images: string[] = [];
  if (item.image) {
    images.push(item.image.startsWith("http") ? item.image : `${import.meta.env.VITE_API_URL || ""}${item.image}`);
  }

  // Calculate stock from Bin if available
  const stock = item.opening_stock ?? 0;

  return {
    id: item.name,
    name: item.item_name,
    handle: item.item_code.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sku: item.custom_sku || item.item_code,
    barcode: item.barcode,
    price: item.standard_rate,
    compareAtPrice: item.custom_compare_at_price,
    costPerItem: item.custom_cost_per_item ?? item.valuation_rate,
    category: item.item_group,
    collectionIds: [],
    brand: item.brand,
    vendor: item.vendor,
    productType: item.item_category,
    stock,
    trackInventory: item.custom_track_inventory !== 0,
    lowStockThreshold: item.custom_low_stock_threshold ?? 5,
    continueSellingWhenOutOfStock: item.custom_continue_selling_when_out_of_stock === 1,
    status: mapFrappeStatus(item.docstatus === 1 ? "Published" : "Draft", item.disabled),
    images,
    imageAlts: images.map(() => ""),
    imageUrl: images[0],
    description: item.description,
    shortDescription: item.description?.substring(0, 200),
    tags: [],
    weight: item.weight_per_unit,
    weightUnit: item.weight_uom,
    dimensions: undefined,
    taxable: item.custom_taxable !== 0,
    requiresShipping: item.custom_requires_shipping !== 0,
    isDigital: item.custom_is_digital === 1,
    options: [],
    variants: [],
    seoTitle: item.item_name,
    seoDescription: item.description?.substring(0, 160),
    featured: item.featured === 1,
    createdAt: new Date(item.creation).getTime(),
    updatedAt: new Date(item.modified).getTime(),
    archivedAt: item.disabled === 1 ? new Date(item.modified).getTime() : undefined,
  };
}

export function mapFrappeItemsToProducts(items: FrappeItem[]): Product[] {
  return items.map(mapFrappeItemToProduct);
}

/* ============================================================
 * Categories Mapper
 * ============================================================ */

export function mapFrappeItemGroupToCategory(group: FrappeItemGroup): Category {
  return {
    id: group.name,
    name: group.item_group_name,
    handle: group.item_group_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: group.description,
    imageUrl: group.image?.startsWith("http") ? group.image : group.image ? `${import.meta.env.VITE_API_URL || ""}${group.image}` : undefined,
    bannerUrl: undefined,
    iconUrl: undefined,
    parentId: group.parent_item_group && group.parent_item_group !== "All Item Groups" ? group.parent_item_group : undefined,
    status: group.disabled === 1 ? "Archived" : group.is_active === 1 ? "Active" : "Draft",
    sortOrder: 0,
    seoTitle: group.item_group_name,
    seoDescription: group.description,
    keywords: undefined,
    createdAt: new Date(group.creation).getTime(),
    updatedAt: new Date(group.modified).getTime(),
    archivedAt: group.disabled === 1 ? new Date(group.modified).getTime() : undefined,
  };
}

export function mapFrappeItemGroupsToCategories(groups: FrappeItemGroup[]): Category[] {
  return groups.map(mapFrappeItemGroupToCategory);
}

/* ============================================================
 * Collections Mapper
 * ============================================================ */

export function mapFrappeItemGroupToCollection(group: FrappeItemGroup): Collection {
  return {
    id: group.name,
    name: group.item_group_name,
    handle: group.item_group_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: group.description,
    imageUrl: group.image?.startsWith("http") ? group.image : group.image ? `${import.meta.env.VITE_API_URL || ""}${group.image}` : undefined,
    bannerUrl: undefined,
    kind: "auto" as const,
    match: "all" as const,
    productIds: [],
    rules: [
      {
        field: "category" as const,
        value: group.name,
      },
    ],
    status: group.disabled === 1 ? "Archived" : group.is_active === 1 ? "Active" : "Draft",
    sortOrder: 0,
    seoTitle: group.item_group_name,
    seoDescription: group.description,
    keywords: undefined,
    createdAt: new Date(group.creation).getTime(),
    updatedAt: new Date(group.modified).getTime(),
    archivedAt: group.disabled === 1 ? new Date(group.modified).getTime() : undefined,
  };
}

export function mapFrappeItemGroupsToCollections(groups: FrappeItemGroup[]): Collection[] {
  return groups.map(mapFrappeItemGroupToCollection);
}

/* ============================================================
 * Inventory Mapper
 * ============================================================ */

export interface MappedInventoryItem {
  __id: string;
  sku: string;
  product: string;
  stock: number;
  reserved: number;
  available: number;
  warehouse: string;
  warehouseName: string;
  status: "In stock" | "Low stock" | "Out of stock" | "Untracked";
  itemCode: string;
  itemName: string;
}

export function mapFrappeBinToInventoryItem(bin: FrappeBin, warehouse?: FrappeWarehouse, lowStockThreshold = 5): MappedInventoryItem {
  const actualQty = bin.actual_qty;
  const reservedQty = bin.reserved_qty || 0;
  const availableQty = actualQty - reservedQty;

  let status: MappedInventoryItem["status"] = "In stock";
  if (actualQty <= 0) {
    status = "Out of stock";
  } else if (actualQty <= lowStockThreshold) {
    status = "Low stock";
  }

  return {
    __id: bin.name,
    sku: bin.item_code,
    product: bin.item_code, // Will be enriched with item name
    stock: actualQty,
    reserved: reservedQty,
    available: availableQty,
    warehouse: bin.warehouse,
    warehouseName: warehouse?.warehouse_name || bin.warehouse,
    status,
    itemCode: bin.item_code,
    itemName: bin.item_code, // Will be enriched
  };
}

export function mapFrappeBinsToInventoryItems(
  bins: FrappeBin[],
  warehouses: FrappeWarehouse[],
  lowStockThreshold = 5
): MappedInventoryItem[] {
  const warehouseMap = new Map(warehouses.map((w) => [w.name, w]));

  return bins.map((bin) => {
    const warehouse = warehouseMap.get(bin.warehouse);
    return mapFrappeBinToInventoryItem(bin, warehouse, lowStockThreshold);
  });
}

/* ============================================================
 * Purchase Orders Mapper
 * ============================================================ */

export function mapFrappePurchaseOrderToOrder(po: FrappePurchaseOrder): Order {
  const items: OrderItem[] = (po.items || []).map((item) => ({
    productId: item.item_code,
    name: item.item_name,
    price: item.rate,
    qty: item.qty,
    image: undefined,
    sku: item.item_code,
    variant: undefined,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = po.grand_total;

  return {
    id: po.name,
    number: `PO-${po.name}`,
    invoiceNumber: `PO-${po.name}`,
    transactionId: undefined,
    customerId: po.supplier,
    customerName: po.supplier_name,
    customerEmail: po.contact_email || "",
    customerPhone: undefined,
    items,
    itemsCount: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal,
    discount: 0,
    shippingCost: 0,
    tax: po.total_taxes_and_charges,
    total,
    couponCode: undefined,
    shipping: undefined,
    billing: undefined,
    billingSameAsShipping: true,
    paymentMethod: "Purchase Order",
    shippingMethod: undefined,
    estimatedDelivery: po.schedule_date ? {
      earliest: new Date(po.schedule_date).getTime(),
      latest: new Date(po.schedule_date).getTime(),
    } : undefined,
    notes: po.custom_notes || po.terms,
    trackingNumber: undefined,
    carrier: undefined,
    status: mapPurchaseOrderStatus(po.status),
    paymentStatus: po.docstatus === 1 ? "Paid" : "Unpaid",
    shippingStatus: "Not shipped",
    fulfillment: "Unfulfilled",
    timeline: [
      {
        at: new Date(po.creation).getTime(),
        label: "Purchase Order Created",
        status: "Pending",
        description: `PO created for ${po.supplier_name}`,
        kind: "system" as const,
      },
    ],
    createdAt: new Date(po.creation).getTime(),
    updatedAt: new Date(po.modified).getTime(),
  };
}

function mapPurchaseOrderStatus(status: FrappePurchaseOrder["status"]): Order["status"] {
  switch (status) {
    case "Draft":
      return "Draft";
    case "On Hold":
    case "To Receive":
      return "Confirmed";
    case "Completed":
      return "Delivered";
    case "Cancelled":
      return "Cancelled";
    case "Closed":
      return "Delivered";
    default:
      return "Pending";
  }
}

export function mapFrappePurchaseOrdersToOrders(pos: FrappePurchaseOrder[]): Order[] {
  return pos.map(mapFrappePurchaseOrderToOrder);
}

/* ============================================================
 * Gift Cards Mapper
 * ============================================================ */

export function mapFrappeGiftCardToGiftCard(gc: FrappeGiftCard): GiftCard {
  return {
    id: gc.name,
    code: gc.gift_card_number,
    balance: gc.balance,
    initialBalance: gc.initial_balance,
    status: gc.status.toLowerCase() as GiftCard["status"],
    customerId: gc.customer,
    customerName: gc.customer_name,
    expiryDate: gc.expiry_date ? new Date(gc.expiry_date).getTime() : undefined,
    createdAt: new Date(gc.creation).getTime(),
    updatedAt: new Date(gc.modified).getTime(),
  };
}

export function mapFrappeGiftCardsToGiftCards(gcs: FrappeGiftCard[]): GiftCard[] {
  return gcs.map(mapFrappeGiftCardToGiftCard);
}

/* ============================================================
 * Media Mapper
 * ============================================================ */

export function mapFrappeFileToMediaAsset(file: any): MediaAsset {
  return {
    id: file.name,
    name: file.file_name,
    url: file.file_url.startsWith("http") ? file.file_url : `${import.meta.env.VITE_API_URL || ""}${file.file_url}`,
    kind: file.is_image ? "image" : file.file_type?.includes("video") ? "video" : "doc",
    mimeType: file.content_type,
    size: file.file_size,
    width: file.width,
    height: file.height,
    alt: file.alt,
    caption: file.caption,
    description: undefined,
    tags: file.tags?.split(",").map((t: string) => t.trim()) || [],
    folderId: file.folder,
    createdAt: new Date(file.creation).getTime(),
    updatedAt: new Date(file.modified).getTime(),
  };
}

/* ============================================================
 * Warehouse Mapper
 * ============================================================ */

export function mapFrappeWarehouse(warehouse: FrappeWarehouse): { id: string; name: string; code: string } {
  return {
    id: warehouse.name,
    name: warehouse.warehouse_name,
    code: warehouse.name,
  };
}

/* ============================================================
 * Helper Functions
 * ============================================================ */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStockStatus(actualQty: number, reservedQty: number, lowStockThreshold = 5): "In stock" | "Low stock" | "Out of stock" | "Untracked" {
  const available = actualQty - reservedQty;
  if (available <= 0) return "Out of stock";
  if (available <= lowStockThreshold) return "Low stock";
  return "In stock";
}