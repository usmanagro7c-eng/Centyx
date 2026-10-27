import { create } from "zustand";

import type {
  SalesInvoice,
  SalesInvoiceDetail,
} from "@/api/sale-invoice";

/* ============================================================
 * Types
 * ============================================================ */

type SalesInvoiceStatus = string;

interface SalesInvoicesStore {
  /* List data */
  invoices: SalesInvoice[];

  /* Selected/detail invoice */
  selectedInvoice: SalesInvoiceDetail | null;

  /* UI state */
  search: string;
  status: SalesInvoiceStatus;
  company: string;
  customer: string;
  fromDate: string;
  toDate: string;

  /* Pagination */
  page: number;
  pageSize: number;
  totalCount: number;

  /* Loading/error state */
  loading: boolean;
  error: string | null;

  /* Actions */
  setInvoices: (
    invoices: SalesInvoice[],
    totalCount?: number
  ) => void;

  setSelectedInvoice: (
    invoice: SalesInvoiceDetail | null
  ) => void;

  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  setCompany: (value: string) => void;
  setCustomer: (value: string) => void;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;

  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  resetFilters: () => void;
  reset: () => void;
}

/* ============================================================
 * Initial State
 * ============================================================ */

const initialState = {
  invoices: [] as SalesInvoice[],
  selectedInvoice: null as SalesInvoiceDetail | null,

  search: "",
  status: "All",
  company: "",
  customer: "",
  fromDate: "",
  toDate: "",

  page: 1,
  pageSize: 50,
  totalCount: 0,

  loading: false,
  error: null as string | null,
};

/* ============================================================
 * Store
 * ============================================================ */

export const useSalesInvoicesStore =
  create<SalesInvoicesStore>((set) => ({
    ...initialState,

    /* --------------------------------------------------------
     * Data
     * -------------------------------------------------------- */

    setInvoices: (invoices, totalCount = 0) =>
      set({
        invoices,
        totalCount,
      }),

    setSelectedInvoice: (invoice) =>
      set({
        selectedInvoice: invoice,
      }),

    /* --------------------------------------------------------
     * Filters
     * -------------------------------------------------------- */

    setSearch: (value) =>
      set({
        search: value,
        page: 1,
      }),

    setStatus: (value) =>
      set({
        status: value,
        page: 1,
      }),

    setCompany: (value) =>
      set({
        company: value,
        page: 1,
      }),

    setCustomer: (value) =>
      set({
        customer: value,
        page: 1,
      }),

    setFromDate: (value) =>
      set({
        fromDate: value,
        page: 1,
      }),

    setToDate: (value) =>
      set({
        toDate: value,
        page: 1,
      }),

    /* --------------------------------------------------------
     * Pagination
     * -------------------------------------------------------- */

    setPage: (page) =>
      set({
        page: Math.max(1, page),
      }),

    setPageSize: (size) =>
      set({
        pageSize: Math.max(1, size),
        page: 1,
      }),

    /* --------------------------------------------------------
     * Loading / Error
     * -------------------------------------------------------- */

    setLoading: (loading) =>
      set({
        loading,
      }),

    setError: (error) =>
      set({
        error,
      }),

    /* --------------------------------------------------------
     * Reset filters
     * -------------------------------------------------------- */

    resetFilters: () =>
      set({
        search: "",
        status: "All",
        company: "",
        customer: "",
        fromDate: "",
        toDate: "",
        page: 1,
      }),

    /* --------------------------------------------------------
     * Full reset
     * -------------------------------------------------------- */

    reset: () =>
      set({
        ...initialState,
      }),
  }));

/* ============================================================
 * Selectors
 * ============================================================ */

export const selectSalesInvoices =
  (state: SalesInvoicesStore) => state.invoices;

export const selectSelectedSalesInvoice =
  (state: SalesInvoicesStore) =>
    state.selectedInvoice;

export const selectSalesInvoiceFilters =
  (state: SalesInvoicesStore) => ({
    search: state.search,
    status: state.status,
    company: state.company,
    customer: state.customer,
    fromDate: state.fromDate,
    toDate: state.toDate,
  });

export const selectSalesInvoicePagination =
  (state: SalesInvoicesStore) => ({
    page: state.page,
    pageSize: state.pageSize,
    totalCount: state.totalCount,
  });