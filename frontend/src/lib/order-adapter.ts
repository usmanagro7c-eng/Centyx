/* ============================================================
 * Frappe Sales Order → Frontend Order Adapter
 * Transforms Frappe's Sales Order data to match the frontend Order type
 * ============================================================ */

import type { Order, OrderItem, Address, OrderShippingMethod, OrderStatus, PaymentStatus, ShippingStatus, OrderTimelineEvent } from "@/lib/store-data-store";
import { getSalesOrderWorkflowState } from "@/lib/order-workflow";

// Frappe Sales Order response structure (partial)
export interface FrappeSalesOrder {
  name: string;
  customer: string;
  company?: string;
  customer_name?: string;
  status: string;
  workflow_state?: string | null;
  grand_total: number;
  transaction_date: string;
  items?: FrappeSalesOrderItem[];
  // Additional fields that might be available
  base_grand_total?: number;
  rounded_total?: number;
  total_taxes_and_charges?: number;
  shipping_address?: string;
  shipping_address_name?: string;
  billing_address?: string;
  billing_address_name?: string;
  contact_person?: string;
  contact_email?: string;
  contact_mobile?: string;
  delivery_note?: string | null;
  sales_invoice?: string | null;
}

export interface FrappeSalesOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  stock_uom?: string;
  warehouse?: string;
}

export interface FrappeCustomer {
  name: string;
  customer_name: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
}

export interface FrappeAddress {
  name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  phone?: string;
  email_id?: string;
}

/**
 * Map Frappe status to frontend OrderStatus
 */
function mapOrderStatus(frappeStatus: string): OrderStatus {
  const normalized = frappeStatus.trim();
  const statusMap: Record<string, OrderStatus> = {
    "Draft": "Draft",
    "Pending": "Pending",
    "Pending Approval": "Pending",
    "Pending_Approval": "Pending",
    "Approved": "Confirmed",
    "On Hold": "Confirmed",
    "To Deliver": "Processing",
    "To Bill": "Processing",
    "Completed": "Delivered",
    "Shipped": "Shipped",
    "Delivered": "Delivered",
    "Rejected": "Failed",
    "Cancelled": "Cancelled",
    "Closed": "Delivered",
  };
  return statusMap[normalized] ?? statusMap[normalized.toLowerCase()] ?? "Confirmed";
}

/**
 * Map Frappe status to PaymentStatus
 */
function mapPaymentStatus(frappeStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    "Draft": "Unpaid",
    "Pending": "Pending",
    "On Hold": "Pending",
    "To Deliver": "Paid",
    "To Bill": "Paid",
    "Completed": "Paid",
    "Cancelled": "Unpaid",
    "Closed": "Paid",
  };
  return statusMap[frappeStatus] ?? "Pending";
}

/**
 * Map Frappe status to ShippingStatus
 */
function mapShippingStatus(frappeStatus: string): ShippingStatus {
  const statusMap: Record<string, ShippingStatus> = {
    "Draft": "Not shipped",
    "Pending": "Processing",
    "On Hold": "Processing",
    "To Deliver": "Processing",
    "To Bill": "Processing",
    "Completed": "Delivered",
    "Cancelled": "Not shipped",
    "Closed": "Delivered",
  };
  return statusMap[frappeStatus] ?? "Processing";
}

/**
 * Convert Frappe date string to timestamp
 */
function parseDate(dateStr: string): number {
  const time = Date.parse(dateStr);
  return Number.isFinite(time) ? time : Date.now();
}

/**
 * Generate a human-friendly order number from Frappe name
 * e.g., "SAL-ORD-2024-00001" -> "#10001"
 */
function generateOrderNumber(name: string): string {
  const match = name.match(/(\d+)$/);
  if (match) {
    return `#${parseInt(match[1], 10) + 10000}`;
  }
  return `#${name.slice(-5)}`;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(name: string): string {
  return `INV-${name.replace(/[^0-9]/g, "").slice(-6)}`;
}

function getCustomerName(order: FrappeSalesOrder, customer?: FrappeCustomer): string {
  const explicit = order.customer_name?.trim();
  if (explicit) return explicit;
  const mapped = customer?.customer_name?.trim();
  if (mapped) return mapped;
  const raw = order.customer?.trim();
  if (raw) return raw;
  return "Unknown Customer";
}

/**
 * Transform Frappe items to frontend OrderItem[]
 */
function transformItems(frappeItems: FrappeSalesOrderItem[] = []): OrderItem[] {
  return frappeItems.map((item, index) => ({
    productId: item.item_code,
    name: item.item_name,
    price: item.rate,
    qty: item.qty,
    sku: item.item_code,
    image: undefined,
    variant: undefined,
  }));
}

/**
 * Transform Frappe address to frontend Address
 */
function transformAddress(addr?: FrappeAddress | string): Address | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return { line1: addr };
  return {
    name: addr.name,
    line1: addr.address_line1,
    line2: addr.address_line2,
    city: addr.city,
    state: addr.state,
    zip: addr.pincode,
    country: addr.country,
    phone: addr.phone,
    email: addr.email_id,
  };
}

