import { useMemo, useState } from "react";
import axios from "axios";
import { Eye, RefreshCw, Search, FileText, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  PageHeader,
  StatsRow,
  type Stat,
} from "@/routes/dashboard.$";

import {
  useSalesInvoices,
  type SalesInvoice,
} from "@/hooks/useSalesInvoices";

import { useSalesInvoicesStore } from "@/lib/sale-invoices-store";
import {
  createSalesInvoice,
  updateSalesInvoice,
} from "@/api/sale-invoice";

/* ============================================================
 * Helpers
 * ============================================================ */

const money = (
  amount?: number,
  currency?: string
) => {
  const value = Number(amount ?? 0);

  return `${currency ?? "$"} ${value.toFixed(2)}`;
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const getTodayDate = () =>
  new Date().toISOString().slice(0, 10);

const createInvoiceDraft = (): Partial<SalesInvoice> => ({
  customer: "",
  company: "",
  items: [{ item_code: "", qty: 1, rate: 0 }],
  status: "Draft",
  posting_date: getTodayDate(),
  due_date: getTodayDate(),
  grand_total: 0,
  currency: "PKR",
  remarks: "",
});

function getRequestErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;
    return response?.message || response?.error || error.message;
  }

  return error instanceof Error
    ? error.message
    : "The request could not be completed.";
}

/* ============================================================
 * Status
 * ============================================================ */

const SALES_INVOICE_STATUS_COLORS: Record<
  string,
  string
> = {
  Draft:
    "bg-white/10 text-muted-foreground",

  Unpaid:
    "bg-amber-500/15 text-amber-300 border border-amber-500/30",

  Paid:
    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",

  "Partly Paid":
    "bg-sky-500/15 text-sky-300 border border-sky-500/30",

  Overdue:
    "bg-rose-500/15 text-rose-300 border border-rose-500/30",

  Cancelled:
    "bg-rose-500/15 text-rose-300 border border-rose-500/30",

  Return:
    "bg-purple-500/15 text-purple-300 border border-purple-500/30",

  "Credit Note":
    "bg-purple-500/15 text-purple-300 border border-purple-500/30",

  "Internal Transfer":
    "bg-white/10 text-muted-foreground",

  "Debit Note":
    "bg-orange-500/15 text-orange-300 border border-orange-500/30",
};

function SalesInvoiceStatus({
  status,
}: {
  status?: string;
}) {
  const value = "Paid";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        SALES_INVOICE_STATUS_COLORS[value] ||
          "bg-white/10 text-muted-foreground"
      )}
    >
      {value}
    </span>
  );
}

/* ============================================================
 * Page
 * ============================================================ */

