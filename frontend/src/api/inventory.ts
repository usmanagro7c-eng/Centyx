import { api } from "./client";

export interface FrappeBin {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  reserved_qty_for_production: number;
  reserved_qty_for_sub_contract: number;
  ordered_qty: number;
  planned_qty: number;
  indented_qty: number;
  projected_qty: number;
}

export interface FrappeBinListResponse {
  data: FrappeBin[];
}

export interface FrappeWarehouse {
  name: string;
  warehouse_name: string;
  parent_warehouse: string;
  is_group: number;
  company: string;
  disabled: number;
}

export interface FrappeWarehouseListResponse {
  data: FrappeWarehouse[];
}

export async function getInventoryBins(params: {
  item_code?: string;
  warehouse?: string;
  limit_page_length?: number;
  limit_start?: number;
} = {}) {
  const filters: any[] = [];

  if (params.item_code) {
    filters.push(["item_code", "=", params.item_code]);
  }
  if (params.warehouse) {
    filters.push(["warehouse", "=", params.warehouse]);
  }

  const response = await api.get<FrappeBinListResponse>("/resource/Bin", {
    params: {
      fields: JSON.stringify([
        "name",
        "item_code",
        "warehouse",
        "actual_qty",
        "reserved_qty",
        "reserved_qty_for_production",
        "reserved_qty_for_sub_contract",
        "ordered_qty",
        "planned_qty",
        "indented_qty",
        "projected_qty",
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: params.limit_page_length || 100,
      limit_start: params.limit_start || 0,
      order_by: "item_code asc, warehouse asc",
    },
  });

  return response.data;
}

export async function getWarehouses() {
  const response = await api.get<FrappeWarehouseListResponse>("/resource/Warehouse", {
    params: {
      fields: JSON.stringify(["name", "warehouse_name", "parent_warehouse", "is_group", "disabled"]),
      filters: JSON.stringify([["disabled", "=", 0]]),
      limit_page_length: 100,
      order_by: "lft asc",
    },
  });
  return response.data;
}

export async function getStockBalance(itemCode: string, warehouse?: string) {
  const filters: any[] = [["item_code", "=", itemCode]];
  if (warehouse) {
    filters.push(["warehouse", "=", warehouse]);
  }

  const response = await api.get<FrappeBinListResponse>("/resource/Bin", {
    params: {
      fields: JSON.stringify([
        "item_code",
        "warehouse",
        "actual_qty",
        "reserved_qty",
        "ordered_qty",
        "projected_qty",
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: 100,
    },
  });
  return response.data;
}