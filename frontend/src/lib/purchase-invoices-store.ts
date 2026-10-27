import { create } from "zustand";

import {
  getPurchaseInvoices,
  getPurchaseInvoiceById,
} from "../api/purchase-invoice";

import type {
  FrappePurchaseInvoice,
  FrappePurchaseInvoiceItem,
} from "../api/purchase-invoice";

// ============================================================
// TYPES
// ============================================================

export type PurchaseInvoicePaymentStatus =
  | "Paid"
  | "Partially Paid"
  | "Pending"
  | "Overdue";

export type PurchaseInvoiceStatus =
  | "Draft"
  | "Submitted"
  | "Paid"
  | "Partly Paid"
  | "Unpaid"
  | "Overdue"
  | "Cancelled"
  | "Return"
  | "Debit Note"
  | "Internal Transfer";

export type PurchaseInvoiceLine = {
  id: string;

  product: string;

  sku: string;

  description?: string;

  qty: number;

  unit: string;

  cost: number;

  discount: number;

  amount: number;

  warehouse?: string;

  purchaseOrder?: string;

  purchaseReceipt?: string;

  receivedQty?: number;

  expenseAccount?: string;

  costCenter?: string;
};

export type PurchaseInvoicePayment = {
  id: string;

  date: string;

  amount: number;

  method:
    | "Cash"
    | "Bank"
    | "Card"
    | "Online Transfer";

  note?: string;
};

export type PurchaseInvoice = {
  id: string;

  number: string;

  supplier: string;

  supplierName?: string;

  supplierEmail?: string;

  supplierPhone?: string;

  supplierAddress?: string;

  company?: string;

  currency: string;

  postingDate: string;

  dueDate: string;

  billNo?: string;

  billDate?: string;

  paymentTerms?: string;

  warehouse: string;

  netTotal: number;

  totalTaxes: number;

  discountAmount: number;

  grandTotal: number;

  roundedTotal: number;

  outstandingAmount: number;

  paidAmount: number;

  taxRate: number;

  status: PurchaseInvoiceStatus | string;

  paymentStatus: PurchaseInvoicePaymentStatus;

  isReturn: boolean;

  returnAgainst?: string;

  updateStock: boolean;

  remarks?: string;

  terms?: string;

  lines: PurchaseInvoiceLine[];

  payments: PurchaseInvoicePayment[];

  attachments: {
    id: string;
    name: string;
    size: string;
  }[];

  activity: {
    id: string;
    ts: string;
    text: string;
  }[];

  createdAt: string;

  updatedAt: string;
};

// ============================================================
// HELPERS
// ============================================================

const uid = () =>
  Math.random()
    .toString(36)
    .slice(2, 10);

// ============================================================
// TOTALS
// ============================================================

export function computePurchaseInvoiceTotals(
  invoice: Pick<
    PurchaseInvoice,
    "lines" | "grandTotal" | "paidAmount" | "outstandingAmount"
  >
) {
  const subtotal = invoice.lines.reduce(
    (sum, line) =>
      sum +
      Number(
        line.amount ||
          Number(line.qty || 0) *
            Number(line.cost || 0)
      ),
    0
  );

  const discount = invoice.lines.reduce(
    (sum, line) => {
      const base =
        Number(line.qty || 0) *
        Number(line.cost || 0);

      return (
        sum +
        base *
          (Number(line.discount || 0) / 100)
      );
    },
    0
  );

  const grand =
    Number(invoice.grandTotal || 0);

  const paid =
    Number(invoice.paidAmount || 0);

  const outstanding =
    Number(invoice.outstandingAmount || 0);

  return {
    subtotal,

    discount,

    grand,

    paid,

    outstanding,

    balance: outstanding,
  };
}

// ============================================================
// MAP ITEM
// ============================================================

function mapPurchaseInvoiceItem(
  item: FrappePurchaseInvoiceItem
): PurchaseInvoiceLine {
  return {
    id:
      item.name ||
      uid(),

    product:
      item.item_name ||
      item.item_code ||
      "",

    sku:
      item.item_code ||
      "",

    description:
      item.description ||
      "",

    qty:
      Number(item.qty || 0),

    unit:
      item.uom ||
      item.stock_uom ||
      "Nos",

    cost:
      Number(item.rate || 0),

    discount:
      Number(
        item.discount_percentage || 0
      ),

    amount:
      Number(item.amount || 0),

    warehouse:
      item.warehouse ||
      undefined,

    purchaseOrder:
      item.purchase_order ||
      undefined,

    purchaseReceipt:
      item.purchase_receipt ||
      undefined,

    receivedQty:
      Number(item.received_qty || 0),

    expenseAccount:
      item.expense_account ||
      undefined,

    costCenter:
      item.cost_center ||
      undefined,
  };
}

// ============================================================
// STATUS
// ============================================================

