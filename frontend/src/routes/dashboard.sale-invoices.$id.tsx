import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  FileText,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSalesInvoice } from "@/hooks/useSalesInvoices";

export const Route = createFileRoute(
  "/dashboard/sale-invoices/$id"
)({
  component: SalesInvoiceDetailRoute,
});

function money(
  amount?: number,
  currency?: string
) {
  const value = Number(amount ?? 0);

  return `${currency ?? "$"} ${value.toFixed(2)}`;
}

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

const statusColors: Record<string, string> = {
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
};

function InvoiceStatus({
  status,
}: {
  status?: string;
}) {
  const value = status || "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
        statusColors[value] ||
          "bg-white/10 text-muted-foreground"
      )}
    >
      {value}
    </span>
  );
}

function SalesInvoiceDetailRoute() {
  const { id } = Route.useParams();

  const {
    data: invoice,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSalesInvoice(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-24 rounded bg-white/[0.05] animate-pulse" />
        <div className="h-32 rounded-2xl bg-white/[0.03] animate-pulse" />
        <div className="h-72 rounded-2xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-5">
        <Link
          to="/dashboard/sale-invoices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sales Invoices
        </Link>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
          <h2 className="text-sm font-medium text-rose-200">
            Failed to load Sales Invoice
          </h2>

          <p className="text-sm text-rose-300 mt-1">
            {error instanceof Error
              ? error.message
              : "Sales Invoice was not found."}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-4 h-9 px-4 rounded-xl glass hover:bg-white/10 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const items = invoice.items ?? [];

  return (
    <div className="space-y-6 pb-10">
      {/* ======================================================
       * Back
       * ====================================================== */}

      <Link
        to="/dashboard/sale-invoices"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sales Invoices
      </Link>

      {/* ======================================================
       * Header
       * ====================================================== */}

      <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-medium">
                {invoice.name}
              </h1>

              <InvoiceStatus
                status={invoice.status}
              />
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              Sales Invoice
              {invoice.customer_name
                ? ` · ${invoice.customer_name}`
                : ""}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-sm"
          >
            {isFetching
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {/* ======================================================
       * Basic Information
       * ====================================================== */}

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          icon={UserRound}
          label="Customer"
          value={
            invoice.customer_name ||
            invoice.customer ||
            "—"
          }
          sub={
            invoice.customer_name &&
            invoice.customer &&
            invoice.customer_name !==
              invoice.customer
              ? invoice.customer
              : undefined
          }
        />

        <InfoCard
          icon={Building2}
          label="Company"
          value={invoice.company || "—"}
        />

        <InfoCard
          icon={CalendarDays}
          label="Posting Date"
          value={formatDate(
            invoice.posting_date
          )}
          sub={
            invoice.posting_time ||
            undefined
          }
        />
      </div>

      {/* ======================================================
       * Dates / Contact
       * ====================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailField
          label="Due Date"
          value={formatDate(
            invoice.due_date
          )}
        />

        <DetailField
          label="Currency"
          value={invoice.currency || "—"}
        />

        <DetailField
          label="Contact"
          value={
            invoice.contact_person || "—"
          }
        />

        <DetailField
          label="Contact Email"
          value={
            invoice.contact_email || "—"
          }
          icon={Mail}
        />
      </div>

      {/* ======================================================
       * Addresses
       * ====================================================== */}

      <div className="grid gap-4 lg:grid-cols-2">
        <AddressCard
          title="Billing Address"
          value={invoice.billing_address}
        />

        <AddressCard
          title="Shipping Address"
          value={invoice.shipping_address}
        />
      </div>

      {/* ======================================================
       * Items
       * ====================================================== */}

      <section className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium">
            Invoice Items
          </h2>

          <p className="text-xs text-muted-foreground mt-1">
            {items.length} item
            {items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="text-left px-5 py-3">
                  Item
                </th>

                <th className="text-left px-3 py-3">
                  Warehouse
                </th>

                <th className="text-left px-3 py-3">
                  UOM
                </th>

                <th className="text-right px-3 py-3">
                  Qty
                </th>

                <th className="text-right px-3 py-3">
                  Rate
                </th>

                <th className="text-right px-3 py-3">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => (
                <tr
                  key={
                    item.name ??
                    `${item.item_code}-${index}`
                  }
                  className="border-b border-white/[0.04] hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {item.item_name ||
                        item.item_code ||
                        "—"}
                    </div>

                    {item.item_name &&
                      item.item_code && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {item.item_code}
                        </div>
                      )}

                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-[420px]">
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-3 text-muted-foreground">
                    {item.warehouse || "—"}
                  </td>

                  <td className="px-3 py-3 text-muted-foreground">
                    {item.uom ||
                      item.stock_uom ||
                      "—"}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {Number(
                      item.qty ?? 0
                    ).toLocaleString()}
                  </td>

                  <td className="px-3 py-3 text-right">
                    {money(
                      item.rate,
                      invoice.currency
                    )}
                  </td>

                  <td className="px-3 py-3 text-right font-medium">
                    {money(
                      item.amount ??
                        item.net_amount,
                      invoice.currency
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No invoice items available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================================
       * Totals
       * ====================================================== */}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
          <h2 className="text-sm font-medium">
            Additional Information
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField
              label="Customer Group"
              value={
                invoice.customer_group ||
                "—"
              }
            />

            <DetailField
              label="Territory"
              value={
                invoice.territory || "—"
              }
            />

            <DetailField
              label="Payment Terms"
              value={
                invoice.payment_terms_template ||
                "—"
              }
            />

            <DetailField
              label="Debit To"
              value={
                invoice.debit_to || "—"
              }
            />
          </div>

          {invoice.remarks && (
            <div className="mt-5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Remarks
              </div>

              <p className="text-sm mt-2 whitespace-pre-wrap">
                {invoice.remarks}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl glass-strong border border-white/[0.08] p-5">
          <h2 className="text-sm font-medium">
            Invoice Summary
          </h2>

          <div className="mt-4 space-y-3">
            <SummaryRow
              label="Total Quantity"
              value={Number(
                invoice.total_qty ?? 0
              ).toLocaleString()}
            />

            <SummaryRow
              label="Total"
              value={money(
                invoice.total,
                invoice.currency
              )}
            />

            <SummaryRow
              label="Net Total"
              value={money(
                invoice.net_total,
                invoice.currency
              )}
            />

            <SummaryRow
              label="Discount"
              value={money(
                invoice.discount_amount,
                invoice.currency
              )}
            />

            <SummaryRow
              label="Taxes"
              value={money(
                invoice.total_taxes_and_charges,
                invoice.currency
              )}
            />

            <div className="border-t border-white/[0.06] pt-3">
              <SummaryRow
                label="Grand Total"
                value={money(
                  invoice.grand_total ??
                    invoice.total,
                  invoice.currency
                )}
                strong
              />
            </div>

            <div className="border-t border-white/[0.06] pt-3">
              <SummaryRow
                label="Outstanding"
                value={money(
                  invoice.outstanding_amount,
                  invoice.currency
                )}
                strong
                valueClass={
                  Number(
                    invoice.outstanding_amount ??
                      0
                  ) > 0
                    ? "text-amber-300"
                    : "text-emerald-300"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Components
 * ============================================================ */

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/[0.04] grid place-items-center">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </div>

          <div className="text-sm font-medium mt-1 truncate">
            {value}
          </div>

          {sub && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </div>

      <div className="flex items-center gap-2 text-sm mt-1">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        )}

        <span className="truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function AddressCard({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  return (
    <div className="rounded-2xl glass-strong border border-white/[0.08] p-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />

        <h3 className="text-sm font-medium">
          {title}
        </h3>
      </div>

      <div className="text-sm text-muted-foreground mt-3 whitespace-pre-line">
        {value || "No address available."}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  valueClass,
}: {
  label: string;
  value: string;
  strong?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span
        className={
          strong
            ? "font-medium"
            : "text-muted-foreground"
        }
      >
        {label}
      </span>

      <span
        className={cn(
          strong && "font-medium",
          valueClass
        )}
      >
        {value}
      </span>
    </div>
  );
}