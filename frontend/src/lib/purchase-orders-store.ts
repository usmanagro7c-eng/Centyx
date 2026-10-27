import { create } from "zustand";

import {
  getPurchaseOrders,
  getPurchaseOrderById,
} from "../api/purchase-order";

import type {
  FrappePurchaseOrder,
  FrappePurchaseOrderItem,
} from "../api/purchase-order";

import type {
  PurchaseOrderStatus,
} from "@/lib/store-data-store";

// ============================================================
// TYPES
// ============================================================

export type PaymentStatus =
  | "Paid"
  | "Partially Paid"
  | "Pending";

export type OrderStatus = PurchaseOrderStatus;

export type PaymentMethod =
  | "Cash"
  | "Bank"
  | "Card"
  | "Online Transfer";

export type PurchaseOrderLine = {
  id: string;

  product: string;
  sku: string;

  qty: number;

  unit: string;

  cost: number;

  tax: number;

  discount: number;

  warehouse?: string;

  scheduleDate?: string;

  receivedQty?: number;
};

export type PaymentEntry = {
  id: string;

  date: string;

  amount: number;

  method: PaymentMethod;

  note?: string;
};

export type PurchaseOrder = {
  id: string;

  number: string;

  supplier: string;

  supplierEmail?: string;

  supplierPhone?: string;

  supplierAddress?: string;

  warehouse: string;

  currency: string;

  orderDate: string;

  scheduleDate: string;

  taxRate: number;

  grandTotal?: number;

  notes?: string;

  lines: PurchaseOrderLine[];

  payments: PaymentEntry[];

  paymentStatus: PaymentStatus;

  orderStatus: OrderStatus;

  rawStatus: string;

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
// TOTALS
// ============================================================

export function computeTotals(
  order: Pick<
    PurchaseOrder,
    "lines" | "payments"
  >
) {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;

  for (const line of order.lines) {
    const amount =
      Number(line.qty || 0) *
      Number(line.cost || 0);

    const discountAmount =
      amount *
      (Number(line.discount || 0) / 100);

    const taxableAmount =
      amount - discountAmount;

    const taxAmount =
      taxableAmount *
      (Number(line.tax || 0) / 100);

    subtotal += amount;

    discount += discountAmount;

    tax += taxAmount;
  }

  const grand =
    subtotal -
    discount +
    tax;

  const paid =
    order.payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const balance = Math.max(
    0,
    grand - paid
  );

  return {
    subtotal,
    tax,
    discount,
    grand,
    paid,
    balance,
  };
}

// ============================================================
// ID HELPER
// ============================================================

const uid = () =>
  Math.random()
    .toString(36)
    .slice(2, 10);

// ============================================================
// MAP FRAPPE ITEM
// ============================================================

function mapPurchaseOrderItem(
  item: FrappePurchaseOrderItem
): PurchaseOrderLine {
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

    qty:
      Number(item.qty || 0),

    unit:
      item.uom ||
      item.stock_uom ||
      "Nos",

    cost:
      Number(item.rate || 0),

    // Frappe Purchase Order Item doesn't
    // directly give us the final tax percentage.
    tax: 0,

    discount: 0,

    warehouse:
      item.warehouse ||
      undefined,

    scheduleDate:
      item.schedule_date ||
      undefined,

    receivedQty:
      Number(item.received_qty || 0),
  };
}

// ============================================================
// MAP STATUS
// ============================================================

function mapPurchaseOrderStatus(
  status: FrappePurchaseOrder["status"]
): PurchaseOrderStatus {
  switch (status) {
    case "Draft":
      return "Draft";

    case "On Hold":
      return "Draft";

    case "To Receive":
      return "Partially received";

    case "To Receive and Bill":
      return "Partially received";

    case "To Bill":
      return "Partially received";

    case "Completed":
    case "Closed":
      return "Received";

    case "Cancelled":
      return "Cancelled";

    default:
      return "Draft";
  }
}

// ============================================================
// PAYMENT STATUS
// ============================================================

function mapPurchaseOrderPaymentStatus(
  status: FrappePurchaseOrder["status"]
): PaymentStatus {
  switch (status) {
    case "Completed":
    case "Closed":
      return "Paid";

    default:
      return "Pending";
  }
}

// ============================================================
// MAP FRAPPE PURCHASE ORDER
// ============================================================