function mapInvoiceStatus(
  status: string
): PurchaseInvoiceStatus {
  switch (status) {
    case "Draft":
      return "Draft";

    case "Paid":
      return "Paid";

    case "Partly Paid":
      return "Partly Paid";

    case "Unpaid":
      return "Unpaid";

    case "Overdue":
      return "Overdue";

    case "Cancelled":
      return "Cancelled";

    case "Return":
      return "Return";

    case "Debit Note":
      return "Debit Note";

    case "Internal Transfer":
      return "Internal Transfer";

    case "Submitted":
      return "Submitted";

    default:
      return  "Draft";
  }
}

// ============================================================
// PAYMENT STATUS
// ============================================================

function mapPaymentStatus(
  invoice: FrappePurchaseInvoice
): PurchaseInvoicePaymentStatus {
  const outstanding =
    Number(
      invoice.outstanding_amount || 0
    );

  const grandTotal =
    Number(
      invoice.grand_total || 0
    );

  if (
    invoice.status === "Overdue" &&
    outstanding > 0
  ) {
    return "Overdue";
  }

  if (
    outstanding <= 0 &&
    grandTotal > 0
  ) {
    return "Paid";
  }

  if (
    outstanding > 0 &&
    outstanding < grandTotal
  ) {
    return "Partially Paid";
  }

  return "Pending";
}

// ============================================================
// MAP FRAPPE PURCHASE INVOICE
// ============================================================

function mapPurchaseInvoice(
  invoice: FrappePurchaseInvoice
): PurchaseInvoice {
  const frappeItems =
    Array.isArray(invoice.items)
      ? invoice.items
      : [];

  const lines =
    frappeItems.map(
      mapPurchaseInvoiceItem
    );

  const grandTotal =
    Number(
      invoice.grand_total ??
        invoice.rounded_total ??
        invoice.total ??
        0
    );

  const paidAmount =
    Number(
      invoice.paid_amount || 0
    );

  const outstandingAmount =
    Number(
      invoice.outstanding_amount || 0
    );

  const taxBase =
    Number(invoice.net_total || 0);

  const taxRate =
    taxBase > 0
      ? (
          Number(
            invoice.total_taxes_and_charges ||
              0
          ) / taxBase
        ) *
        100
      : 0;

  const warehouse =
    frappeItems.find(
      (item) => item.warehouse
    )?.warehouse || "";

  const activity = [
    {
      id:
        `${invoice.name}-created`,

      ts:
        invoice.creation ||
        invoice.posting_date ||
        "",

      text:
        "Purchase Invoice created",
    },
  ];

  return {
    id:
      invoice.name,

    number:
      invoice.name,

    supplier:
      invoice.supplier ||
      invoice.supplier_name ||
      "",

    supplierName:
      invoice.supplier_name ||
      invoice.supplier ||
      undefined,

    supplierEmail:
      invoice.contact_email ||
      undefined,

    supplierPhone:
      invoice.contact_phone ||
      undefined,

    supplierAddress:
      invoice.supplier_address ||
      undefined,

    company:
      invoice.company ||
      "",

    currency:
      invoice.currency ||
      "PKR",

    postingDate:
      invoice.posting_date ||
      "",

    dueDate:
      invoice.due_date ||
      "",

    billNo:
      invoice.bill_no ||
      undefined,

    billDate:
      invoice.bill_date ||
      undefined,

    paymentTerms:
      invoice.payment_terms_template ||
      undefined,

    warehouse,

    netTotal:
      Number(invoice.net_total || 0),

    totalTaxes:
      Number(
        invoice.total_taxes_and_charges || 0
      ),

    discountAmount:
      Number(
        invoice.discount_amount || 0
      ),

    grandTotal,

    roundedTotal:
      Number(
        invoice.rounded_total ??
          grandTotal
      ),

    outstandingAmount,

    paidAmount,

    taxRate,

    status:
      mapInvoiceStatus(
        invoice.status
      ),

    paymentStatus:
      mapPaymentStatus(invoice),

    isReturn:
      Boolean(invoice.is_return),

    returnAgainst:
      invoice.return_against ||
      undefined,

    updateStock:
      Boolean(invoice.update_stock),

    remarks:
      invoice.remarks ||
      undefined,

    terms:
      invoice.terms ||
      invoice.in_words ||
      undefined,

    lines,

    payments: [],

    attachments: [],

    activity,

    createdAt:
      invoice.creation ||
      "",

    updatedAt:
      invoice.modified ||
      "",
  };
}

// ============================================================
// STORE
// ============================================================

type State = {
  invoices: PurchaseInvoice[];

  loading: boolean;

  error: string | null;

  fetchInvoices: () => Promise<void>;

  fetchInvoiceById: (
    invoiceName: string
  ) => Promise<PurchaseInvoice | null>;

  add: (
    invoice: Omit<
      PurchaseInvoice,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "activity"
      | "attachments"
    > &
      Partial<
        Pick<
          PurchaseInvoice,
          "activity" | "attachments"
        >
      >
  ) => PurchaseInvoice;

  update: (
    id: string,
    patch: Partial<PurchaseInvoice>
  ) => void;

  remove: (
    id: string
  ) => void;

  duplicate: (
    id: string
  ) => PurchaseInvoice | null;

  reset: () => void;
};

