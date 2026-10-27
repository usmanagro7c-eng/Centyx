import { api } from "./client";

export interface FrappeItem {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  disabled: number;

  description?: string;
  image?: string;
  is_stock_item: number;
  variant_of?: string;
  has_variants: number;
  valuation_rate?: number;
  opening_stock?: number;
  min_order_qty?: number;
  max_order_qty?: number;
  weight_per_unit?: number;
  weight_uom?: string;
  brand?: string;
  item_category?: string;
  variant_based_on?: string;

  attributes?: Array<{
    attribute: string;
    attribute_value: string;
  }>;

  creation: string;
  modified: string;
  owner: string;
  docstatus: number;
}

export interface FrappeItemGroup {
  name: string;
  item_group_name: string;
  is_group: number;
  parent_item_group: string;
}

export interface FrappeBin {
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  projected_qty: number;
}

export interface FrappeItemListResponse {
  data: FrappeItem[];
  total_count?: number;
}

export interface FrappeItemSingleResponse {
  data: FrappeItem;
}

export interface GetProductsParams {
  fields?: string[];
  filters?: any;
  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
  search?: string;
  include_cost?: boolean;
}

export async function getProducts(params: GetProductsParams = {}) {
  const defaultFields = [
    "name",
    "item_code",
    "item_name",
    "item_group",
    "stock_uom",
    "standard_rate",
    "disabled",
    "description",
    "image",
    "is_stock_item",
    "variant_of",
    "has_variants",
    "valuation_rate",
    "brand",
    "weight_per_unit",
    "weight_uom",
    "creation",
    "modified",
  ];

  const response = await api.get<FrappeItemListResponse>("/products", {
    params: {
      limit: params.limit_page_length ?? 20,
      page: Math.floor((params.limit_start ?? 0) / (params.limit_page_length ?? 20)) + 1,
      search: params.search,
      item_group: params.filters?.item_group,
      disabled: params.filters?.disabled,
      order_by: params.order_by ?? "creation desc",
      include_cost: params.include_cost ? "true" : undefined,
    },
  });

  return response.data.data;
}

export async function getProductById(itemCode: string) {
  const response = await api.get<FrappeItemSingleResponse>(
    `/resource/Item/${itemCode}`
  );

  return response.data.data;
}

export async function getProductsCount(filters?: any) {
  const response = await api.get<{ message: number }>(
    "/method/frappe.client.get_count",
    {
      params: {
        doctype: "Item",
        filters: JSON.stringify(filters || []),
      },
    }
  );

  return response.data.message;
}

export async function getItemGroups() {
  const response = await api.get<FrappeItemGroup[]>(
    "/products/item-groups",
    {
      params: { limit_page_length: 1000 },
    }
  );

  return response.data;
}

export async function getProductBin(
  itemCode: string,
  warehouse?: string
) {
  const filters: any[] = [["item_code", "=", itemCode]];

  if (warehouse) {
    filters.push(["warehouse", "=", warehouse]);
  }

  const response = await api.get<{
    map(mapFrappeBinToInventory: (bin: FrappeBin) => { itemCode: string; warehouse: string; onHand: number; reserved: number; available: number; incoming: number; }): any; data: FrappeBin[] 
}>("/resource/Bin", {
    params: {
      filters: JSON.stringify(filters),
      fields: JSON.stringify([
        "item_code",
        "warehouse",
        "actual_qty",
        "reserved_qty",
        "projected_qty",
      ]),
    },
  });

  return response.data.data;
}

export async function getAllProductBins(): Promise<FrappeBin[]> {
  const response = await api.get<FrappeBin[]>("/inventory/bins", {
    params: {
      limit: 5000,
    },
  });

  return response.data;
}

export async function deleteProduct(itemCode: string): Promise<void> {
  await api.delete(`/resource/Item/${itemCode}`);
}