export function SalesInvoicesPage() {
  const {
    search,
    status,
    page,
    pageSize,
    setSearch,
    setStatus,
    setPage,
  } = useSalesInvoicesStore();

  const queryClient = useQueryClient();

  const [selectedInvoice, setSelectedInvoice] =
    useState<SalesInvoice | null>(null);

  const [editingInvoice, setEditingInvoice] =
    useState<SalesInvoice | null>(null);

  const [isCreatingInvoice, setIsCreatingInvoice] =
    useState(false);

  const [createDraft, setCreateDraft] =
    useState<Partial<SalesInvoice>>(createInvoiceDraft());

  const [draftInvoice, setDraftInvoice] =
    useState<Partial<SalesInvoice>>({});

  const [isSaving, setIsSaving] =
    useState(false);

  const [actionError, setActionError] =
    useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSalesInvoices({
    search: search.trim() || undefined,
    status,
    limit_page_length: pageSize,
    limit_start: (page - 1) * pageSize,
    order_by: "posting_date desc, creation desc",
  });

  const invoices = data?.data ?? [];

  /* ----------------------------------------------------------
   * Stats
   * ---------------------------------------------------------- */

  const stats: Stat[] = useMemo(() => {
    const totalInvoices =
      invoices.length;

    const paidCount = invoices.filter(
      (invoice) =>
        invoice.status === "Paid"
    ).length;

    const unpaidCount = invoices.filter(
      (invoice) =>
        invoice.status === "Unpaid" ||
        invoice.status === "Overdue"
    ).length;

    const totalAmount = invoices.reduce(
      (sum, invoice) =>
        sum +
        Number(
          invoice.grand_total ??
            invoice.total ??
            0
        ),
      0
    );

    return [
      {
        label: "Sales invoices",
        value: String(
          data?.total_count ??
            totalInvoices
        ),
      },
      {
        label: "Paid",
        value: String(paidCount),
      },
      {
        label: "Outstanding",
        value: String(unpaidCount),
      },
      {
        label: "Invoice value",
        value: money(
          totalAmount,
          invoices[0]?.currency
        ),
      },
    ];
  }, [invoices, data?.total_count]);

  /* ----------------------------------------------------------
   * Statuses
   * ---------------------------------------------------------- */

  const statuses = useMemo(() => {
    const values = invoices
      .map((invoice) => invoice.status)
      .filter(
        (value): value is string =>
          Boolean(value)
      );

    return Array.from(
      new Set(values)
    ).sort();
  }, [invoices]);

  /* ----------------------------------------------------------
   * Pagination
   * ---------------------------------------------------------- */

  const totalCount =
    data?.total_count ??
    invoices.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className="space-y-6">
      <Breadcrumb label="Sales Invoices" />

      <PageHeader
        icon={FileText}
        title="Sales Invoices"
        subtitle="Manage sales invoices fetched directly from ERPNext."
        primaryAction="New Invoice"
        onPrimary={() => {
          setCreateDraft(createInvoiceDraft());
          setActionError(null);
          setIsCreatingInvoice(true);
        }}
        secondaryAction={
          isFetching
            ? "Refreshing..."
            : "Refresh"
        }
        onSecondary={() => {
          refetch();
        }}
      />

      <StatsRow stats={stats} />

      {/* ======================================================
       * Toolbar
       * ====================================================== */}

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search invoice, customer..."
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
        >
          <option value="All">
            All statuses
          </option>

          {statuses.map((value) => (
            <option
              key={value}
              value={value}
            >
              {value}
            </option>
          ))}
        </select>

        <button
          className={cn(
            "h-10 px-4 rounded-xl glass hover:bg-white/10 text-sm flex items-center gap-2",
            isFetching &&
              "opacity-70"
          )}
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              isFetching &&
                "animate-spin"
            )}
          />

          Refresh
        </button>
      </div>

      {/* ======================================================
       * Error
       * ====================================================== */}

      {isError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error instanceof Error
            ? error.message
            : "Failed to load Sales Invoices."}
        </div>
      )}

      {/* ======================================================
       * Table
       * ====================================================== */}

      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
                <th className="text-left px-4 py-3 font-medium">
                  Invoice #
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Customer
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Posting Date
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Due Date
                </th>

                <th className="text-right px-3 py-3 font-medium">
                  Grand Total
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Currency
                </th>

                <th className="text-left px-3 py-3 font-medium">
                  Status
                </th>

                <th className="text-right px-3 py-3 pr-4 font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {/* Loading */}

              {isLoading && (
                <tr>
                  <td
                    colSpan={12}
                    className="text-center py-14 text-muted-foreground"
                  >
                    Loading Sales Invoices...
                  </td>
                </tr>
              )}

              {/* Rows */}

              {!isLoading &&
                invoices.map(
                  (invoice) => (
                    <tr
                      key={invoice.name}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition"
                    >
                      <td className="px-4 py-2.5 font-medium">
                        {invoice.name}
                      </td>

                      <td className="px-3 py-2.5">
                        <div>
                          <div>
                            {invoice.customer_name ||
                              invoice.customer ||
                              "—"}
                          </div>

                          {invoice.customer_name &&
                            invoice.customer &&
                            invoice.customer_name !==
                              invoice.customer && (
                              <div className="text-[11px] text-muted-foreground">
                                {
                                  invoice.customer
                                }
                              </div>
                            )}
                        </div>
                      </td>

                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDate(
                          invoice.posting_date
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-muted-foreground">
                        {formatDate(
                          invoice.due_date
                        )}
                      </td>

                      <td className="px-3 py-2.5 text-right font-medium">
                        {money(
                          invoice.grand_total ??
                            invoice.total,
                          invoice.currency
                        )}
                      </td>

                      <td className="px-3 py-2.5">
                        {invoice.currency ||
                          "—"}
                      </td>

                      <td className="px-3 py-2.5">
                        <SalesInvoiceStatus
                          status={
                            invoice.status
                          }
                        />
                      </td>

                      <td className="px-3 py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2 ml-auto">
                          <button
                            className="h-7 px-2.5 rounded-md glass hover:bg-white/10 text-xs flex items-center gap-1.5"
                            onClick={() =>
                              setSelectedInvoice(
                                invoice
                              )
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}

              {/* Empty */}

              {!isLoading &&
                invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center py-14 text-muted-foreground"
                    >
                      No Sales Invoices found.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
       * Pagination
       * ====================================================== */}

      {totalCount > pageSize && (
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Page {page} of{" "}
            {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm disabled:opacity-40"
              disabled={
                page <= 1 ||
                isFetching
              }
              onClick={() =>
                setPage(page - 1)
              }
            >
              Previous
            </button>

            <button
              className="h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm disabled:opacity-40"
              disabled={
                page >= totalPages ||
                isFetching
              }
              onClick={() =>
                setPage(page + 1)
              }
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
       * Simple Preview Modal
       * ====================================================== */}

      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() =>
            setSelectedInvoice(null)
          }
        >
          <div
            className="mx-auto mt-10 max-w-2xl rounded-2xl glass-strong border border-white/[0.08] shadow-glow"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-medium">
                  {selectedInvoice.name}
                </h3>

                <p className="text-xs text-muted-foreground mt-1">
                  Sales Invoice
                </p>
              </div>

              <button
                className="h-8 w-8 rounded-lg hover:bg-white/10"
                onClick={() =>
                  setSelectedInvoice(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Customer
                  </div>

                  <div className="text-sm mt-1">
                    {selectedInvoice.customer_name ||
                      selectedInvoice.customer ||
                      "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Posting Date
                  </div>

                  <div className="text-sm mt-1">
                    {formatDate(
                      selectedInvoice.posting_date
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Due Date
                  </div>

                  <div className="text-sm mt-1">
                    {formatDate(
                      selectedInvoice.due_date
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Grand Total
                  </div>

                  <div className="text-sm mt-1 font-medium">
                    {money(
                      selectedInvoice.grand_total ??
                        selectedInvoice.total,
                      selectedInvoice.currency
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Outstanding
                  </div>

                  <div className="text-sm mt-1">
                    {money(
                      selectedInvoice.outstanding_amount,
                      selectedInvoice.currency
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Currency
                  </div>

                  <div className="text-sm mt-1">
                    {selectedInvoice.currency ||
                      "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Status
                  </div>

                  <div className="mt-1">
                    <SalesInvoiceStatus
                      status={
                        selectedInvoice.status
                      }
                    />
                  </div>
                </div>
              </div>

              {selectedInvoice.remarks && (
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">
                    Remarks
                  </div>

                  <p className="text-sm mt-1 text-muted-foreground">
                    {
                      selectedInvoice.remarks
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setEditingInvoice(null)}
        >
          <div
            className="mx-auto mt-10 max-w-xl rounded-2xl glass-strong border border-white/[0.08] shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-medium">
                  Edit Invoice
                </h3>

                <p className="text-xs text-muted-foreground mt-1">
                  {editingInvoice.name}
                </p>
              </div>

              <button
                className="h-8 w-8 rounded-lg hover:bg-white/10"
                onClick={() => setEditingInvoice(null)}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {actionError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <input
                    value={draftInvoice.customer ?? editingInvoice.customer ?? editingInvoice.customer_name ?? ""}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        customer: event.target.value,
                        customer_name: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <select
                    value={draftInvoice.status ?? editingInvoice.status ?? "Unpaid"}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Partly Paid">Partly Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Posting Date</span>
                  <input
                    type="date"
                    value={draftInvoice.posting_date ?? editingInvoice.posting_date ?? ""}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        posting_date: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <input
                    type="date"
                    value={draftInvoice.due_date ?? editingInvoice.due_date ?? ""}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        due_date: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Grand Total</span>
                  <input
                    type="number"
                    value={draftInvoice.grand_total ?? editingInvoice.grand_total ?? 0}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        grand_total: Number(event.target.value || 0),
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Currency</span>
                  <input
                    value={draftInvoice.currency ?? editingInvoice.currency ?? "PKR"}
                    onChange={(event) =>
                      setDraftInvoice((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm block">
                <span className="text-muted-foreground">Remarks</span>
                <textarea
                  value={draftInvoice.remarks ?? editingInvoice.remarks ?? ""}
                  onChange={(event) =>
                    setDraftInvoice((current) => ({
                      ...current,
                      remarks: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm"
                  onClick={() => setEditingInvoice(null)}
                >
                  Cancel
                </button>

                <button
                  className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
                  disabled={isSaving}
                  onClick={async () => {
                    if (!editingInvoice?.name) return;

                    setIsSaving(true);

                    try {
                      await updateSalesInvoice(editingInvoice.name, {
                        customer:
                          draftInvoice.customer ??
                          editingInvoice.customer ??
                          editingInvoice.customer_name,
                        customer_name:
                          draftInvoice.customer ??
                          editingInvoice.customer_name,
                        status:
                          draftInvoice.status ??
                          editingInvoice.status,
                        posting_date:
                          draftInvoice.posting_date ??
                          editingInvoice.posting_date,
                        due_date:
                          draftInvoice.due_date ??
                          editingInvoice.due_date,
                        grand_total:
                          draftInvoice.grand_total ??
                          editingInvoice.grand_total ??
                          editingInvoice.total,
                        currency:
                          draftInvoice.currency ??
                          editingInvoice.currency,
                        remarks:
                          draftInvoice.remarks ??
                          editingInvoice.remarks,
                      });

                      await queryClient.invalidateQueries({
                        queryKey: ["sales-invoices"],
                      });

                      setEditingInvoice(null);
                      setDraftInvoice({});
                    } catch (error) {
                      setActionError(getRequestErrorMessage(error));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingInvoice && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md p-4 overflow-y-auto"
          onClick={() => setIsCreatingInvoice(false)}
        >
          <div
            className="mx-auto mt-10 max-w-xl rounded-2xl glass-strong border border-white/[0.08] shadow-glow"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-medium">
                  New Invoice
                </h3>

                <p className="text-xs text-muted-foreground mt-1">
                  Create a sales invoice in-app
                </p>
              </div>

              <button
                className="h-8 w-8 rounded-lg hover:bg-white/10"
                onClick={() => setIsCreatingInvoice(false)}
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              {actionError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {actionError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <input
                    value={createDraft.customer ?? ""}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        customer: event.target.value,
                        customer_name: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Company</span>
                  <input
                    value={createDraft.company ?? ""}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        company: event.target.value,
                      }))
                    }
                    placeholder="ERPNext company"
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <select
                    value={createDraft.status ?? "Draft"}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        status: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                    <option value="Partly Paid">Partly Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Posting Date</span>
                  <input
                    type="date"
                    value={createDraft.posting_date ?? getTodayDate()}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        posting_date: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <input
                    type="date"
                    value={createDraft.due_date ?? getTodayDate()}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        due_date: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Grand Total</span>
                  <input
                    type="number"
                    value={createDraft.grand_total ?? 0}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        grand_total: Number(event.target.value || 0),
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Currency</span>
                  <input
                    value={createDraft.currency ?? "PKR"}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        currency: event.target.value,
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>
              </div>

              <label className="space-y-2 text-sm block">
                <span className="text-muted-foreground">Remarks</span>
                <textarea
                  value={createDraft.remarks ?? ""}
                  onChange={(event) =>
                    setCreateDraft((current) => ({
                      ...current,
                      remarks: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span className="text-muted-foreground">Item Code</span>
                  <input
                    value={createDraft.items?.[0]?.item_code ?? ""}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        items: [{
                          ...(current.items?.[0] ?? {}),
                          item_code: event.target.value,
                        }],
                      }))
                    }
                    placeholder="ERPNext item code"
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-muted-foreground">Qty</span>
                  <input
                    type="number"
                    min="1"
                    value={createDraft.items?.[0]?.qty ?? 1}
                    onChange={(event) =>
                      setCreateDraft((current) => ({
                        ...current,
                        items: [{
                          ...(current.items?.[0] ?? {}),
                          qty: Number(event.target.value || 1),
                        }],
                      }))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="h-9 px-3 rounded-xl glass hover:bg-white/10 text-sm"
                  onClick={() => setIsCreatingInvoice(false)}
                >
                  Cancel
                </button>

                <button
                  className="h-9 px-3 rounded-xl bg-primary-gradient text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60"
                  disabled={isSaving}
                  onClick={async () => {
                    if (!createDraft.customer?.trim() ||
                        !createDraft.company?.trim() ||
                        !createDraft.items?.[0]?.item_code?.trim()) {
                      setActionError(
                        "Customer, company, and item code are required."
                      );
                      return;
                    }

                    setIsSaving(true);

                    try {
                      await createSalesInvoice({
                        customer: createDraft.customer,
                        customer_name: createDraft.customer_name,
                        company: createDraft.company,
                        items: createDraft.items,
                        status: createDraft.status,
                        posting_date: createDraft.posting_date,
                        due_date: createDraft.due_date,
                        grand_total: createDraft.grand_total ?? 0,
                        currency: createDraft.currency,
                        remarks: createDraft.remarks,
                      });

                      await queryClient.invalidateQueries({
                        queryKey: ["sales-invoices"],
                      });

                      setIsCreatingInvoice(false);
                      setCreateDraft(createInvoiceDraft());
                    } catch (error) {
                      setActionError(getRequestErrorMessage(error));
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesInvoicesPage;