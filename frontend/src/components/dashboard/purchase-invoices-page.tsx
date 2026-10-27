import { Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FileText,
  Plus,
  Search,
  SlidersHorizontal,
  Download,
  Printer,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  FileDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Trash2,
  X,
  Check,
  Wallet,
  TrendingUp,
  Clock,
  CircleDollarSign,
  Calendar,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { FloatingLayer } from "@/components/ui/floating-menu";

import {
  usePurchaseInvoices,
  type PurchaseInvoice,
  type PurchaseInvoiceLine,
} from "@/hooks/usePurchaseInvoices";

// ============================================================
// HELPERS
// ============================================================

function fmt(n: number, ccy = "PKR") {
  const value = Number(n || 0);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: ccy || "PKR",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${ccy || "PKR"} ${value.toFixed(2)}`;
  }
}

function parseFrappeDate(value?: string) {
  if (!value) return undefined;

  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const dmyMatch = value.match(
    /^(\d{2})-(\d{2})-(\d{4})$/
  );

  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date;
}

function fmtDate(value?: string) {
  const date = parseFrappeDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toStartOfDay(value: string) {
  const date = parseFrappeDate(value);

  if (!date) return undefined;

  date.setHours(0, 0, 0, 0);

  return date;
}

function toEndOfDay(value: string) {
  const date = parseFrappeDate(value);

  if (!date) return undefined;

  date.setHours(23, 59, 59, 999);

  return date;
}

// ============================================================
// TOAST
// ============================================================

type Toast = {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
};

let tId = 0;

const listeners = new Set<(toast: Toast) => void>();

function toast(
  kind: Toast["kind"],
  text: string
) {
  const item: Toast = {
    id: ++tId,
    kind,
    text,
  };

  listeners.forEach((listener) => {
    listener(item);
  });
}

function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (item: Toast) => {
      setItems((previous) => [
        ...previous,
        item,
      ]);

      window.setTimeout(() => {
        setItems((previous) =>
          previous.filter(
            (x) => x.id !== item.id
          )
        );
      }, 3000);
    };

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              opacity: 0,
              y: 16,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
            }}
            className="pointer-events-auto flex items-center gap-2 rounded-xl glass-strong border border-white/10 px-4 py-2.5 text-xs shadow-glow"
          >
            {item.kind === "success" && (
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            )}

            {item.kind === "error" && (
              <X className="h-3.5 w-3.5 text-rose-300" />
            )}

            {item.kind === "info" && (
              <FileText className="h-3.5 w-3.5 text-primary" />
            )}

            <span>{item.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// STATUS PILL
// ============================================================

function StatusPill({
  label,
}: {
  label: string;
}) {
  const tone: Record<string, string> = {
    Paid:
      "bg-emerald-500/12 text-emerald-300 border-emerald-400/20",

    "Partially Paid":
      "bg-amber-500/12 text-amber-200 border-amber-400/20",

    Pending:
      "bg-white/[0.06] text-muted-foreground border-white/10",

    Unpaid:
      "bg-amber-500/12 text-amber-200 border-amber-400/20",

    Overdue:
      "bg-rose-500/12 text-rose-300 border-rose-400/20",

    Draft:
      "bg-white/[0.06] text-muted-foreground border-white/10",

    Submitted:
      "bg-cyan-500/12 text-cyan-200 border-cyan-400/20",

    Cancelled:
      "bg-white/[0.05] text-muted-foreground border-white/10",

    Return:
      "bg-orange-500/12 text-orange-200 border-orange-400/20",

    "Debit Note":
      "bg-orange-500/12 text-orange-200 border-orange-400/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center h-6 px-2 rounded-full border text-[11px] font-medium",
        tone[label] ?? tone.Pending
      )}
    >
      {label}
    </span>
  );
}

// ============================================================
// PAGE
// ============================================================

export function PurchaseInvoicesPage() {
  const {
    invoices,
    loading,
    error,
    fetchInvoices,
    add,
    updatePurchaseInvoice,
  } = usePurchaseInvoices();

  const navigate = useNavigate();

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

console.log("=== PURCHASE INVOICES PAGE EFFECT ===");
  console.log("fetchInvoices function:", fetchInvoices);

    fetchInvoices().catch((err) => {
        
      console.error(
        "Failed to load Purchase Invoices:",
        err
      );
    });
  }, [fetchInvoices]);

  // ==========================================================
  // STATE
  // ==========================================================

  const [query, setQuery] = useState("");

  const [supplier, setSupplier] =
    useState("All");

  const [invoiceStatus, setInvoiceStatus] =
    useState("All");

  const [paymentStatus, setPaymentStatus] =
    useState("All");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const [amountMin, setAmountMin] =
    useState("");

  const [amountMax, setAmountMax] =
    useState("");

  const [showFilters, setShowFilters] =
    useState(false);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editingInvoice, setEditingInvoice] =
    useState<PurchaseInvoice | null>(null);

  const [menuFor, setMenuFor] =
    useState<string | null>(null);

  const importRef =
    useRef<HTMLInputElement>(null);

  // ==========================================================
  // SUPPLIERS
  // ==========================================================

  const suppliers = useMemo(() => {
    return Array.from(
      new Set(
        invoices
          .map(
            (invoice) =>
              invoice.supplierName ||
              invoice.supplier
          )
          .filter(Boolean)
      )
    ).sort();
  }, [invoices]);

  // ==========================================================
  // INVOICE STATUSES
  // ==========================================================

  const invoiceStatuses = useMemo(() => {
    return Array.from(
      new Set(
        invoices
          .map(
            (invoice) =>
              invoice.status
          )
          .filter(Boolean)
      )
    ).sort();
  }, [invoices]);

  // ==========================================================
  // FILTER
  // ==========================================================

  const filtered = useMemo(() => {
    const fromDate = dateFrom
      ? toStartOfDay(dateFrom)
      : undefined;

    const toDate = dateTo
      ? toEndOfDay(dateTo)
      : undefined;

    return invoices.filter((invoice) => {
      const searchText =
        `${invoice.number} ${
          invoice.supplier
        } ${
          invoice.supplierName || ""
        } ${
          invoice.billNo || ""
        }`.toLowerCase();

      if (
        query &&
        !searchText.includes(
          query.toLowerCase().trim()
        )
      ) {
        return false;
      }

      if (
        supplier !== "All" &&
        invoice.supplier !== supplier &&
        invoice.supplierName !== supplier
      ) {
        return false;
      }

      if (
        invoiceStatus !== "All" &&
        invoice.status !== invoiceStatus
      ) {
        return false;
      }

      if (
        paymentStatus !== "All" &&
        invoice.paymentStatus !==
          paymentStatus
      ) {
        return false;
      }

      const invoiceDate =
        parseFrappeDate(
          invoice.postingDate
        );

      if (
        fromDate &&
        invoiceDate &&
        invoiceDate.getTime() <
          fromDate.getTime()
      ) {
        return false;
      }

      if (
        toDate &&
        invoiceDate &&
        invoiceDate.getTime() >
          toDate.getTime()
      ) {
        return false;
      }

      const total =
        Number(invoice.grandTotal || 0);

      if (
        amountMin &&
        total < Number(amountMin)
      ) {
        return false;
      }

      if (
        amountMax &&
        total > Number(amountMax)
      ) {
        return false;
      }

      return true;
    });
  }, [
    invoices,
    query,
    supplier,
    invoiceStatus,
    paymentStatus,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
  ]);

  // ==========================================================
  // STATS
  // ==========================================================

  const stats = useMemo(() => {
    const total = invoices.length;

    const pending = invoices.filter(
      (invoice) =>
        invoice.paymentStatus !== "Paid"
    ).length;

    const paid = invoices.filter(
      (invoice) =>
        invoice.paymentStatus === "Paid"
    ).length;

    const totalAmount =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.grandTotal || 0
          ),
        0
      );

    const outstanding =
      invoices.reduce(
        (sum, invoice) =>
          sum +
          Number(
            invoice.outstandingAmount ||
              0
          ),
        0
      );

    const now = new Date();

    const thisMonth =
      invoices
        .filter((invoice) => {
          const date =
            parseFrappeDate(
              invoice.postingDate
            );

          if (!date) return false;

          return (
            date.getFullYear() ===
              now.getFullYear() &&
            date.getMonth() ===
              now.getMonth()
          );
        })
        .reduce(
          (sum, invoice) =>
            sum +
            Number(
              invoice.grandTotal || 0
            ),
          0
        );

    return {
      total,
      pending,
      paid,
      totalAmount,
      outstanding,
      thisMonth,
    };
  }, [invoices]);

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  function handleExportCSV() {
    if (!filtered.length) {
      toast(
        "info",
        "There are no invoices to export"
      );

      return;
    }

    const headers = [
      "Invoice",
      "Supplier",
      "Posting Date",
      "Due Date",
      "Bill No",
      "Total",
      "Paid",
      "Outstanding",
      "Status",
    ];

    const rows = filtered.map(
      (invoice) => [
        invoice.number,
        invoice.supplierName ||
          invoice.supplier,
        invoice.postingDate || "",
        invoice.dueDate || "",
        invoice.billNo || "",
        Number(
          invoice.grandTotal || 0
        ).toFixed(2),
        Number(
          invoice.paidAmount || 0
        ).toFixed(2),
        Number(
          invoice.outstandingAmount ||
            0
        ).toFixed(2),
        invoice.status,
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (cell) =>
              `"${String(cell).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download =
      `purchase-invoices-${Date.now()}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);

    toast(
      "success",
      "Purchase Invoices exported"
    );
  }

  // ==========================================================
  // PDF / PRINT
  // ==========================================================

  function handleExportPDF() {
    if (!filtered.length) {
      toast(
        "info",
        "There are no invoices to print"
      );

      return;
    }

    const win = window.open(
      "",
      "_blank"
    );

    if (!win) {
      toast(
        "error",
        "Popup blocked"
      );

      return;
    }

    const rows = filtered
      .map(
        (invoice) => `
          <tr>
            <td>${escapeHtml(
              invoice.number
            )}</td>

            <td>${escapeHtml(
              invoice.supplierName ||
                invoice.supplier
            )}</td>

            <td>${fmtDate(
              invoice.postingDate
            )}</td>

            <td>${fmtDate(
              invoice.dueDate
            )}</td>

            <td>${escapeHtml(
              invoice.billNo || "—"
            )}</td>

            <td style="text-align:right">
              ${escapeHtml(
                fmt(
                  invoice.grandTotal,
                  invoice.currency
                )
              )}
            </td>

            <td style="text-align:right">
              ${escapeHtml(
                fmt(
                  invoice.paidAmount,
                  invoice.currency
                )
              )}
            </td>

            <td style="text-align:right">
              ${escapeHtml(
                fmt(
                  invoice.outstandingAmount,
                  invoice.currency
                )
              )}
            </td>

            <td>${escapeHtml(
              invoice.status
            )}</td>
          </tr>
        `
      )
      .join("");

    win.document.write(`
      <!doctype html>

      <html>
        <head>
          <meta charset="UTF-8" />

          <title>
            Purchase Invoices
          </title>

          <style>
            body {
              font-family:
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

              padding: 24px;
              color: #111827;
            }

            h1 {
              font-size: 20px;
              margin:
                0 0 6px;
            }

            .meta {
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 18px;
            }

            table {
              width: 100%;
              border-collapse:
                collapse;
              font-size: 12px;
            }

            th,
            td {
              border-bottom:
                1px solid #e5e7eb;
              padding: 8px;
              text-align: left;
            }

            th {
              background:
                #f8fafc;
              font-weight: 600;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>
          <h1>
            Purchase Invoices
          </h1>

          <div class="meta">
            Generated:
            ${new Date().toLocaleString()}
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Supplier</th>
                <th>Posting Date</th>
                <th>Due Date</th>
                <th>Bill No</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    win.document.close();

    toast(
      "success",
      "Print/PDF window opened"
    );
  }

  function handlePrint() {
    handleExportPDF();
  }

  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function escapeHtml(
    value: unknown
  ) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  // ==========================================================
  // IMPORT
  // ==========================================================

  function handleImport(
    files: FileList | null
  ) {
    if (!files?.length) {
      return;
    }

    toast(
      "info",
      `Selected ${files.length} file${
        files.length > 1
          ? "s"
          : ""
      }. Import parsing is not connected yet.`
    );
  }

  // ==========================================================
  // REFRESH
  // ==========================================================

  async function handleRefresh() {
    try {
      await fetchInvoices();

      toast(
        "success",
        "Purchase Invoices refreshed"
      );
    } catch {
      toast(
        "error",
        "Failed to refresh Purchase Invoices"
      );
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

  function handleDelete(
    id: string,
    number: string
  ) {
    console.log(
      "Delete Purchase Invoice:",
      id
    );

    toast(
      "info",
      `Delete ${number} is not connected to Frappe yet`
    );
  }

  // ==========================================================
  // DUPLICATE
  // ==========================================================

  function handleDuplicate(
    id: string
  ) {
    console.log(
      "Duplicate Purchase Invoice:",
      id
    );

    toast(
      "info",
      "Duplicate action is not connected to Frappe yet"
    );
  }

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  function clearFilters() {
    setQuery("");
    setSupplier("All");
    setInvoiceStatus("All");
    setPaymentStatus("All");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      <ToastHost />

      {/* HEADER */}

      <motion.div
        initial={{
          opacity: 0,
          y: 8,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />

            Commerce · Purchase Invoices
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mt-1">
            Purchase Invoices
          </h1>

          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Manage supplier invoices,
            purchases, taxes, and
            outstanding payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setCreateOpen(true)
            }
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow hover:scale-[1.02] transition"
          >
            <Plus className="h-3.5 w-3.5" />

            Create Purchase Invoice
          </button>

          <button
            onClick={() =>
              importRef.current?.click()
            }
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition"
          >
            <Upload className="h-3.5 w-3.5" />

            Import
          </button>

          <input
            ref={importRef}
            type="file"
            multiple
            hidden
            accept=".csv,.xlsx,.xls"
            onChange={(event) => {
              handleImport(
                event.target.files
              );

              event.target.value = "";
            }}
          />

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition"
          >
            <FileDown className="h-3.5 w-3.5" />

            PDF
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />

            Excel
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl glass hover:bg-white/10 text-xs transition"
          >
            <Printer className="h-3.5 w-3.5" />

            Print
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 w-9 justify-center rounded-xl glass hover:bg-white/10 text-xs transition disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                loading &&
                  "animate-spin"
              )}
            />
          </button>
        </div>
      </motion.div>

      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <div className="font-medium">
            Failed to load Purchase
            Invoices
          </div>

          <div className="mt-1 text-xs opacity-80">
            {String(error)}
          </div>
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label:
              "Total Purchase Invoices",
            value: String(
              stats.total
            ),
            icon: FileText,
            tint:
              "from-violet-500/20 to-fuchsia-500/5",
          },

          {
            label:
              "Pending Payments",
            value: String(
              stats.pending
            ),
            icon: Clock,
            tint:
              "from-amber-500/20 to-orange-500/5",
          },

          {
            label:
              "Paid Invoices",
            value: String(
              stats.paid
            ),
            icon: Check,
            tint:
              "from-emerald-500/20 to-teal-500/5",
          },

          {
            label:
              "Total Purchase",
            value: fmt(
              stats.totalAmount
            ),
            icon: CircleDollarSign,
            tint:
              "from-cyan-500/20 to-sky-500/5",
          },

          {
            label:
              "This Month",
            value: fmt(
              stats.thisMonth
            ),
            icon: TrendingUp,
            tint:
              "from-fuchsia-500/20 to-pink-500/5",
          },

          {
            label:
              "Outstanding",
            value: fmt(
              stats.outstanding
            ),
            icon: Wallet,
            tint:
              "from-rose-500/20 to-orange-500/5",
          },
        ].map(
          (stat, index) => (
            <motion.div
              key={stat.label}
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  0.03 * index,
              }}
              className="relative overflow-hidden rounded-2xl glass-strong border border-white/[0.08] p-4"
            >
              <div
                className={cn(
                  "pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl bg-gradient-to-br",
                  stat.tint
                )}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {stat.label}
                  </div>

                  <div className="mt-1.5 font-display text-xl font-semibold">
                    {stat.value}
                  </div>
                </div>

                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <stat.icon className="h-4 w-4 text-primary" />
                </span>
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* TOOLBAR */}

      <div className="rounded-2xl glass-strong border border-white/[0.08] p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search invoice #, supplier or bill #"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition"
          />
        </div>

        {/* SUPPLIER */}

        <select
          value={supplier}
          onChange={(event) =>
            setSupplier(
              event.target.value
            )
          }
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
        >
          <option value="All">
            All Suppliers
          </option>

          {suppliers.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        {/* INVOICE STATUS */}

        <select
          value={invoiceStatus}
          onChange={(event) =>
            setInvoiceStatus(
              event.target.value
            )
          }
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
        >
          <option value="All">
            All Status
          </option>

          {invoiceStatuses.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
        </select>

        {/* PAYMENT STATUS */}

        <select
          value={paymentStatus}
          onChange={(event) =>
            setPaymentStatus(
              event.target.value
            )
          }
          className="h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none"
        >
          <option value="All">
            All Payment
          </option>

          {[
            "Paid",
            "Partially Paid",
            "Pending",
            "Unpaid",
            "Overdue",
          ].map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            )
          )}
        </select>

        <button
          onClick={() =>
            setShowFilters(
              (value) => !value
            )
          }
          className={cn(
            "inline-flex items-center gap-1.5 h-10 px-3 rounded-xl glass hover:bg-white/10 text-xs",
            showFilters &&
              "bg-white/10"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />

          More filters
        </button>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl glass hover:bg-white/10 text-xs"
        >
          <Download className="h-3.5 w-3.5" />

          Export
        </button>
      </div>

      {/* MORE FILTERS */}

      <AnimatePresence initial={false}>
        {showFilters && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl glass-strong border border-white/[0.08] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FieldDate
                label="Posting date from"
                value={dateFrom}
                onChange={setDateFrom}
              />

              <FieldDate
                label="Posting date to"
                value={dateTo}
                onChange={setDateTo}
              />

              <FieldNum
                label="Amount min"
                value={amountMin}
                onChange={setAmountMin}
              />

              <FieldNum
                label="Amount max"
                value={amountMax}
                onChange={setAmountMax}
              />

              <div className="sm:col-span-2 lg:col-span-4 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Showing{" "}
                  <span className="text-foreground font-medium">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-foreground font-medium">
                    {invoices.length}
                  </span>{" "}
                  invoices
                </div>

                <button
                  onClick={clearFilters}
                  className="h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING */}

      {loading && invoices.length === 0 && (
        <div className="rounded-2xl glass-strong border border-white/[0.08] px-4 py-16 text-center">
          <RefreshCw className="h-5 w-5 mx-auto mb-3 animate-spin text-primary" />

          <div className="text-sm text-muted-foreground">
            Loading Purchase
            Invoices...
          </div>
        </div>
      )}

      {/* TABLE */}

      {(!loading ||
        invoices.length > 0) && (
        <div className="rounded-2xl glass-strong border border-white/[0.08] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1250px]">
              <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 bg-white/[0.02]">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    Invoice #
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Supplier
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Posting Date
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Due Date
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Bill No
                  </th>

                  <th className="px-4 py-3 font-medium text-right">
                    Total
                  </th>

                  <th className="px-4 py-3 font-medium text-right">
                    Paid
                  </th>

                  <th className="px-4 py-3 font-medium text-right">
                    Outstanding
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Status
                  </th>

                  <th className="px-4 py-3 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                <AnimatePresence>
                  {filtered.map(
                    (
                      invoice,
                      index
                    ) => (
                      <motion.tr
                        key={
                          invoice.id
                        }
                        initial={{
                          opacity: 0,
                          y: 6,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        transition={{
                          delay:
                            index *
                            0.015,
                        }}
                        className="border-t border-white/[0.05] hover:bg-white/[0.03] transition group"
                      >
                        {/* INVOICE */}

                        <td className="px-4 py-3">
                          <Link
                            to="/dashboard/purchase-invoices/$id"
                            params={{
                              id: invoice.id,
                            }}
                            className="font-medium text-foreground hover:text-primary transition"
                          >
                            {
                              invoice.number
                            }
                          </Link>
                        </td>

                        {/* SUPPLIER */}

                        <td className="px-4 py-3">
                          <div>
                            <div>
                              {invoice.supplierName ||
                                invoice.supplier}
                            </div>

                            {invoice.supplierName &&
                              invoice.supplierName !==
                                invoice.supplier && (
                                <div className="text-[11px] text-muted-foreground mt-0.5">
                                  {
                                    invoice.supplier
                                  }
                                </div>
                              )}
                          </div>
                        </td>

                        {/* POSTING DATE */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(
                            invoice.postingDate
                          )}
                        </td>

                        {/* DUE DATE */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {fmtDate(
                            invoice.dueDate
                          )}
                        </td>

                        {/* BILL */}

                        <td className="px-4 py-3 text-muted-foreground">
                          {invoice.billNo ||
                            "—"}
                        </td>

                        {/* TOTAL */}

                        <td className="px-4 py-3 text-right font-medium">
                          {fmt(
                            invoice.grandTotal,
                            invoice.currency
                          )}
                        </td>

                        {/* PAID */}

                        <td className="px-4 py-3 text-right text-emerald-300">
                          {fmt(
                            invoice.paidAmount,
                            invoice.currency
                          )}
                        </td>

                        {/* OUTSTANDING */}

                        <td className="px-4 py-3 text-right text-amber-200">
                          {fmt(
                            invoice.outstandingAmount,
                            invoice.currency
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-4 py-3">
                          <StatusPill
                            label={
                              invoice.status
                            }
                          />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-4 py-3 text-right">
                          <InvoiceRowMenu
                            open={
                              menuFor ===
                              invoice.id
                            }
                            onOpenChange={(
                              value
                            ) =>
                              setMenuFor(
                                value
                                  ? invoice.id
                                  : null
                              )
                            }
                            items={[
                              {
                                icon: Eye,
                                label:
                                  "View",
                                fn: () => {
                                  setMenuFor(
                                    null
                                  );

                                  navigate({
                                    to: "/dashboard/purchase-invoices/$id",
                                    params: {
                                      id: invoice.id,
                                    },
                                  });
                                },
                              },

                              {
                                icon: Pencil,
                                label:
                                  "Edit",
                                fn: () => {
                                  setMenuFor(
                                    null
                                  );
                                  setEditingInvoice(invoice);
                                },
                              },

                              {
                                icon: Copy,
                                label:
                                  "Duplicate",
                                fn: () => {
                                  handleDuplicate(
                                    invoice.id
                                  );

                                  setMenuFor(
                                    null
                                  );
                                },
                              },

                              {
                                icon: Printer,
                                label:
                                  "Print",
                                fn: () => {
                                  setMenuFor(
                                    null
                                  );

                                  handlePrint();
                                },
                              },

                              {
                                icon: FileDown,
                                label:
                                  "Download PDF",
                                fn: () => {
                                  setMenuFor(
                                    null
                                  );

                                  handleExportPDF();
                                },
                              },

                              {
                                icon: Trash2,
                                label:
                                  "Delete",
                                danger:
                                  true,
                                fn: () => {
                                  setMenuFor(
                                    null
                                  );

                                  handleDelete(
                                    invoice.id,
                                    invoice.number
                                  );
                                },
                              },
                            ]}
                          />
                        </td>
                      </motion.tr>
                    )
                  )}
                </AnimatePresence>

                {/* EMPTY */}

                {!loading &&
                  filtered.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-16 text-center"
                      >
                        <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />

                        <div className="text-sm text-muted-foreground">
                          No Purchase
                          Invoices
                          match your
                          filters.
                        </div>

                        {(query ||
                          supplier !==
                            "All" ||
                          invoiceStatus !==
                            "All" ||
                          paymentStatus !==
                            "All" ||
                          dateFrom ||
                          dateTo ||
                          amountMin ||
                          amountMax) && (
                          <button
                            onClick={
                              clearFilters
                            }
                            className="mt-3 text-xs text-primary hover:underline"
                          >
                            Clear
                            filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}

      <CreatePurchaseInvoiceModal
        open={createOpen || !!editingInvoice}
        onClose={() =>
          {
            setCreateOpen(false);
            setEditingInvoice(null);
          }
        }
        add={add}
        update={updatePurchaseInvoice}
        initialInvoice={editingInvoice}
        onCreated={async (number) => {
          toast(
            "success",
            `Invoice ${number} created`
          );

          try {
            await fetchInvoices();
          } catch (error) {
            console.error(
              "Failed to refresh after creation:",
              error
            );
          }

          setEditingInvoice(null);
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

// ============================================================
// ROW MENU
// ============================================================

type MenuItem = {
  icon: React.ElementType;
  label: string;
  fn: () => void;
  danger?: boolean;
};

function InvoiceRowMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (
    value: boolean
  ) => void;
  items: MenuItem[];
}) {
  const btnRef =
    useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() =>
          onOpenChange(!open)
        }
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
        aria-label="Invoice actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      <FloatingLayer
        open={open}
        onClose={() =>
          onOpenChange(false)
        }
        anchorRef={btnRef}
        align="end"
        className="w-44 p-1 text-left"
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.fn}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-white/5 transition",
              item.danger &&
                "text-rose-300 hover:bg-rose-500/10"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />

            {item.label}
          </button>
        ))}
      </FloatingLayer>
    </>
  );
}

// ============================================================
// FILTER FIELDS
// ============================================================

function FieldDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">
        {label}
      </span>

      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />

        <input
          type="date"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
        />
      </div>
    </label>
  );
}

function FieldNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-1">
        {label}
      </span>

      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder="0.00"
        className="w-full h-9 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40"
      />
    </label>
  );
}

// ============================================================
// CREATE MODAL
// ============================================================

type CreateForm = {
  supplier: string;
  supplierName: string;
  number: string;
  postingDate: string;
  dueDate: string;
  billNo: string;
  billDate: string;
  company: string;
  currency: string;
  warehouse: string;
  paymentTerms: string;
  remarks: string;
  terms: string;
};

function getToday() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function createInvoiceNumber() {
  return `PINV-${Math.floor(
    Math.random() * 90000 + 10000
  )}`;
}

function defaultForm(): CreateForm {
  const today = getToday();

  return {
    supplier: "",
    supplierName: "",
    number: createInvoiceNumber(),
    postingDate: today,
    dueDate: today,
    billNo: "",
    billDate: today,
    company: "",
    currency: "PKR",
    warehouse: "",
    paymentTerms: "",
    remarks: "",
    terms: "",
  };
}

function emptyLine(): PurchaseInvoiceLine {
  return {
    id: Math.random()
      .toString(36)
      .slice(2, 10),

    product: "",
    sku: "",
    description: "",
    qty: 1,
    unit: "Nos",
    cost: 0,
    discount: 0,
    amount: 0,
  };
}

function CreatePurchaseInvoiceModal({
  open,
  onClose,
  onCreated,
  add,
  update,
  initialInvoice,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (
    number: string
  ) => void | Promise<void>;
  add: (invoice: any) => any;
  update: (
    invoiceName: string,
    invoice: any
  ) => any;
  initialInvoice: PurchaseInvoice | null;
}) {
  const [
    form,
    setForm,
  ] = useState<CreateForm>(
    defaultForm
  );

  const [
    lines,
    setLines,
  ] = useState<
    PurchaseInvoiceLine[]
  >([
    emptyLine(),
  ]);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const submitted =
    initialInvoice?.docstatus === 1;

  // ==========================================================
  // RESET
  // ==========================================================

  function resetForm() {
    setForm(defaultForm());
    setLines([emptyLine()]);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialInvoice) {
      resetForm();
      return;
    }

    setForm({
      supplier: initialInvoice.supplier,
      supplierName: initialInvoice.supplierName || "",
      number: initialInvoice.number,
      postingDate: initialInvoice.postingDate || getToday(),
      dueDate: initialInvoice.dueDate || getToday(),
      billNo: initialInvoice.billNo || "",
      billDate: initialInvoice.billDate || "",
      company: initialInvoice.company || "",
      currency: initialInvoice.currency || "PKR",
      warehouse: initialInvoice.warehouse || "",
      paymentTerms: initialInvoice.paymentTerms || "",
      remarks: initialInvoice.remarks || "",
      terms: initialInvoice.terms || "",
    });
    setLines(
      initialInvoice.lines.length > 0
        ? initialInvoice.lines.map((line) => ({ ...line }))
        : [emptyLine()],
    );
  }, [open, initialInvoice]);

  // ==========================================================
  // TOTALS
  // ==========================================================

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          Number(
            line.qty || 0
          ) *
            Number(
              line.cost || 0
            ),
        0
      ),
    [lines]
  );

  const discount = useMemo(
    () =>
      lines.reduce(
        (sum, line) => {
          const amount =
            Number(
              line.qty || 0
            ) *
            Number(
              line.cost || 0
            );

          return (
            sum +
            amount *
              (Number(
                line.discount || 0
              ) /
                100)
          );
        },
        0
      ),
    [lines]
  );

  const taxable =
    Math.max(
      0,
      subtotal - discount
    );

  // Current UI keeps the existing 5% tax logic.
  // For actual ERPNext accounting, this should
  // eventually come from the Frappe Taxes table/template.
  const tax = taxable * 0.05;

  const grand =
    taxable + tax;

  // ==========================================================
  // LINE UPDATE
  // ==========================================================

  function updateLine(
    index: number,
    patch: Partial<PurchaseInvoiceLine>
  ) {
    setLines((current) =>
      current.map(
        (line, lineIndex) =>
          lineIndex === index
            ? {
                ...line,
                ...patch,
              }
            : line
      )
    );
  }

  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function submit() {
    if (submitting) {
      return;
    }

    if (!form.supplier.trim()) {
      toast(
        "error",
        "Supplier is required"
      );

      return;
    }

    if (!form.number.trim()) {
      toast(
        "error",
        "Invoice number is required"
      );

      return;
    }

    if (!form.company.trim()) {
      toast(
        "error",
        "Company is required"
      );

      return;
    }

    const validLines =
      lines.filter(
        (line) =>
          String(
            line.product ||
              line.sku ||
              ""
          ).trim()
      );

    if (!validLines.length) {
      toast(
        "error",
        "Add at least one item"
      );

      return;
    }

    for (
      let index = 0;
      index < validLines.length;
      index++
    ) {
      const line =
        validLines[index];

      if (
        Number(line.qty || 0) <=
        0
      ) {
        toast(
          "error",
          `Item row ${
            index + 1
          }: quantity must be greater than 0`
        );

        return;
      }

      if (
        Number(line.cost || 0) <
        0
      ) {
        toast(
          "error",
          `Item row ${
            index + 1
          }: rate cannot be negative`
        );

        return;
      }
    }

    setSubmitting(true);

    try {
      const invoiceLines =
        validLines.map(
          (line) => {
            const qty = Number(
              line.qty || 0
            );

            const cost = Number(
              line.cost || 0
            );

            const discountPercent =
              Number(
                line.discount || 0
              );

            const amount =
              qty *
              cost *
              (1 -
                discountPercent /
                  100);

            return {
              ...line,
              qty,
              cost,
              discount:
                discountPercent,
              amount,
            };
          }
        );

      const payload = {
          number:
            form.number.trim(),

          supplier:
            form.supplier.trim(),

          supplierName:
            form.supplierName.trim() ||
            form.supplier.trim(),

          company:
            form.company.trim(),

          currency:
            form.currency.trim() ||
            "PKR",

          postingDate:
            form.postingDate,

          dueDate:
            form.dueDate,

          billNo:
            form.billNo.trim() ||
            undefined,

          billDate:
            form.billDate ||
            undefined,

          paymentTerms:
            form.paymentTerms.trim() ||
            undefined,

          warehouse:
            form.warehouse.trim(),

          netTotal:
            taxable,

          totalTaxes:
            tax,

          discountAmount:
            discount,

          grandTotal:
            grand,

          roundedTotal:
            Math.round(grand),

          outstandingAmount:
            grand,

          paidAmount:
            0,

          taxRate: 5,

          status:
            "Draft",

          docstatus:
            initialInvoice?.docstatus,

          paymentStatus:
            "Pending",

          isReturn:
            initialInvoice?.isReturn ?? false,

          updateStock:
            initialInvoice?.updateStock ?? false,

          remarks:
            form.remarks.trim() ||
            undefined,

          terms:
            form.terms.trim() ||
            undefined,

          lines:
            invoiceLines,

          payments: [],
        };

      const created = await Promise.resolve(
        initialInvoice
          ? update(initialInvoice.id, payload)
          : add(payload)
      );

      const createdNumber =
        created?.number ||
        form.number;

      await onCreated(
        createdNumber
      );

      resetForm();

      onClose();
    } catch (error) {
      console.error(
        "Failed to create Purchase Invoice:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to create Purchase Invoice";

      toast(
        "error",
        message
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ==========================================================
  // MODAL
  // ==========================================================

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-xl"
            onClick={() => {
              if (!submitting) {
                onClose();
              }
            }}
          />

          {/* MODAL */}

          <motion.div
            initial={{
              opacity: 0,
              y: 24,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 24,
              scale: 0.98,
            }}
            className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-3 md:p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl glass-strong border border-white/10 shadow-glow flex flex-col">
              {/* HEADER */}

              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    {initialInvoice ? "Edit" : "New"}
                  </div>

                  <div className="font-display text-lg font-semibold">
                    {initialInvoice
                      ? "Edit Purchase Invoice"
                      : "Create Purchase Invoice"}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (
                      !submitting
                    ) {
                      onClose();
                    }
                  }}
                  disabled={submitting}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/5 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* BODY */}

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* HEADER FIELDS */}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Field label="Supplier">
                    <input
                      value={
                        form.supplier
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            supplier:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Supplier ID"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Supplier Name">
                    <input
                      value={
                        form.supplierName
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            supplierName:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Supplier name"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Invoice Number">
                    <input
                      value={
                        form.number
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            number:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Posting Date">
                    <input
                      type="date"
                      value={
                        form.postingDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            postingDate:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Due Date">
                    <input
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            dueDate:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Bill No">
                    <input
                      value={
                        form.billNo
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            billNo:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Supplier bill number"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Bill Date">
                    <input
                      type="date"
                      value={
                        form.billDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            billDate:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Company">
                    <input
                      value={
                        form.company
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            company:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Company"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Currency">
                    <input
                      value={
                        form.currency
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            currency:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Warehouse">
                    <input
                      value={
                        form.warehouse
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            warehouse:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Warehouse"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Payment Terms">
                    <input
                      value={
                        form.paymentTerms
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            paymentTerms:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Payment terms"
                      className={
                        inputCls
                      }
                    />
                  </Field>

                  <Field label="Remarks">
                    <input
                      value={
                        form.remarks
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,
                            remarks:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      placeholder="Remarks"
                      className={
                        inputCls
                      }
                    />
                  </Field>
                </div>

                {/* ITEMS */}

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <div className="text-sm font-medium">
                      Items
                    </div>

                    {submitted && (
                      <div className="text-[11px] text-amber-200/80">
                        Saving creates an amended draft; the submitted invoice stays unchanged.
                      </div>
                    )}

                    <button
                      onClick={() =>
                        setLines(
                          (
                            current
                          ) => [
                            ...current,
                            emptyLine(),
                          ]
                        )
                      }
                      disabled={
                        submitting
                      }
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg glass hover:bg-white/10 text-xs disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />

                      Add row
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[1100px]">
                      <thead className="text-left text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
                        <tr>
                          {[
                            "Item",
                            "Description",
                            "Qty",
                            "UOM",
                            "Rate",
                            "Discount %",
                            "Amount",
                            "",
                          ].map(
                            (
                              heading
                            ) => (
                              <th
                                key={
                                  heading
                                }
                                className="px-3 py-2 font-medium"
                              >
                                {
                                  heading
                                }
                              </th>
                            )
                          )}
                        </tr>
                      </thead>

                      <tbody>
                        {lines.map(
                          (
                            line,
                            index
                          ) => {
                            const base =
                              Number(
                                line.qty ||
                                  0
                              ) *
                              Number(
                                line.cost ||
                                  0
                              );

                            const amount =
                              base *
                              (1 -
                                Number(
                                  line.discount ||
                                    0
                                ) /
                                  100);

                            return (
                              <tr
                                key={
                                  line.id
                                }
                                className="border-t border-white/[0.05]"
                              >
                                {/* ITEM */}

                                <td className="px-2 py-2">
                                  <input
                                    value={
                                      line.sku ||
                                      ""
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          sku: event
                                            .target
                                            .value,

                                          product:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="Item code"
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* DESCRIPTION */}

                                <td className="px-2 py-2">
                                  <input
                                    value={line.description}
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          description:
                                            event
                                              .target
                                              .value,

                                          product:
                                            line.product ||
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    placeholder="Description"
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* QTY */}

                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      line.qty
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          qty:
                                            Number(
                                              event
                                                .target
                                                .value
                                            ),
                                        }
                                      )
                                    }
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* UOM */}

                                <td className="px-2 py-2">
                                  <input
                                    value={
                                      line.unit
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          unit:
                                            event
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* RATE */}

                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                      line.cost
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          cost:
                                            Number(
                                              event
                                                .target
                                                .value
                                            ),
                                        }
                                      )
                                    }
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* DISCOUNT */}

                                <td className="px-2 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      line.discount
                                    }
                                    onChange={(
                                      event
                                    ) =>
                                      updateLine(
                                        index,
                                        {
                                          discount:
                                            Math.min(
                                              100,
                                              Math.max(
                                                0,
                                                Number(
                                                  event
                                                    .target
                                                    .value
                                                )
                                              )
                                            ),
                                        }
                                      )
                                    }
                                    className={
                                      rowInput
                                    }
                                  />
                                </td>

                                {/* AMOUNT */}

                                <td className="px-2 py-2 text-right font-medium">
                                  {fmt(
                                    amount,
                                    form.currency
                                  )}
                                </td>

                                {/* ACTIONS */}

                                <td className="px-2 py-2 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      if (
                                        lines.length ===
                                        1
                                      ) {
                                        setLines([
                                          emptyLine(),
                                        ]);

                                        return;
                                      }

                                      setLines(
                                        (
                                          current
                                        ) =>
                                          current.filter(
                                            (
                                              _,
                                              lineIndex
                                            ) =>
                                              lineIndex !==
                                              index
                                          )
                                      );
                                    }}
                                    disabled={
                                      submitting ||
                                      submitting
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-500/10 text-rose-300 disabled:opacity-50"
                                    title="Remove row"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      setLines(
                                        (
                                          current
                                        ) => [
                                          ...current.slice(
                                            0,
                                            index +
                                              1
                                          ),

                                          {
                                            ...line,
                                            id:
                                              Math.random()
                                                .toString(
                                                  36
                                                )
                                                .slice(
                                                  2,
                                                  10
                                                ),
                                          },

                                          ...current.slice(
                                            index +
                                              1
                                          ),
                                        ]
                                      )
                                    }
                                    disabled={
                                      submitting ||
                                      submitting
                                    }
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10 disabled:opacity-50"
                                    title="Duplicate row"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SUMMARY */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* ADDITIONAL */}

                  <div className="rounded-xl border border-white/[0.08] p-4 space-y-3">
                    <div className="text-sm font-medium">
                      Additional
                      Information
                    </div>

                    <Field label="Terms & Conditions">
                      <textarea
                        value={
                          form.terms
                        }
                        onChange={(
                          event
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,
                              terms:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                        rows={5}
                        placeholder="Terms and conditions"
                        className={`${inputCls} h-auto py-3 resize-none`}
                      />
                    </Field>
                  </div>

                  {/* SUMMARY */}

                  <div className="rounded-xl border border-white/[0.08] p-4 bg-white/[0.02]">
                    <div className="text-sm font-medium mb-2">
                      Summary
                    </div>

                    <SummaryRow
                      label="Subtotal"
                      value={fmt(
                        subtotal,
                        form.currency
                      )}
                    />

                    <SummaryRow
                      label="Discount"
                      value={
                        "− " +
                        fmt(
                          discount,
                          form.currency
                        )
                      }
                    />

                    <SummaryRow
                      label="Tax (5%)"
                      value={fmt(
                        tax,
                        form.currency
                      )}
                    />

                    <div className="border-t border-white/[0.06] my-2" />

                    <SummaryRow
                      label="Grand Total"
                      value={fmt(
                        grand,
                        form.currency
                      )}
                      bold
                    />

                    <SummaryRow
                      label="Paid"
                      value={fmt(
                        0,
                        form.currency
                      )}
                    />

                    <SummaryRow
                      label="Outstanding"
                      value={fmt(
                        grand,
                        form.currency
                      )}
                      accent
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}

              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                <button
                  onClick={onClose}
                  disabled={
                    submitting
                  }
                  className="h-9 px-4 rounded-xl glass hover:bg-white/10 text-xs disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={submit}
                  disabled={
                    submitting
                  }
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary-gradient text-primary-foreground text-xs font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />

                      {initialInvoice
                        ? "Saving..."
                        : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />

                      {initialInvoice
                        ? "Save Changes"
                        : "Create Invoice"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// FORM COMPONENTS
// ============================================================

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 focus:shadow-glow transition";

const rowInput =
  "w-full h-9 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm outline-none focus:border-primary/40 transition";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-medium text-muted-foreground mb-1.5">
        {label}
      </span>

      {children}
    </label>
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
      className={cn(
        "flex items-center justify-between py-1 text-sm",
        bold && "font-semibold",
        accent && "text-amber-200"
      )}
    >
      <span className="text-muted-foreground">
        {label}
      </span>

      <span>{value}</span>
    </div>
  );
}