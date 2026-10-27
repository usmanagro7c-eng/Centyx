import { api } from "./client";

export interface FrappePurchaseOrderItem {
  name: string;
  item_code: string;
  item_name: string;
  description?: string;
  qty: number;
  uom: string;
  stock_uom: string;
  conversion_factor: number;
  rate: number;
  base_rate: number;
  amount: number;
  base_amount: number;
  warehouse?: string;
  schedule_date?: string;
  received_qty?: number;
}

export interface FrappePurchaseOrder {
  name: string;
  supplier: string;
  supplier_name: string;

  transaction_date: string;
  schedule_date: string;

  status:
    | "Draft"
    | "On Hold"
    | "To Receive"
    | "To Receive and Bill"
    | "To Bill"
    | "Completed"
    | "Cancelled"
    | "Closed";

  grand_total: number;
  base_grand_total: number;
  currency: string;
  conversion_rate: number;

  supplier_address?: string;
  shipping_address?: string;
  contact_person?: string;
  contact_email?: string;

  total: number;
  total_taxes_and_charges: number;
  rounded_total: number;

  taxes_and_charges?: string;
  in_words?: string;
  tc_name?: string;
  terms?: string;

  items?: FrappePurchaseOrderItem[];

  creation: string;
  modified: string;
  owner: string;
  docstatus: number;
}

export interface FrappePurchaseOrderListResponse {
  data: FrappePurchaseOrder[];
  total_count?: number;
}

export interface FrappePurchaseOrderSingleResponse {
  data: FrappePurchaseOrder;
}

export interface GetPurchaseOrdersParams {
  fields?: string[];
  filters?: any[];
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

/**
 * Get Purchase Orders
 */
export async function getPurchaseOrders(
  params: GetPurchaseOrdersParams = {}
) {
const defaultFields = [
  "name",
  "supplier",
  "supplier_name",
  "transaction_date",
  "schedule_date",
  "status",
  "grand_total",
  "base_grand_total",
  "currency",
  "conversion_rate",
  "total",
  "rounded_total",
  "total_taxes_and_charges",
  "items",
  "creation",
  "modified",
];
  const response = await api.get<FrappePurchaseOrderListResponse>(
    "/resource/Purchase Order",
    {
      params: {
        fields: JSON.stringify(params.fields || defaultFields),
        filters: JSON.stringify(params.filters || []),
        limit_page_length: params.limit_page_length ?? 20,
        limit_start: params.limit_start ?? 0,
        order_by: params.order_by ?? "transaction_date desc",
      },
    }
  );

  return response.data;
}

/**
 * Get single Purchase Order
 */
export async function getPurchaseOrderById(orderName: string) {
  const response = await api.get<FrappePurchaseOrderSingleResponse>(
    `/resource/Purchase Order/${orderName}`
  );

  return response.data;
}

/**
 * Get Purchase Orders count
 */
export async function getPurchaseOrdersCount(filters?: any[]) {
  const response = await api.get<{ message: number }>(
    "/method/frappe.client.get_count",
    {
      params: {
        doctype: "Purchase Order",
        filters: JSON.stringify(filters || []),
      },
    }
  );

  return response.data.message || 0;
}
