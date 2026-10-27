import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  ArrowLeft,
  FileText,
  RefreshCw,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  usePurchaseInvoices,
  computePurchaseInvoiceTotals,
} from "@/hooks/usePurchaseInvoices";

export const Route = createFileRoute(
  "/dashboard/purchase-invoices/$id"
)({
  head: () => ({
    meta: [
      {
        title: "Purchase Invoice — Aether",
      },
    ],
  }),

  component:
    PurchaseInvoiceDetailPage,
});

function PurchaseInvoiceDetailPage() {
  console.log("PurchaseInvoiceDetailPage rendered");
  const { id } = Route.useParams();

  const navigate = useNavigate();

  const {
    getPurchaseInvoice,
    loading,
    error,
  } = usePurchaseInvoices();

  const [invoice, setInvoice] =
    useState<
      Awaited<
        ReturnType<
          typeof getPurchaseInvoice
        >
      > | null
    >(null);

  const [notFound, setNotFound] =
    useState(false);

useEffect(() => {
  console.log(
    "=== PURCHASE INVOICE DETAIL ROUTE ===",
    id
  );

  let cancelled = false;

  async function loadInvoice() {

    console.log(
      "=== loadInvoice CALLED ===",
      id
    );

    if (!id) {
      setNotFound(true);
      return;
    }

    setNotFound(false);

    try {
      console.log(
        "=== CALLING getPurchaseInvoice ===",
        id
      );

      const result =
        await getPurchaseInvoice(id);

      console.log(
        "=== getPurchaseInvoice RESULT ===",
        result
      );

      if (!cancelled) {
        setInvoice(result);
      }
    } catch (err) {
      console.error(
        "Failed to load Purchase Invoice:",
        err
      );

      if (!cancelled) {
        setInvoice(null);
        setNotFound(true);
      }
    }
  }

  loadInvoice();

  return () => {
    cancelled = true;
  };
}, [id, getPurchaseInvoice]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading && !invoice) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-7 w-7 mx-auto animate-spin text-primary" />

          <p className="mt-3 text-sm text-muted-foreground">
            Loading Purchase Invoice...
          </p>

          <p className="mt-1 text-xs text-muted-foreground/60">
            {id}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR / NOT FOUND
  // ==========================================================

  if (!invoice || notFound) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground" />

          <p className="mt-3 text-sm text-muted-foreground">
            Purchase invoice not found.
          </p>

          {error && (
            <p className="mt-2 text-xs text-rose-300 break-words">
              {String(error)}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground/60">
            Invoice ID: {id}
          </p>

          <Link
            to="/dashboard/purchase-invoices"
            className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />

            Back to purchase invoices
          </Link>
        </div>
      </div>
    );
  }

  const totals =
    computePurchaseInvoiceTotals(
      invoice
    );

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              navigate({
                to: "/dashboard/purchase-invoices",
              })
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl glass hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Purchase Invoice
            </div>

            <div className="font-display text-2xl md:text-3xl font-semibold tracking-tight mt-0.5">
              {invoice.number}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Status
          </div>

          <div className="mt-1 text-sm font-medium">
            {invoice.status}
          </div>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {String(error)}
        </div>
      )}

      {/* HEADER INFORMATION */}

      <div className="rounded-2xl glass-strong border border-white/[0.08] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Info
            label="Supplier"
            value={
              invoice.supplierName ||
              invoice.supplier ||
              "—"
            }
          />

          <Info
            label="Supplier ID"
            value={
              invoice.supplier ||
              "—"
            }
          />

          <Info
            label="Company"
            value={
              invoice.company ||
              "—"
            }
          />

          <Info
            label="Currency"
            value={
              invoice.currency ||
              "PKR"
            }
          />

          <Info
            label="Posting Date"
            value={
              invoice.postingDate ||
              "—"
            }
          />

          <Info
            label="Due Date"
            value={
              invoice.dueDate ||
              "—"
            }
          />

          <Info
            label="Bill No"
            value={
              invoice.billNo ||
              "—"
            }
          />

          <Info
            label="Bill Date"
            value={
              invoice.billDate ||
              "—"
            }
          />

          <Info
            label="Payment Status"
            value={
              invoice.paymentStatus
            }
          />

          <Info
            label="Paid Amount"
            value={formatCurrency(
              invoice.paidAmount,
              invoice.currency
            )}
          />

          <Info
            label="Outstanding"
            value={formatCurrency(
              invoice.outstandingAmount,
              invoice.currency
            )}
          />

          <Info
            label="Warehouse"
            value={
              invoice.warehouse ||
              "—"
            }
          />
        </div>
      </div>

      {/* ITEMS */}

      <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="font-medium">
            Items
          </div>

          <div className="text-xs text-muted-foreground mt-1">
            {invoice.lines.length} item
            {invoice.lines.length !== 1
              ? "s"
              : ""}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70 bg-white/[0.02]">
              <tr>
                <th className="px-4 py-3">
                  Item
                </th>

                <th className="px-4 py-3">
                  Description
                </th>

                <th className="px-4 py-3 text-right">
                  Qty
                </th>

                <th className="px-4 py-3">
                  UOM
                </th>

                <th className="px-4 py-3 text-right">
                  Rate
                </th>

                <th className="px-4 py-3 text-right">
                  Discount
                </th>

                <th className="px-4 py-3 text-right">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {invoice.lines.map(
                (line) => (
                  <tr
                    key={line.id}
                    className="border-t border-white/[0.05]"
                  >
                    <td className="px-4 py-3 font-medium">
                      {line.sku ||
                        line.product ||
                        "—"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {line.description ||
                        line.product ||
                        "—"}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {line.qty}
                    </td>

                    <td className="px-4 py-3">
                      {line.unit}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {formatCurrency(
                        line.cost,
                        invoice.currency
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {line.discount}%
                    </td>

                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(
                        line.amount,
                        invoice.currency
                      )}
                    </td>
                  </tr>
                )
              )}

              {invoice.lines.length ===
                0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALS */}

      <div className="flex justify-end">
        <div className="w-full max-w-md rounded-2xl glass-strong border border-white/[0.08] p-5">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(
              totals.subtotal,
              invoice.currency
            )}
          />

          <SummaryRow
            label="Discount"
            value={formatCurrency(
              totals.discount,
              invoice.currency
            )}
          />

          <SummaryRow
            label="Tax"
            value={formatCurrency(
              totals.tax,
              invoice.currency
            )}
          />

          <div className="border-t border-white/[0.06] my-3" />

          <SummaryRow
            label="Grand Total"
            value={formatCurrency(
              totals.grandTotal,
              invoice.currency
            )}
            bold
          />

          <SummaryRow
            label="Paid"
            value={formatCurrency(
              totals.paid,
              invoice.currency
            )}
          />

          <SummaryRow
            label="Outstanding"
            value={formatCurrency(
              totals.outstanding,
              invoice.currency
            )}
            accent
          />
        </div>
      </div>

      {/* REMARKS */}

      {(invoice.remarks ||
        invoice.terms) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {invoice.remarks && (
            <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Remarks
              </div>

              <p className="mt-2 text-sm whitespace-pre-wrap">
                {invoice.remarks}
              </p>
            </div>
          )}

          {invoice.terms && (
            <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Terms & Conditions
              </div>

              <p className="mt-2 text-sm whitespace-pre-wrap">
                {invoice.terms}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(
  value: number,
  currency = "PKR"
) {
  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency: currency || "PKR",
        maximumFractionDigits: 2,
      }
    ).format(Number(value || 0));
  } catch {
    return `${currency || "PKR"} ${Number(
      value || 0
    ).toFixed(2)}`;
  }
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium">
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between py-1.5 text-sm",
        bold ? "font-semibold" : "",
        accent ? "text-amber-200" : "",
      ].join(" ")}
    >
      <span className="text-muted-foreground">
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}