// ============================================================
// ZUSTAND
// ============================================================

export const usePurchaseInvoices =
  create<State>((set, get) => ({
    invoices: [],

    loading: false,

    error: null,

    // ========================================================
    // FETCH ALL
    // ========================================================

    fetchInvoices: async () => {
      try {
        set({
          loading: true,
          error: null,
        });

        const response =
          await getPurchaseInvoices({
            limit_page_length: 100,

            limit_start: 0,

            order_by:
              "posting_date desc",
          });

        const list =
          Array.isArray(response.data)
            ? response.data
            : [];

        const completeInvoices =
          await Promise.all(
            list.map(
              async (listInvoice) => {
                try {
                  const detail =
                    await getPurchaseInvoiceById(
                      listInvoice.name
                    );

                  return (
                    detail.data ||
                    listInvoice
                  );
                } catch (error) {
                  console.warn(
                    `Failed to fetch full Purchase Invoice ${listInvoice.name}`,
                    error
                  );

                  return listInvoice;
                }
              }
            )
          );

        const invoices =
          completeInvoices.map(
            mapPurchaseInvoice
          );

        set({
          invoices,

          loading: false,

          error: null,
        });
      } catch (error) {
        console.error(
          "Failed to fetch Purchase Invoices:",
          error
        );

        set({
          loading: false,

          error:
            error instanceof Error
              ? error.message
              : "Failed to load Purchase Invoices",
        });
      }
    },

    // ========================================================
    // FETCH SINGLE
    // ========================================================

    fetchInvoiceById:
      async (invoiceName) => {
        try {
          set({
            loading: true,
            error: null,
          });

          const response =
            await getPurchaseInvoiceById(
              invoiceName
            );

          const invoice =
            mapPurchaseInvoice(
              response.data
            );

          set((state) => {
            const exists =
              state.invoices.some(
                (item) =>
                  item.id ===
                  invoice.id
              );

            return {
              invoices: exists
                ? state.invoices.map(
                    (item) =>
                      item.id ===
                      invoice.id
                        ? invoice
                        : item
                  )
                : [
                    invoice,
                    ...state.invoices,
                  ],

              loading: false,

              error: null,
            };
          });

          return invoice;
        } catch (error) {
          console.error(
            "Failed to fetch Purchase Invoice:",
            error
          );

          set({
            loading: false,

            error:
              error instanceof Error
                ? error.message
                : "Failed to load Purchase Invoice",
          });

          return null;
        }
      },

    // ========================================================
    // ADD LOCAL
    // ========================================================

    add: (invoice) => {
      const now =
        new Date().toISOString();

      const created: PurchaseInvoice = {
        ...invoice,

        id:
          uid(),

        createdAt:
          now,

        updatedAt:
          now,

        activity:
          invoice.activity ??
          [
            {
              id:
                uid(),

              ts:
                now,

              text:
                "Purchase Invoice created",
            },
          ],

        attachments:
          invoice.attachments ??
          [],
      };

      set((state) => ({
        invoices: [
          created,
          ...state.invoices,
        ],
      }));

      return created;
    },

    // ========================================================
    // UPDATE
    // ========================================================

    update: (
      id,
      patch
    ) => {
      set((state) => ({
        invoices:
          state.invoices.map(
            (invoice) =>
              invoice.id === id
                ? {
                    ...invoice,

                    ...patch,

                    updatedAt:
                      new Date().toISOString(),
                  }
                : invoice
          ),
      }));
    },

    // ========================================================
    // REMOVE
    // ========================================================

    remove: (id) => {
      set((state) => ({
        invoices:
          state.invoices.filter(
            (invoice) =>
              invoice.id !== id
          ),
      }));
    },

    // ========================================================
    // DUPLICATE
    // ========================================================

    duplicate: (id) => {
      const source =
        get().invoices.find(
          (invoice) =>
            invoice.id === id
        );

      if (!source) {
        return null;
      }

      const now =
        new Date().toISOString();

      const copy: PurchaseInvoice = {
        ...source,

        id:
          uid(),

        number:
          `${source.number}-COPY`,

        billNo:
          source.billNo
            ? `${source.billNo}-COPY`
            : undefined,

        paidAmount:
          0,

        outstandingAmount:
          source.grandTotal,

        paymentStatus:
          "Pending",

        status:
          "Draft",

        payments: [],

        activity: [
          {
            id:
              uid(),

            ts:
              now,

            text:
              `Duplicated from ${source.number}`,
          },
        ],

        createdAt:
          now,

        updatedAt:
          now,
      };

      set((state) => ({
        invoices: [
          copy,
          ...state.invoices,
        ],
      }));

      return copy;
    },

    // ========================================================
    // RESET
    // ========================================================

    reset: () => {
      set({
        invoices: [],

        loading: false,

        error: null,
      });
    },
  }));