function mapPurchaseOrder(
  order: FrappePurchaseOrder
): PurchaseOrder {
  const frappeItems =
    Array.isArray(order.items)
      ? order.items
      : [];

  const lines =
    frappeItems.map(
      mapPurchaseOrderItem
    );

  const orderStatus =
    mapPurchaseOrderStatus(
      order.status
    );

  const paymentStatus =
    mapPurchaseOrderPaymentStatus(
      order.status
    );

  const activity = [
    {
      id:
        `${order.name}-created`,

      ts:
        order.creation ||
        order.transaction_date ||
        "",

      text:
        "Purchase Order created",
    },
  ];

  return {
    id:
      order.name,

    number:
      order.name,

    supplier:
      order.supplier_name ||
      order.supplier ||
      "",

    supplierEmail:
      order.contact_email ||
      undefined,

    supplierPhone:
      undefined,

    supplierAddress:
      order.supplier_address ||
      undefined,

    warehouse:
      frappeItems[0]?.warehouse ||
      "",

    currency:
      order.currency ||
      "PKR",

    orderDate:
      order.transaction_date ||
      "",

    scheduleDate:
      order.schedule_date ||
      "",

    taxRate:
      Number(order.total || 0) > 0
        ? (
            Number(
              order.total_taxes_and_charges || 0
            ) /
            Number(order.total || 0)
          ) * 100
        : 0,

    /*
     * IMPORTANT:
     * Use Frappe grand_total directly.
     * Do not calculate it again from frontend
     * lines because Frappe may contain taxes,
     * discounts, rounding, etc.
     */
    grandTotal:
      Number(
        order.grand_total ??
        order.rounded_total ??
        order.total ??
        0
      ),

    notes:
      order.terms ||
      order.in_words ||
      "",

    lines,

    payments: [],

    paymentStatus,

    orderStatus,

    rawStatus:
      order.status ||
      "",

    attachments: [],

    activity,

    createdAt:
      order.creation ||
      "",

    updatedAt:
      order.modified ||
      "",
  };
}

// ============================================================
// STORE STATE
// ============================================================

type State = {
  orders: PurchaseOrder[];

  loading: boolean;

  error: string | null;

  fetchOrders: () => Promise<void>;

  fetchOrderById: (
    orderName: string
  ) => Promise<PurchaseOrder | null>;

  add: (
    order: Omit<
      PurchaseOrder,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "activity"
      | "attachments"
    > &
      Partial<
        Pick<
          PurchaseOrder,
          "activity" | "attachments"
        >
      >
  ) => PurchaseOrder;

  update: (
    id: string,
    patch: Partial<PurchaseOrder>
  ) => void;

  remove: (
    id: string
  ) => void;

  duplicate: (
    id: string
  ) => PurchaseOrder | null;

  addPayment: (
    id: string,
    payment: Omit<
      PaymentEntry,
      "id"
    >
  ) => void;

  reset: () => void;
};

// ============================================================
// ZUSTAND STORE
// ============================================================

