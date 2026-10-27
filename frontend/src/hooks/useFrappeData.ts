import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getProducts, getProductById, getProductsCount, getItemGroups, getProductBin } from "@/api/products";
import { mapFrappeItemToProduct, mapFrappeItemGroupToCollection, mapFrappeBinToInventory } from "@/mappers/frappe-mappers";
// import type { Product, FrappeItem, FrappeBin } from "@/lib/store-data-store";
import type { Collection } from "@/lib/store-data-store";

/**
 * Products hooks
 */
export function useProducts(page = 1, limit = 20, search = "", itemGroup = "", disabled?: number) {
  return useQuery({
    queryKey: ["products", page, limit, search, itemGroup, disabled],
    queryFn: async () => {
      const response = await getProducts({
        page,
        limit,
        search,
        item_group: itemGroup,
        disabled,
        sort_by: "modified",
        sort_order: "desc",
      } as Parameters<typeof getProducts>[0]);
      return {
        data: response.data.map(mapFrappeItemToProduct),
        total: response.total_count || 0,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useProduct(itemCode: string) {
  return useQuery({
    queryKey: ["product", itemCode],
    queryFn: async () => {
      const response = await getProductById(itemCode);
      // response may be a wrapper; map the inner data to Product
      return mapFrappeItemToProduct(response.data as any);
    },
    enabled: !!itemCode,
  });
}

export function useProductsCount(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["products-count", filters],
    queryFn: () => getProductsCount(filters),
  });
}

/**
 * Collections (Item Groups) hooks
 */
export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const groups = await getItemGroups();
      return groups.map(mapFrappeItemGroupToCollection);
    },
  });
}

/**
 * Inventory hooks
 */
export function useProductInventory(itemCode: string, warehouse?: string) {
  return useQuery({
    queryKey: ["inventory", itemCode, warehouse],
    queryFn: () => getProductBin(itemCode, warehouse).then((bins) => bins.map(mapFrappeBinToInventory)),
    enabled: !!itemCode,
  });
}

/**
 * Purchase Orders hooks
 */
import { api } from "@/api/client";

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

export interface PurchaseOrdersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplier?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

async function getPurchaseOrders(params: PurchaseOrdersQueryParams = {}) {
  const { page = 1, limit = 20, search, status, supplier, from_date, to_date, sort_by = "transaction_date", sort_order = "desc" } = params;

  const filters: any[] = [];
  if (search) {
    filters.push(["name", "like", `%${search}%`]);
    filters.push(["supplier_name", "like", `%${search}%`]);
  }
  if (status) filters.push(["status", "=", status]);
  if (supplier) filters.push(["supplier", "=", supplier]);
  if (from_date) filters.push(["transaction_date", ">=", from_date]);
  if (to_date) filters.push(["transaction_date", "<=", to_date]);

  const { data } = await api.get<{ data: FrappePurchaseOrder[]; total_count?: number }>("/resource/Purchase Order", {
    params: {
      fields: JSON.stringify([
        "name",
        "supplier",
        "supplier_name",
        "transaction_date",
        "schedule_date",
        "status",
        "grand_total",
        "items",
        "creation",
        "modified",
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      limit_start: (page - 1) * limit,
      order_by: `${sort_by} ${sort_order}`,
    },
  });

  return data.data;
}

async function getPurchaseOrdersCount(filters?: Record<string, any>) {
  const response = await api.get<{ message: number }>("/method/frappe.client.get_count", {
    params: {
      doctype: "Purchase Order",
      filters: JSON.stringify(filters || []),
    },
  });
  return response.data.message || 0;
}

export function usePurchaseOrders(params: PurchaseOrdersQueryParams = {}) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: async () => {
      const orders = await getPurchaseOrders(params);
      return orders.map((po: any) => ({
        id: po.name,
        number: po.name,
        supplier: po.supplier_name || po.supplier,
        date: po.transaction_date,
        expectedDate: po.schedule_date,
        status: mapPurchaseOrderStatus(po.status),
        total: po.grand_total,
        items: po.items.map((item: any) => ({
          productId: item.item_code,
          name: item.item_name,
          price: item.rate,
          qty: item.qty,
          total: item.amount,
          uom: item.uom,
        })),
        createdAt: new Date(po.creation).getTime(),
        updatedAt: new Date(po.modified).getTime(),
      }));
    },
    placeholderData: (previousData) => previousData,
  });
}

export function usePurchaseOrdersCount(filters?: Record<string, any>) {
  return useQuery({
    queryKey: ["purchase-orders-count", filters],
    queryFn: () => getPurchaseOrdersCount(filters),
  });
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
 * Gift Cards hooks
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

async function getGiftCards(page = 1, limit = 20, search = "") {
  const filters: any[] = [];
  if (search) {
    filters.push(["card_number", "like", `%${search}%`]);
    filters.push(["customer_name", "like", `%${search}%`]);
  }

  try {
    const { data } = await api.get<{ data: FrappeGiftCard[]; total_count?: number }>("/resource/Gift Card", {
      params: {
        fields: JSON.stringify([
          "name",
          "card_number",
          "customer",
          "customer_name",
          "balance",
          "initial_amount",
          "expiry_date",
          "status",
          "creation",
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: limit,
        limit_start: (page - 1) * limit,
        order_by: "creation desc",
      },
    });
    return data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}

export function useGiftCards(page = 1, limit = 20, search = "") {
  return useQuery({
    queryKey: ["gift-cards", page, limit, search],
    queryFn: () => getGiftCards(page, limit, search).then((cards) =>
      cards.map((card) => ({
        id: card.name,
        number: card.card_number,
        customer: card.customer_name,
        customerEmail: card.customer,
        balance: card.balance,
        initialAmount: card.initial_amount,
        expiryDate: new Date(card.expiry_date).getTime(),
        status: mapGiftCardStatus(card.status),
        createdAt: new Date(card.creation).getTime(),
      }))
    ),
    retry: false,
  });
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

/**
 * Check if Gift Card DocType exists
 */
export async function checkGiftCardDocType() {
  try {
    await api.get("/resource/Gift Card", { params: { limit_page_length: 1 } });
    return true;
  } catch {
    return false;
  }
}

export function useGiftCardDocType() {
  return useQuery({
    queryKey: ["gift-card-doctype"],
    queryFn: checkGiftCardDocType,
    staleTime: 5 * 60 * 1000,
  });
}