/**
 * Build a basic timeline from order creation
 */
function buildTimeline(order: FrappeSalesOrder): OrderTimelineEvent[] {
  const createdAt = parseDate(order.transaction_date);
  const status = mapOrderStatus(order.status);

  return [
    {
      at: createdAt,
      label: "Order placed",
      status: "Pending",
      description: `Order ${order.name} created`,
      kind: "system",
    },
    {
      at: createdAt + 1000,
      label: "Order confirmed",
      status: "Confirmed",
      description: `Status: ${order.status}`,
      kind: "system",
    },
    {
      at: createdAt + 2000,
      label: status === "Paid" ? "Payment received" : "Processing",
      status,
      description: `Current status: ${order.status}`,
      kind: "system",
    },
  ];
}

/**
 * Main adapter: Convert Frappe Sales Order to Frontend Order
 */
export function adaptFrappeOrder(
  frappeOrder: FrappeSalesOrder,
  customer?: FrappeCustomer,
  shippingAddr?: FrappeAddress,
  billingAddr?: FrappeAddress
): Order {
  const items = transformItems(frappeOrder.items);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = frappeOrder.grand_total ?? frappeOrder.base_grand_total ?? frappeOrder.rounded_total ?? subtotal;
  const tax = frappeOrder.total_taxes_and_charges ?? 0;
  const shippingCost = Math.max(0, total - subtotal - tax);
  const workflowState = getSalesOrderWorkflowState(frappeOrder);
  const frappeStatus = frappeOrder.status ?? workflowState;
  const createdAt = parseDate(frappeOrder.transaction_date ?? frappeOrder.creation ?? new Date().toISOString());

  return {
    id: frappeOrder.name,
    number: generateOrderNumber(frappeOrder.name),
    invoiceNumber: generateInvoiceNumber(frappeOrder.name),
    transactionId: undefined,
    customerId: frappeOrder.customer,
    company: frappeOrder.company,
    customerName: getCustomerName(frappeOrder, customer),
    customerEmail: customer?.email_id ?? frappeOrder.contact_email ?? "customer@example.com",
    customerPhone: customer?.mobile_no ?? customer?.phone ?? frappeOrder.contact_mobile,
    items,
    itemsCount: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal,
    discount: 0,
    shippingCost,
    tax,
    total,
    couponCode: undefined,
    shipping: transformAddress(shippingAddr ?? frappeOrder.shipping_address),
    billing: transformAddress(billingAddr ?? frappeOrder.billing_address),
    billingSameAsShipping: true,
    paymentMethod: "Card",
    shippingMethod: undefined,
    estimatedDelivery: undefined,
    notes: undefined,
    trackingNumber: undefined,
    carrier: undefined,
    status: mapOrderStatus(frappeStatus),
    workflowState,
    frappeStatus,
    deliveryNote: frappeOrder.delivery_note ?? undefined,
    salesInvoice: frappeOrder.sales_invoice ?? undefined,
    paymentStatus: mapPaymentStatus(frappeStatus),
    shippingStatus: mapShippingStatus(frappeStatus),
    fulfillment: frappeStatus === "Completed" || workflowState.toLowerCase() === "delivered" ? "Fulfilled" : "Unfulfilled",
    timeline: buildTimeline(frappeOrder),
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Batch adapter for multiple orders
 */
export function adaptFrappeOrders(
  frappeOrders: FrappeSalesOrder[],
  customersMap: Map<string, FrappeCustomer> = new Map(),
  shippingAddressesMap: Map<string, FrappeAddress> = new Map(),
  billingAddressesMap: Map<string, FrappeAddress> = new Map()
): Order[] {
  return frappeOrders.map((order) => {
    const customer = customersMap.get(order.customer);
    const shippingAddr = shippingAddressesMap.get(order.shipping_address_name ?? "");
    const billingAddr = billingAddressesMap.get(order.billing_address_name ?? "");
    return adaptFrappeOrder(order, customer, shippingAddr, billingAddr);
  });
}