export const usePurchaseOrders =
  create<State>((set, get) => ({

    // ========================================================
    // INITIAL STATE
    // ========================================================

    orders: [],

    loading: false,

    error: null,

    // ========================================================
    // FETCH ALL PURCHASE ORDERS
    // ========================================================

    fetchOrders: async () => {
      try {
        set({
          loading: true,
          error: null,
        });

        /*
         * First get the Purchase Order list.
         */
        const response =
          await getPurchaseOrders({
            limit_page_length: 100,
            limit_start: 0,
            order_by:
              "transaction_date desc",
          });

        const list =
          Array.isArray(response.data)
            ? response.data
            : [];

        /*
         * IMPORTANT:
         *
         * Frappe resource list can sometimes return
         * incomplete child-table information.
         *
         * Therefore fetch each Purchase Order's
         * complete document separately.
         */
        const completeOrders =
          await Promise.all(
            list.map(
              async (listOrder) => {
                try {
                  const detail =
                    await getPurchaseOrderById(
                      listOrder.name
                    );

                  return (
                    detail.data ||
                    listOrder
                  );
                } catch (detailError) {
                  console.warn(
                    `Failed to fetch full Purchase Order ${listOrder.name}`,
                    detailError
                  );

                  /*
                   * If detail request fails,
                   * don't lose the order.
                   * Use list response instead.
                   */
                  return listOrder;
                }
              }
            )
          );

        const orders =
          completeOrders.map(
            mapPurchaseOrder
          );

        set({
          orders,
          loading: false,
          error: null,
        });

      } catch (error) {
        console.error(
          "Failed to fetch Purchase Orders:",
          error
        );

        set({
          loading: false,

          error:
            error instanceof Error
              ? error.message
              : "Failed to load Purchase Orders",
        });
      }
    },

    // ========================================================
    // FETCH SINGLE PURCHASE ORDER
    // ========================================================

    fetchOrderById:
      async (orderName) => {
        try {
          set({
            loading: true,
            error: null,
          });

          const response =
            await getPurchaseOrderById(
              orderName
            );

          const order =
            mapPurchaseOrder(
              response.data
            );

          set((state) => {
            const exists =
              state.orders.some(
                (item) =>
                  item.id ===
                  order.id
              );

            return {
              orders: exists
                ? state.orders.map(
                    (item) =>
                      item.id ===
                      order.id
                        ? order
                        : item
                  )
                : [
                    order,
                    ...state.orders,
                  ],

              loading: false,

              error: null,
            };
          });

          return order;

        } catch (error) {
          console.error(
            "Failed to fetch Purchase Order:",
            error
          );

          set({
            loading: false,

            error:
              error instanceof Error
                ? error.message
                : "Failed to load Purchase Order",
          });

          return null;
        }
      },

    // ========================================================
    // ADD LOCAL ORDER
    // ========================================================

    add: (order) => {
      const now =
        new Date().toISOString();

      const created: PurchaseOrder = {
        ...order,

        id:
          uid(),

        createdAt:
          now,

        updatedAt:
          now,

        activity:
          order.activity ??
          [
            {
              id:
                uid(),

              ts:
                now.slice(0, 10),

              text:
                "Purchase Order created",
            },
          ],

        attachments:
          order.attachments ??
          [],
      };

      set((state) => ({
        orders: [
          created,
          ...state.orders,
        ],
      }));

      return created;
    },

    // ========================================================
    // UPDATE LOCAL ORDER
    // ========================================================

    update: (
      id,
      patch
    ) => {
      set((state) => ({
        orders:
          state.orders.map(
            (order) =>
              order.id === id
                ? {
                    ...order,

                    ...patch,

                    updatedAt:
                      new Date().toISOString(),
                  }
                : order
          ),
      }));
    },

    // ========================================================
    // REMOVE LOCAL ORDER
    // ========================================================

    remove: (id) => {
      set((state) => ({
        orders:
          state.orders.filter(
            (order) =>
              order.id !== id
          ),
      }));
    },

    // ========================================================
    // DUPLICATE
    // ========================================================

    duplicate: (id) => {
      const source =
        get().orders.find(
          (order) =>
            order.id === id
        );

      if (!source) {
        return null;
      }

      const now =
        new Date().toISOString();

      const copy: PurchaseOrder = {
        ...source,

        id:
          uid(),

        number:
          `${source.number}-COPY`,

        payments: [],

        paymentStatus:
          "Pending",

        orderStatus:
          "Draft",

        activity: [
          {
            id:
              uid(),

            ts:
              now.slice(0, 10),

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
        orders: [
          copy,
          ...state.orders,
        ],
      }));

      return copy;
    },

    // ========================================================
    // ADD PAYMENT
    // ========================================================

    addPayment: (
      id,
      payment
    ) => {
      set((state) => ({
        orders:
          state.orders.map(
            (order) => {
              if (
                order.id !== id
              ) {
                return order;
              }

              const payments = [
                ...order.payments,

                {
                  ...payment,

                  id:
                    uid(),
                },
              ];

              const totals =
                computeTotals({
                  lines:
                    order.lines,

                  payments,
                });

              const paymentStatus: PaymentStatus =
                totals.paid >=
                (order.grandTotal ??
                  totals.grand)
                  ? "Paid"
                  : totals.paid > 0
                    ? "Partially Paid"
                    : "Pending";

              return {
                ...order,

                payments,

                paymentStatus,

                activity: [
                  ...order.activity,

                  {
                    id:
                      uid(),

                    ts:
                      payment.date,

                    text:
                      `Payment recorded — ${payment.amount.toFixed(
                        2
                      )} ${
                        order.currency
                      }`,
                  },
                ],

                updatedAt:
                  new Date().toISOString(),
              };
            }
          ),
      }));
    },

    // ========================================================
    // RESET
    // ========================================================

    reset: () => {
      set({
        orders: [],

        loading: false,

        error: null,
      });
    },
  }));