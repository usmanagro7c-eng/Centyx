export interface ERPNextResponse<T = any> {
  data: T;
  total_count?: number;
  message?: any;
}

export interface FrappeItem {
  name: string;
  item_code: string;
  item_name: string;
  item_group: string;
  description?: string;
  standard_rate?: number;
  valuation_rate?: number;
  stock_uom?: string;
  image?: string;
  disabled?: number;
  creation?: string;
  modified?: string;
}

export interface FrappeItemGroup {
  name: string;
  item_group_name: string;
  parent_item_group?: string;
  is_group?: number;
  image?: string;
}

export interface FrappeBin {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number;
  reserved_qty: number;
  ordered_qty: number;
  projected_qty: number;
}

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
