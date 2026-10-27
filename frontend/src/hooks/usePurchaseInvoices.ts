import { useCallback, useState } from "react";

// ============================================================
// TYPES
// ============================================================

export type PurchaseInvoicePaymentStatus =
  | "Paid"
  | "Partially Paid"
  | "Pending"
  | "Overdue";

export type PurchaseInvoiceLine = {
  id: string;
  childName?: string;
  product: string;
  sku: string;
  itemGroup?: string;
  description: string;
  qty: number;
  unit: string;
  stockUom?: string;
  conversionFactor?: number;
  cost: number;
  discount: number;
  amount: number;
};

export type PurchaseInvoice = {
  id: string;
  number: string;

  supplier: string;
  supplierName?: string;

  company?: string;
  currency: string;

  postingDate?: string;
  dueDate?: string;

  billNo?: string;
  billDate?: string;

  netTotal: number;
  totalTaxes: number;
  discountAmount: number;

  grandTotal: number;
  roundedTotal: number;

  paidAmount: number;
  outstandingAmount: number;

  taxRate: number;

  status: string;
  docstatus?: number;
  paymentStatus: PurchaseInvoicePaymentStatus;

  isReturn: boolean;
  updateStock: boolean;

  warehouse?: string;
  paymentTerms?: string;

  remarks?: string;
  terms?: string;

  lines: PurchaseInvoiceLine[];
  payments: unknown[];
};

// ============================================================
// FRAPPE TYPES
// ============================================================

type FrappePurchaseInvoice = {
  name: string;

  supplier?: string;
  supplier_name?: string;

  company?: string;
  currency?: string;

  posting_date?: string;
  due_date?: string;

  bill_no?: string;
  bill_date?: string;

  net_total?: number;
  total_taxes_and_charges?: number;
  discount_amount?: number;

  grand_total?: number;
  rounded_total?: number;

  paid_amount?: number;
  outstanding_amount?: number;

  status?: string;
  docstatus?: number;

  is_return?: number;
  update_stock?: number;

  set_warehouse?: string;

  payment_terms_template?: string;

  remarks?: string;
  terms?: string;

  items?: FrappePurchaseInvoiceItem[];

  payments?: FrappePaymentReference[];
};

type FrappePurchaseInvoiceItem = {
  name?: string;
  doctype?: string;
  parent?: string;
  parenttype?: string;
  parentfield?: string;

  item_code?: string;
  item_name?: string;
  item_group?: string;

  description?: string;

  qty?: number;

  uom?: string;
  stock_uom?: string;
  conversion_factor?: number;

  rate?: number;
  base_rate?: number;

  discount_percentage?: number;

  amount?: number;
  base_amount?: number;
  stock_qty?: number;

  warehouse?: string;
};

type FrappePaymentReference = {
  name?: string;
  payment_entry?: string;
  amount?: number;
  allocated_amount?: number;
};

type FrappeResponse<T> = {
  data: T;
};

type FrappeListResponse<T> = {
  data: T[];
};

// ============================================================
// API HELPERS
// ============================================================

function getApiUrl(): string {
  return "/api";
}

function getHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };
}

// ============================================================
// GENERIC FRAPPE FETCH
// ============================================================

async function frappeFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,

    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },

    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "";

    try {
      const errorData = await response.json();

      const details = errorData?.details;
      const raw = details?.raw;

      errorMessage =
        details?.exception ||
        details?.exc ||
        errorData?.exception ||
        errorData?.exc ||
        raw?.exception ||
        errorData?.message ||
        JSON.stringify(errorData);
    } catch {
      try {
        errorMessage =
          await response.text();
      } catch {
        errorMessage = "";
      }
    }

    throw new Error(
      `Frappe API request failed (${response.status})${
        errorMessage
          ? `: ${errorMessage}`
          : ""
      }`,
    );
  }

  return (await response.json()) as T;
}

// ============================================================
// HELPERS
// ============================================================

