import type { Product, OrderItem, ProductVariant, ProductOption } from "@/lib/store-data-store";
import type { FrappeItem } from "@/api/products";

/**
 * Map Frappe Item to frontend Product type
 */
export function mapFrappeItemToProduct(frappeItem: FrappeItem): Product {
  const images = frappeItem.image ? [frappeItem.image] : [];

  // Parse custom fields
const sku = frappeItem.item_code;
const costPerItem = frappeItem.valuation_rate || 0;
const compareAtPrice = undefined;

const requiresShipping = true;
const isDigital = false;
const continueSellingWhenOutOfStock = false;
const lowStockThreshold = 5;
const trackInventory = frappeItem.is_stock_item === 1;
const taxable = true;

  // Parse variants if available
  let variants: ProductVariant[] = [];
  if (frappeItem.attributes && frappeItem.attributes.length > 0) {
    variants = frappeItem.attributes.map((attr, index) => ({
      id: `var_${index}`,
      options: { [attr.attribute]: attr.attribute_value },
      sku: "",
      stock: 0,
    }));
  }

  return {
    id: frappeItem.name,
    name: frappeItem.item_name,
    handle: frappeItem.item_code.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sku: sku,
    barcode: undefined,
    price: frappeItem.standard_rate || 0,
    compareAtPrice: compareAtPrice,
    costPerItem: costPerItem,
    category: frappeItem.item_group,
    collectionIds: [],
    brand: frappeItem.brand,
    vendor: undefined,
    productType: frappeItem.item_category || frappeItem.variant_based_on || undefined,
    stock: frappeItem.opening_stock || 0,
    trackInventory: trackInventory || frappeItem.is_stock_item === 1,
    lowStockThreshold: lowStockThreshold,
    continueSellingWhenOutOfStock: continueSellingWhenOutOfStock,
    status: frappeItem.disabled === 1 ? "Archived" : "Published",
    images,
    imageUrl: frappeItem.image,
    description: frappeItem.description || "",
    shortDescription: "",
    tags: [],
    weight: frappeItem.weight_per_unit,
    dimensions: frappeItem.weight_per_unit && frappeItem.weight_uom ? {
      l: 0, w: 0, h: 0
    } : undefined,
    taxable,
    requiresShipping: requiresShipping,
    isDigital: isDigital || false,
    options: [],
    variants: variants,
    imageAlts: [],
    seoTitle: frappeItem.item_name,
    seoDescription: frappeItem.description || "",
    featured: false,
    createdAt: new Date(frappeItem.creation).getTime(),
    updatedAt: new Date(frappeItem.modified).getTime(),
  };
}

/**
 * Map Frappe Item Group to frontend Collection
 */
export interface FrappeItemGroup {
  name: string;
  item_group_name: string;
  is_group: number;
  parent_item_group: string;
}

export function mapFrappeItemGroupToCollection(frappeGroup: FrappeItemGroup) {
  return {
    id: frappeGroup.name,
    name: frappeGroup.item_group_name,
    handle: frappeGroup.item_group_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: "",
    imageUrl: undefined,
    bannerUrl: undefined,
    kind: "manual" as const,
    match: "all" as const,
    productIds: [],
    rules: [],
    status: "Active" as const,
    sortOrder: 0,
    seoTitle: frappeGroup.item_group_name,
    seoDescription: "",
    keywords: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Map Frappe Bin to inventory data
 */
export interface FrappeBin {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
}

export function mapFrappeBinToInventory(bin: FrappeBin) {
  return {
    itemCode: bin.item_code,
    warehouse: bin.warehouse,
    onHand: bin.actual_qty,
    reserved: bin.reserved_qty,
    available: bin.actual_qty - bin.reserved_qty,
    incoming: 0,
  };
}

/**
 * Map Frappe Purchase Order to frontend Order-like type
 */
export interface FrappePurchaseOrder {
  name: string;
  supplier: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date: string;
  status: string;
  grand_total: number;
  items: Array<{
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
    uom: string;
  }>;
  creation: string;
  modified: string;
}

export function mapFrappePurchaseOrder(po: FrappePurchaseOrder) {
  return {
    id: po.name,
    number: po.name,
    supplier: po.supplier_name || po.supplier,
    date: po.transaction_date,
    expectedDate: po.schedule_date,
    status: mapPurchaseOrderStatus(po.status),
    total: po.grand_total,
    items: po.items.map(item => ({
      productId: item.item_code,
      name: item.item_name,
      price: item.rate,
      qty: item.qty,
      total: item.amount,
      uom: item.uom,
    })),
    createdAt: new Date(po.creation).getTime(),
    updatedAt: new Date(po.modified).getTime(),
  };
}

function mapPurchaseOrderStatus(frappeStatus: string): string {
  const statusMap: Record<string, string> = {
    "Draft": "Draft",
    "Submitted": "Ordered",
    "To Receive": "Partially received",
    "Completed": "Received",
    "Cancelled": "Cancelled",
    "On Hold": "Draft",
  };
  return statusMap[frappeStatus] || "Draft";
}

/**
 * Map Frappe Gift Card
 */
export interface FrappeGiftCard {
  name: string;
  card_number: string;
  customer: string;
  customer_name: string;
  balance: number;
  initial_amount: number;
  expiry_date: string;
  status: string;
  creation: string;
}

export function mapFrappeGiftCard(gc: FrappeGiftCard) {
  return {
    id: gc.name,
    number: gc.card_number,
    customer: gc.customer_name,
    customerEmail: gc.customer,
    balance: gc.balance,
    initialAmount: gc.initial_amount,
    expiryDate: new Date(gc.expiry_date).getTime(),
    status: mapGiftCardStatus(gc.status),
    createdAt: new Date(gc.creation).getTime(),
  };
}

function mapGiftCardStatus(frappeStatus: string): string {
  const statusMap: Record<string, string> = {
    "Active": "Active",
    "Expired": "Expired",
    "Cancelled": "Cancelled",
    "Redeemed": "Redeemed",
  };
  return statusMap[frappeStatus] || "Active";
}