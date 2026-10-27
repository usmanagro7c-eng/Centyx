import { api } from "./client";

// ============================================================
// PURCHASE INVOICE ITEM
// ============================================================

export interface FrappePurchaseInvoiceItem {
  name: string;

  item_code: string;
  item_name?: string;
  description?: string;

  qty: number;

  uom?: string;
  stock_uom?: string;
  conversion_factor?: number;

  rate: number;
  base_rate?: number;

  amount: number;
  base_amount?: number;

  discount_percentage?: number;
  discount_amount?: number;

  warehouse?: string;

  purchase_order?: string;
  purchase_receipt?: string;

  received_qty?: number;

  expense_account?: string;

  cost_center?: string;

  item_tax_template?: string;
}

// ============================================================
// PURCHASE INVOICE
// ============================================================

export type FrappePurchaseInvoiceStatus =
  | "Draft"
  | "Return"
  | "Debit Note"
  | "Submitted"
  | "Paid"
  | "Partly Paid"
  | "Unpaid"
  | "Overdue"
  | "Cancelled"
  | "Internal Transfer";

export interface FrappePurchaseInvoice {
  name: string;

  supplier: string;
  supplier_name?: string;

  posting_date: string;
  due_date?: string;

  bill_no?: string;
  bill_date?: string;

  company?: string;

  status: FrappePurchaseInvoiceStatus | string;

  currency: string;
  conversion_rate?: number;

  buying_price_list?: string;

  supplier_address?: string;
  shipping_address?: string;

  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;

  payment_terms_template?: string;

  credit_to?: string;

  net_total: number;
  base_net_total?: number;

  total: number;
  total_taxes_and_charges: number;

  grand_total: number;
  base_grand_total?: number;

  rounded_total?: number;
  base_rounded_total?: number;

  rounding_adjustment?: number;

  outstanding_amount: number;

  paid_amount?: number;

  discount_amount?: number;
  additional_discount_percentage?: number;

  taxes_and_charges?: string;

  in_words?: string;

  tc_name?: string;
  terms?: string;

  remarks?: string;

  is_return?: number | boolean;
  return_against?: string;

  update_stock?: number | boolean;

  items?: FrappePurchaseInvoiceItem[];

  creation: string;
  modified: string;

  owner?: string;

  docstatus: number;
}

// ============================================================
// API RESPONSES
// ============================================================

export interface FrappePurchaseInvoiceListResponse {
  data: FrappePurchaseInvoice[];
  total_count?: number;
}

export interface FrappePurchaseInvoiceSingleResponse {
  data: FrappePurchaseInvoice;
}

// ============================================================
// PARAMS
// ============================================================

export interface GetPurchaseInvoicesParams {
  fields?: string[];

  filters?: any[];

  limit_page_length?: number;

  limit_start?: number;

  order_by?: string;
}

// ============================================================
// DEFAULT FIELDS
// ============================================================

const DEFAULT_PURCHASE_INVOICE_FIELDS = [
  "name",

  "supplier",
  "supplier_name",

  "posting_date",
  "due_date",

  "bill_no",
  "bill_date",

  "company",

  "status",

  "currency",
  "conversion_rate",

  "buying_price_list",

  "supplier_address",
  "shipping_address",

  "contact_person",
  "contact_email",
  "contact_phone",

  "payment_terms_template",

  "credit_to",

  "net_total",
  "base_net_total",

  "total",
  "total_taxes_and_charges",

  "grand_total",
  "base_grand_total",

  "rounded_total",
  "base_rounded_total",

  "rounding_adjustment",

  "outstanding_amount",

  "paid_amount",

  "discount_amount",
  "additional_discount_percentage",

  "taxes_and_charges",

  "in_words",

  "tc_name",
  "terms",

  "remarks",

  "is_return",
  "return_against",

  "update_stock",

  "items",

  "creation",
  "modified",

  "owner",
  "docstatus",
];

// ============================================================
// GET PURCHASE INVOICES
// ============================================================

export async function getPurchaseInvoices(
  params: GetPurchaseInvoicesParams = {}
) {
  const response =
    await api.get<FrappePurchaseInvoiceListResponse>(
      "/resource/Purchase Invoice",
      {
        params: {
          fields: JSON.stringify(
            params.fields ||
              DEFAULT_PURCHASE_INVOICE_FIELDS
          ),

          filters: JSON.stringify(
            params.filters || []
          ),

          limit_page_length:
            params.limit_page_length ?? 100,

          limit_start:
            params.limit_start ?? 0,

          order_by:
            params.order_by ??
            "posting_date desc",
        },
      }
    );

  return response.data;
}

// ============================================================
// GET SINGLE PURCHASE INVOICE
// ============================================================

export async function getPurchaseInvoiceById(
  invoiceName: string
) {
  const response =
    await api.get<FrappePurchaseInvoiceSingleResponse>(
      `/resource/Purchase Invoice/${encodeURIComponent(
        invoiceName
      )}`
    );

  return response.data;
}

// ============================================================
// GET COUNT
// ============================================================

export async function getPurchaseInvoicesCount(
  filters?: any[]
) {
  const response =
    await api.get<{ message: number }>(
      "/method/frappe.client.get_count",
      {
        params: {
          doctype: "Purchase Invoice",

          filters: JSON.stringify(
            filters || []
          ),
        },
      }
    );

  return response.data.message || 0;
}