function toNumber(
  value: unknown,
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function roundNumber(
  value: number,
  decimals = 2,
): number {
  const factor =
    10 ** decimals;

  return (
    Math.round(
      (value + Number.EPSILON) *
        factor,
    ) / factor
  );
}

// ============================================================
// PAYMENT STATUS
// ============================================================

function getPaymentStatus(
  invoice: FrappePurchaseInvoice,
): PurchaseInvoicePaymentStatus {
  const grandTotal =
    toNumber(invoice.grand_total);

  const outstanding =
    toNumber(
      invoice.outstanding_amount,
    );

  // Fully paid
  if (
    grandTotal > 0 &&
    outstanding <= 0.01
  ) {
    return "Paid";
  }

  // Partially paid
  if (
    grandTotal > 0 &&
    outstanding > 0.01 &&
    outstanding < grandTotal
  ) {
    return "Partially Paid";
  }

  // Overdue
  if (
    invoice.due_date &&
    outstanding > 0.01
  ) {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    const due =
      new Date(
        `${invoice.due_date}T00:00:00`,
      );

    if (
      !Number.isNaN(
        due.getTime(),
      ) &&
      due < today
    ) {
      return "Overdue";
    }
  }

  return "Pending";
}

// ============================================================
// DOCUMENT STATUS
// ============================================================

function getStatus(
  invoice: FrappePurchaseInvoice,
): string {
  if (invoice.status) {
    return invoice.status;
  }

  switch (invoice.docstatus) {
    case 0:
      return "Draft";

    case 1:
      return "Submitted";

    case 2:
      return "Cancelled";

    default:
      return "Draft";
  }
}

// ============================================================
// MAP ITEM
// ============================================================

function mapItem(
  item: FrappePurchaseInvoiceItem,
  index: number,
): PurchaseInvoiceLine {
  const qty =
    toNumber(item.qty);

  const rate =
    toNumber(item.rate);

  const discount =
    toNumber(
      item.discount_percentage,
    );

  const baseAmount =
    qty * rate;

  const calculatedAmount =
    baseAmount *
    (1 - discount / 100);

  const amount =
    item.amount !== undefined
      ? toNumber(item.amount)
      : calculatedAmount;

  return {
    id:
      item.name ||
      `${index}-${item.item_code || "item"}`,

    childName:
      item.name,

    product:
      item.item_name ||
      item.item_code ||
      "",

    sku:
      item.item_code ||
      "",

    itemGroup:
      item.item_group,

    description:
      item.description ??
      "",

    qty,

    unit:
      item.uom ||
      item.stock_uom ||
      "Nos",

    stockUom:
      item.stock_uom ||
      item.uom ||
      "Nos",

    conversionFactor:
      toNumber(item.conversion_factor) ||
      1,

    cost: rate,

    discount,

    amount:
      roundNumber(amount),
  };
}

// ============================================================
// MAP INVOICE
// ============================================================

function mapInvoice(
  invoice: FrappePurchaseInvoice,
): PurchaseInvoice {
  const netTotal =
    toNumber(invoice.net_total);

  const totalTaxes =
    toNumber(
      invoice.total_taxes_and_charges,
    );

  const discountAmount =
    toNumber(
      invoice.discount_amount,
    );

  const grandTotal =
    toNumber(
      invoice.grand_total,
    );

  const paidAmount =
    toNumber(
      invoice.paid_amount,
    );

  const outstandingAmount =
    toNumber(
      invoice.outstanding_amount,
    );

  const roundedTotal =
    toNumber(
      invoice.rounded_total,
    ) || grandTotal;

  const lines =
    (invoice.items || []).map(
      mapItem,
    );

  // Calculate tax percentage
  // against net total.
  const taxRate =
    netTotal > 0
      ? roundNumber(
          (totalTaxes /
            netTotal) *
            100,
        )
      : 0;

  return {
    id: invoice.name,

    number: invoice.name,

    supplier:
      invoice.supplier ||
      "",

    supplierName:
      invoice.supplier_name ||
      invoice.supplier ||
      "",

    company:
      invoice.company ||
      "",

    currency:
      invoice.currency ||
      "PKR",

    postingDate:
      invoice.posting_date,

    dueDate:
      invoice.due_date,

    billNo:
      invoice.bill_no,

    billDate:
      invoice.bill_date,

    netTotal,

    totalTaxes,

    discountAmount,

    grandTotal,

    roundedTotal,

    paidAmount,

    outstandingAmount,

    taxRate,

    status:
      getStatus(invoice),

    docstatus:
      invoice.docstatus,

    paymentStatus:
      getPaymentStatus(
        invoice,
      ),

    isReturn:
      Boolean(
        invoice.is_return,
      ),

    updateStock:
      Boolean(
        invoice.update_stock,
      ),

    warehouse:
      invoice.set_warehouse,

    paymentTerms:
      invoice.payment_terms_template,

    remarks:
      invoice.remarks,

    terms:
      invoice.terms,

    lines,

    payments:
      invoice.payments || [],
  };
}

// ============================================================
// BUILD FRAPPE PAYLOAD
// ============================================================

function buildPurchaseInvoicePayload(
  invoice: Partial<PurchaseInvoice>,
  includeChildMetadata = true,
) {
  const items =
    (invoice.lines || [])
      .filter(
        (line) =>
          Number(line.qty || 0) >
          0,
      )
      .map((line) => ({
        ...(() => {
          const qty = Number(line.qty || 0);
          const rate = Number(line.cost || 0);
          const discount = Number(line.discount || 0);
          const conversionFactor = Number(line.conversionFactor || 1);
          const amount = qty * rate * (1 - discount / 100);
          const stockQty = qty * conversionFactor;

          return {
            qty,
            rate,
            conversion_factor: conversionFactor,
            stock_qty: stockQty,
            amount,
            base_rate: rate,
            base_amount: amount,
          };
        })(),
        item_code:
          line.sku ||
          line.product,

        item_name:
          line.product ||
          undefined,

        ...(line.itemGroup
          ? { item_group: line.itemGroup }
          : {}),

        ...(line.description
          ? { description: line.description }
          : {}),

        uom:
          line.unit ||
          "Nos",

        discount_percentage:
          Number(
            line.discount || 0,
          ),

        warehouse:
          invoice.warehouse ||
          undefined,

        ...(includeChildMetadata && line.childName
          ? {
              name: line.childName,
              doctype: "Purchase Invoice Item",
              parent: invoice.id,
              parenttype: "Purchase Invoice",
              parentfield: "items",
            }
          : {}),
      }));

  return {
    supplier:
      invoice.supplier,

    company:
      invoice.company,

    currency:
      invoice.currency ||
      "PKR",

    posting_date:
      invoice.postingDate ||
      undefined,

    due_date:
      invoice.dueDate ||
      undefined,

    bill_no:
      invoice.billNo ||
      undefined,

    bill_date:
      invoice.billDate ||
      undefined,

    payment_terms_template:
      invoice.paymentTerms ||
      undefined,

    set_warehouse:
      invoice.warehouse ||
      undefined,

    remarks:
      invoice.remarks ||
      undefined,

    terms:
      invoice.terms ||
      undefined,

    is_return:
      invoice.isReturn
        ? 1
        : 0,

    update_stock:
      invoice.updateStock
        ? 1
        : 0,

    items,
  };
}

// ============================================================
// HOOK
// ============================================================

export function usePurchaseInvoices() {
  const [
    invoices,
    setInvoices,
  ] =
    useState<PurchaseInvoice[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  // ==========================================================
  // FETCH INVOICES
  // ==========================================================

  const fetchInvoices =
    useCallback(
      async (): Promise<
        PurchaseInvoice[]
      > => {
        console.log("=== fetchInvoices CALLED ===");
        setLoading(true);
        setError(null);

        try {
          const fields = [
            "name",
            "supplier",
            "supplier_name",
            "company",
            "currency",
            "posting_date",
            "due_date",
            "bill_no",
            "bill_date",
            "net_total",
            "total_taxes_and_charges",
            "discount_amount",
            "grand_total",
            "rounded_total",
            "paid_amount",
            "outstanding_amount",
            "status",
            "docstatus",
            "is_return",
            "update_stock",
            "set_warehouse",
            "payment_terms_template",
            "remarks",
            "terms",
          ];

          const params =
            new URLSearchParams();

          params.set(
            "fields",
            JSON.stringify(
              fields,
            ),
          );

          params.set(
            "order_by",
            "posting_date desc, creation desc",
          );

          params.set(
            "limit_page_length",
            "500",
          );

          const url =
            `${getApiUrl()}/resource/Purchase%20Invoice?${params.toString()}`;

          const result =
            await frappeFetch<
              FrappeListResponse<FrappePurchaseInvoice>
            >(url);

          const basicInvoices =
            result.data || [];

          /*
           * Fetch full documents so
           * items are available.
           *
           * Requests are processed
           * in batches.
           */

          const batchSize =
            10;

          const detailedInvoices: FrappePurchaseInvoice[] =
            [];

          for (
            let i = 0;
            i <
            basicInvoices.length;
            i += batchSize
          ) {
            const batch =
              basicInvoices.slice(
                i,
                i + batchSize,
              );

            const results =
              await Promise.all(
                batch.map(
                  async (
                    invoice,
                  ) => {
                    try {
                      const detailUrl =
                        `${getApiUrl()}/resource/Purchase%20Invoice/${encodeURIComponent(
                          invoice.name,
                        )}`;

                      const detail =
                        await frappeFetch<
                          FrappeResponse<FrappePurchaseInvoice>
                        >(
                          detailUrl,
                        );

                      return (
                        detail.data ||
                        invoice
                      );
                    } catch (
                      detailError
                    ) {
                      console.warn(
                        `Failed to fetch Purchase Invoice details for ${invoice.name}`,
                        detailError,
                      );

                      return invoice;
                    }
                  },
                ),
              );

            detailedInvoices.push(
              ...results,
            );
          }

          const mapped =
            detailedInvoices.map(
              mapInvoice,
            );

          setInvoices(
            mapped,
          );

          return mapped;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to fetch Purchase Invoices";

          setError(
            message,
          );

          console.error(
            "Purchase Invoice fetch error:",
            err,
          );

          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  // ==========================================================
  // CREATE PURCHASE INVOICE
  // ==========================================================

  const createPurchaseInvoice =
    useCallback(
      async (
        invoice: Partial<PurchaseInvoice>,
      ): Promise<PurchaseInvoice> => {
        setLoading(true);
        setError(null);

        try {
          // --------------------------------------------------
          // VALIDATION
          // --------------------------------------------------

          if (!invoice.supplier) {
            throw new Error(
              "Supplier is required.",
            );
          }

          if (!invoice.company) {
            throw new Error(
              "Company is required.",
            );
          }

          if (
            !invoice.lines ||
            invoice.lines.length ===
              0
          ) {
            throw new Error(
              "At least one invoice item is required.",
            );
          }

          // --------------------------------------------------
          // BUILD PAYLOAD
          // --------------------------------------------------

          const payload =
            buildPurchaseInvoicePayload(
              invoice,
            );

          if (
            !payload.items ||
            payload.items.length ===
              0
          ) {
            throw new Error(
              "At least one invoice item with quantity greater than zero is required.",
            );
          }

          // --------------------------------------------------
          // POST TO FRAPPE
          // --------------------------------------------------

          const url =
            `${getApiUrl()}/purchase-invoices`;

          const result =
            await frappeFetch<
              FrappeResponse<FrappePurchaseInvoice>
            >(url, {
              method: "POST",

              /*
               * IMPORTANT:
               *
               * Frappe REST API expects
               * document fields directly.
               *
               * Correct:
               * {
               *   supplier: "...",
               *   company: "...",
               *   items: [...]
               * }
               *
               * NOT:
               * {
               *   data: {
               *     supplier: "..."
               *   }
               * }
               */

              body: JSON.stringify(
                payload,
              ),
            });

          if (
            !result.data
          ) {
            throw new Error(
              "Frappe returned an empty Purchase Invoice response.",
            );
          }

          // --------------------------------------------------
          // MAP CREATED DOCUMENT
          // --------------------------------------------------

          const created =
            mapInvoice(
              result.data,
            );

          // --------------------------------------------------
          // UPDATE LOCAL STATE
          // --------------------------------------------------

          setInvoices(
            (current) => [
              created,
              ...current,
            ],
          );

          return created;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to create Purchase Invoice";

          setError(
            message,
          );

          console.error(
            "Purchase Invoice create error:",
            err,
          );

          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  const updatePurchaseInvoice =
    useCallback(
      async (
        invoiceName: string,
        invoice: Partial<PurchaseInvoice>,
      ): Promise<PurchaseInvoice> => {
        if (!invoiceName) {
          throw new Error("Purchase Invoice name is required.");
        }

        setLoading(true);
        setError(null);

        try {
          const submitted = invoice.docstatus === 1;
          const payload = buildPurchaseInvoicePayload({
            ...invoice,
            id: invoiceName,
          }, !submitted);

          if (!payload.items || payload.items.length === 0) {
            throw new Error("At least one invoice item is required.");
          }

          const url = submitted
            ? `${getApiUrl()}/purchase-invoices/${encodeURIComponent(invoiceName)}/amend`
            : `${getApiUrl()}/purchase-invoices/${encodeURIComponent(invoiceName)}`;

          const result = await frappeFetch<
            FrappeResponse<FrappePurchaseInvoice>
          >(url, {
            method: submitted ? "POST" : "PUT",
            body: JSON.stringify(payload),
          });

          if (!result.data) {
            throw new Error("Frappe returned an empty Purchase Invoice response.");
          }

          const updated = mapInvoice(result.data);
          setInvoices((current) =>
            current.map((item) =>
              item.id === invoiceName ? updated : item,
            ),
          );

          return updated;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to update Purchase Invoice";

          setError(message);
          console.error("Purchase Invoice update error:", err);
          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  // ==========================================================
  // ADD ALIAS
  // ==========================================================
  //
  // Existing components may call:
  //
  // const { add } = usePurchaseInvoices();
  //
  // await add(invoice);
  //
  // Keep this alias for compatibility.
  // ==========================================================

  const add =
    useCallback(
      async (
        invoice: PurchaseInvoice,
      ): Promise<PurchaseInvoice> => {
        return createPurchaseInvoice(
          invoice,
        );
      },
      [
        createPurchaseInvoice,
      ],
    );

  // ==========================================================
  // GET SINGLE PURCHASE INVOICE
  // ==========================================================

  const getPurchaseInvoice =
    useCallback(
      async (
        invoiceName: string,
      ): Promise<PurchaseInvoice> => {
         console.log(
        "=== getPurchaseInvoice CALLED ===",
        invoiceName
      );
        if (!invoiceName) {
          throw new Error(
            "Purchase Invoice name is required.",
          );
        }

        setLoading(true);
        setError(null);

        try {
          const url =
            `${getApiUrl()}/resource/Purchase%20Invoice/${encodeURIComponent(
              invoiceName,
            )}`;

              console.log("PURCHASE INVOICE ID:", invoiceName);
              console.log("PURCHASE INVOICE URL:", url);

          const result =
            await frappeFetch<
              FrappeResponse<FrappePurchaseInvoice>
            >(url);
              console.log(
    "PURCHASE INVOICE RESPONSE:",
    result
  );

          if (
            !result.data
          ) {
            throw new Error(
              "Purchase Invoice was not found.",
            );
          }

          const invoice =
            mapInvoice(
              result.data,
            );

          setInvoices(
            (current) => {
              const exists =
                current.some(
                  (item) =>
                    item.id ===
                    invoice.id,
                );

              if (exists) {
                return current.map(
                  (item) =>
                    item.id ===
                    invoice.id
                      ? invoice
                      : item,
                );
              }

              return [
                invoice,
                ...current,
              ];
            },
          );

          return invoice;
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to fetch Purchase Invoice";

          setError(
            message,
          );

          console.error(
            "Purchase Invoice detail error:",
            err,
          );

          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  // ==========================================================
  // DELETE PURCHASE INVOICE
  // ==========================================================

  const deletePurchaseInvoice =
    useCallback(
      async (
        invoiceName: string,
      ): Promise<void> => {
        if (!invoiceName) {
          throw new Error(
            "Purchase Invoice name is required.",
          );
        }

        setLoading(true);
        setError(null);

        try {
          const url =
            `${getApiUrl()}/resource/Purchase%20Invoice/${encodeURIComponent(
              invoiceName,
            )}`;

          await frappeFetch(
            url,
            {
              method: "DELETE",
            },
          );

          setInvoices(
            (current) =>
              current.filter(
                (invoice) =>
                  invoice.id !==
                  invoiceName,
              ),
          );
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to delete Purchase Invoice";

          setError(
            message,
          );

          console.error(
            "Purchase Invoice delete error:",
            err,
          );

          throw err;
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    invoices,

    loading,

    error,

    // Fetch
    fetchInvoices,

    refetch:
      fetchInvoices,

    // Create
    createPurchaseInvoice,

    // Update
    updatePurchaseInvoice,

    // Backward-compatible alias
    add,

    // Single invoice
    getPurchaseInvoice,

    // Delete
    deletePurchaseInvoice,
  };
}

// ============================================================
// TOTALS
// ============================================================

export function computePurchaseInvoiceTotals(
  invoice: PurchaseInvoice,
) {
  // ----------------------------------------------------------
  // SUBTOTAL
  // ----------------------------------------------------------

  const subtotal =
    invoice.lines.reduce(
      (sum, line) => {
        const qty =
          Number(
            line.qty || 0,
          );

        const cost =
          Number(
            line.cost || 0,
          );

        return (
          sum +
          qty * cost
        );
      },
      0,
    );

  // ----------------------------------------------------------
  // DISCOUNT
  // ----------------------------------------------------------

  const discount =
    invoice.lines.reduce(
      (sum, line) => {
        const qty =
          Number(
            line.qty || 0,
          );

        const cost =
          Number(
            line.cost || 0,
          );

        const discountPercentage =
          Number(
            line.discount || 0,
          );

        const amount =
          qty * cost;

        return (
          sum +
          amount *
            (discountPercentage /
              100)
        );
      },
      0,
    );

  // ----------------------------------------------------------
  // TAXABLE
  // ----------------------------------------------------------

  const taxable =
    subtotal - discount;

  // ----------------------------------------------------------
  // TAX
  // ----------------------------------------------------------

  const tax =
    Number(
      invoice.totalTaxes ||
        0,
    );

  // ----------------------------------------------------------
  // CALCULATED GRAND TOTAL
  // ----------------------------------------------------------

  const calculatedGrandTotal =
    taxable + tax;

  // ----------------------------------------------------------
  // GRAND TOTAL
  // ----------------------------------------------------------

  const grandTotal =
    Number(
      invoice.grandTotal,
    ) > 0
      ? Number(
          invoice.grandTotal,
        )
      : calculatedGrandTotal;

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    subtotal:
      roundNumber(
        subtotal,
      ),

    discount:
      roundNumber(
        discount,
      ),

    taxable:
      roundNumber(
        taxable,
      ),

    tax:
      roundNumber(
        tax,
      ),

    grandTotal:
      roundNumber(
        grandTotal,
      ),

    paid:
      roundNumber(
        Number(
          invoice.paidAmount ||
            0,
        ),
      ),

    outstanding:
      roundNumber(
        Number(
          invoice.outstandingAmount ||
            0,
        ),
      ),
  };
}