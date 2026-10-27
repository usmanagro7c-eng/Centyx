import { api } from "@/api/client";

/* ============================================================
 * Types
 * ============================================================ */

export interface SalesInvoice {
  name: string;
  owner?: string;
  creation?: string;
  modified?: string;
  modified_by?: string;
  docstatus?: number;

  customer?: string;
  customer_name?: string;
  company?: string;
  items?: SalesInvoiceItem[];

  posting_date?: string;
  posting_time?: string;
  due_date?: string;

  status?: string;

  currency?: string;
  conversion_rate?: number;

  total_qty?: number;
  total?: number;
  net_total?: number;
  grand_total?: number;
  rounded_total?: number;

  outstanding_amount?: number;

  discount_amount?: number;
  additional_discount_percentage?: number;

  debit_to?: string;

  territory?: string;
  customer_group?: string;
  payment_terms_template?: string;

  shipping_address_name?: string;
  shipping_address?: string;
  billing_address?: string;

  contact_person?: string;
  contact_email?: string;

  remarks?: string;

  [key: string]: unknown;
}

export interface SalesInvoiceItem {
  name?: string;
  item_code?: string;
  item_name?: string;
  description?: string;

  qty?: number;
  stock_qty?: number;

  rate?: number;
  amount?: number;
  net_rate?: number;
  net_amount?: number;

  warehouse?: string;

  uom?: string;
  stock_uom?: string;

  income_account?: string;
  cost_center?: string;

  [key: string]: unknown;
}

export interface SalesInvoiceDetail extends SalesInvoice {
  items?: SalesInvoiceItem[];

  taxes?: unknown[];
  payments?: unknown[];

  total_taxes_and_charges?: number;
  base_total_taxes_and_charges?: number;

  base_total?: number;
  base_net_total?: number;
  base_grand_total?: number;

  base_rounded_total?: number;
  base_outstanding_amount?: number;

  customer_address?: string;

  terms?: string;
  tc_name?: string;

  mode_of_payment?: string;

  [key: string]: unknown;
}

export interface GetSalesInvoicesParams {
  search?: string;
  status?: string;
  company?: string;
  customer?: string;
  from_date?: string;
  to_date?: string;

  limit_page_length?: number;
  limit_start?: number;
  order_by?: string;
}

export interface SalesInvoicesResponse {
  data: SalesInvoice[];
  total_count?: number;
}

export interface SalesInvoiceResponse {
  data: SalesInvoiceDetail;
}

/* ============================================================
 * API
 * ============================================================ */

/**
 * Fetch Sales Invoices
 */
export async function getSalesInvoices(
  params: GetSalesInvoicesParams = {}
): Promise<SalesInvoicesResponse> {
  const response = await api.get<SalesInvoicesResponse>(
    "/sales-invoices",
    {
      params: {
        search: params.search || undefined,
        status:
          params.status && params.status !== "All"
            ? params.status
            : undefined,
        company: params.company || undefined,
        customer: params.customer || undefined,
        from_date: params.from_date || undefined,
        to_date: params.to_date || undefined,

        limit_page_length:
          params.limit_page_length ?? 50,

        limit_start:
          params.limit_start ?? 0,

        order_by:
          params.order_by ??
          "posting_date desc, creation desc",
      },
    }
  );

  return response.data;
}

/**
 * Fetch a single Sales Invoice
 */
export async function getSalesInvoiceById(
  id: string
): Promise<SalesInvoiceResponse> {
  const response = await api.get<SalesInvoiceResponse>(
    `/sales-invoices/${encodeURIComponent(id)}`
  );

  return response.data;
}

export async function createSalesInvoice(
  payload: Partial<SalesInvoice>
): Promise<SalesInvoiceResponse> {
  const response = await api.post<SalesInvoiceResponse>(
    "/sales-invoices",
    payload
  );

  return response.data;
}

export async function updateSalesInvoice(
  id: string,
  payload: Partial<SalesInvoice>
): Promise<SalesInvoiceResponse> {
  const response = await api.put<SalesInvoiceResponse>(
    `/sales-invoices/${encodeURIComponent(id)}`,
    payload
  );

  return response.data;
}