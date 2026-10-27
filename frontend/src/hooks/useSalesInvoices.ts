import { useQuery } from "@tanstack/react-query";

import {
  getSalesInvoices,
  getSalesInvoiceById,
  type GetSalesInvoicesParams,
  type SalesInvoice,
  type SalesInvoiceDetail,
} from "@/api/sale-invoice";

/* ============================================================
 * Query Keys
 * ============================================================ */

export const salesInvoiceKeys = {
  all: ["sales-invoices"] as const,

  lists: () =>
    [...salesInvoiceKeys.all, "list"] as const,

  list: (params: GetSalesInvoicesParams) =>
    [...salesInvoiceKeys.lists(), params] as const,

  details: () =>
    [...salesInvoiceKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...salesInvoiceKeys.details(), id] as const,
};

/* ============================================================
 * List Hook
 * ============================================================ */

export function useSalesInvoices(
  params: GetSalesInvoicesParams = {}
) {
  return useQuery({
    queryKey: salesInvoiceKeys.list(params),

    queryFn: async () => {
      const response = await getSalesInvoices(params);

      return {
        data: response.data ?? [],
        total_count: response.total_count ?? response.data?.length ?? 0,
      };
    },

    staleTime: 30_000,

    refetchOnWindowFocus: false,
  });
}

/* ============================================================
 * Detail Hook
 * ============================================================ */

export function useSalesInvoice(
  id: string | undefined
) {
  return useQuery({
    queryKey: id
      ? salesInvoiceKeys.detail(id)
      : [...salesInvoiceKeys.details(), "empty"],

    queryFn: async (): Promise<SalesInvoiceDetail> => {
      if (!id) {
        throw new Error("Sales Invoice ID is required");
      }

      const response = await getSalesInvoiceById(id);

      return response.data;
    },

    enabled: Boolean(id),

    staleTime: 30_000,

    refetchOnWindowFocus: false,
  });
}

/* ============================================================
 * Convenience Hook
 * ============================================================ */

/**
 * Fetch all Sales Invoices.
 *
 * Useful for dashboard stats where pagination is not required.
 */
export function useAllSalesInvoices() {
  const query = useSalesInvoices({
    limit_page_length: 500,
    limit_start: 0,
    order_by: "posting_date desc, creation desc",
  });

  return {
    ...query,
    data: query.data?.data ?? [],
    totalCount: query.data?.total_count ?? 0,
  };
}

/* ============================================================
 * Typed Helpers
 * ============================================================ */

export type UseSalesInvoicesResult =
  ReturnType<typeof useSalesInvoices>;

export type UseSalesInvoiceResult =
  ReturnType<typeof useSalesInvoice>;

export type {
  SalesInvoice,
  SalesInvoiceDetail,
};