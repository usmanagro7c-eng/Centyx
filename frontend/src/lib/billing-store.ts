// Billing store — mock data, backend-ready.
// Later swap the in-memory ops for calls to the Node.js + Express backend
// (see backend/). Every action already returns a Promise so it can flip
// to `fetch()` without touching components.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentBrand =
  | "visa" | "mastercard" | "amex" | "paypal" | "stripe" | "bank";

export interface PaymentMethod {
  id: string;
  brand: PaymentBrand;
  last4?: string;
  holder?: string;
  expMonth?: number;
  expYear?: number;
  email?: string;         // paypal
  bankName?: string;      // bank transfer
  isDefault: boolean;
}

export type InvoiceStatus = "paid" | "unpaid" | "refunded" | "void";

export interface InvoiceLine {
  label: string;
  amount: number;
}

export interface Invoice {
  id: string;                       // INV-2026-0042
  number: string;
  dateIssued: string;               // ISO
  dueDate: string;                  // ISO
  reason: string;                   // "Subscription — Growth"
  amount: number;
  subtotal: number;
  tax: number;
  discount: number;
  currency: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  transactionId?: string;
  paymentMethodId?: string;
}

export interface PaymentRecord {
  id: string;                       // TXN-...
  invoiceId?: string;
  method: PaymentBrand;
  amount: number;
  currency: string;
  date: string;                     // ISO
  status: "succeeded" | "failed" | "refunded" | "pending";
}

export interface BillingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  cycle: "monthly" | "yearly";
  status: "active" | "trialing" | "past_due" | "canceled";
  renewalDate: string;              // ISO
  features: string[];
}

export interface BillingSettings {
  defaultCurrency: string;
  companyName: string;
  billingEmail: string;
  taxId: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  emailNotifications: boolean;
}

export interface UpcomingBill {
  amount: number;
  currency: string;
  nextBillingDate: string;          // ISO
  billingThreshold: number;
  remainingThreshold: number;
  availableDiscounts: number;
  lines: InvoiceLine[];
}

interface BillingState {
  upcoming: UpcomingBill;
  plan: BillingPlan;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  settings: BillingSettings;

  addPaymentMethod: (pm: Omit<PaymentMethod, "id" | "isDefault">) => Promise<void>;
  updatePaymentMethod: (id: string, patch: Partial<PaymentMethod>) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;

  changePlan: (planId: string) => Promise<void>;
  setBillingCycle: (cycle: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;

  updateSettings: (patch: Partial<BillingSettings>) => Promise<void>;
}

const nowPlusDays = (d: number) =>
  new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString();
const nowMinusDays = (d: number) =>
  new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

const mockInvoices: Invoice[] = [
  {
    id: "INV-2026-0042", number: "INV-2026-0042",
    dateIssued: nowMinusDays(15), dueDate: nowMinusDays(1),
    reason: "Subscription — Growth (Monthly)",
    amount: 49, subtotal: 45, tax: 4, discount: 0,
    currency: "USD", status: "paid",
    lines: [{ label: "Growth plan — Monthly", amount: 45 }, { label: "Tax (VAT 8.875%)", amount: 4 }],
    transactionId: "TXN-9F82K1", paymentMethodId: "pm_1",
  },
  {
    id: "INV-2026-0038", number: "INV-2026-0038",
    dateIssued: nowMinusDays(45), dueDate: nowMinusDays(30),
    reason: "Subscription — Growth (Monthly)",
    amount: 49, subtotal: 45, tax: 4, discount: 0,
    currency: "USD", status: "paid",
    lines: [{ label: "Growth plan — Monthly", amount: 45 }, { label: "Tax", amount: 4 }],
    transactionId: "TXN-8A11ZQ", paymentMethodId: "pm_1",
  },
  {
    id: "INV-2026-0031", number: "INV-2026-0031",
    dateIssued: nowMinusDays(75), dueDate: nowMinusDays(60),
    reason: "Subscription — Growth (Monthly)",
    amount: 49, subtotal: 45, tax: 4, discount: 0,
    currency: "USD", status: "paid",
    lines: [{ label: "Growth plan — Monthly", amount: 45 }, { label: "Tax", amount: 4 }],
    transactionId: "TXN-7B22QQ", paymentMethodId: "pm_1",
  },
  {
    id: "INV-2026-0025", number: "INV-2026-0025",
    dateIssued: nowMinusDays(105), dueDate: nowMinusDays(90),
    reason: "Usage overage — API requests",
    amount: 12, subtotal: 12, tax: 0, discount: 0,
    currency: "USD", status: "unpaid",
    lines: [{ label: "Overage — 12k requests", amount: 12 }],
    transactionId: undefined, paymentMethodId: undefined,
  },
  {
    id: "INV-2026-0018", number: "INV-2026-0018",
    dateIssued: nowMinusDays(135), dueDate: nowMinusDays(120),
    reason: "Subscription — Starter (Monthly)",
    amount: 29, subtotal: 29, tax: 0, discount: 0,
    currency: "USD", status: "refunded",
    lines: [{ label: "Starter plan — Monthly", amount: 29 }],
    transactionId: "TXN-4Y88TT", paymentMethodId: "pm_1",
  },
];

const mockPayments: PaymentRecord[] = mockInvoices
  .filter(i => i.transactionId)
  .map(i => ({
    id: i.transactionId!,
    invoiceId: i.id,
    method: "visa",
    amount: i.amount,
    currency: i.currency,
    date: i.dateIssued,
    status: i.status === "paid" ? "succeeded"
      : i.status === "refunded" ? "refunded" : "pending",
  }));

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      upcoming: {
        amount: 32.5,
        currency: "USD",
        nextBillingDate: nowPlusDays(9),
        billingThreshold: 100,
        remainingThreshold: 67.5,
        availableDiscounts: 5,
        lines: [
          { label: "Growth plan — Monthly", amount: 29 },
          { label: "Usage — API overage", amount: 3.5 },
          { label: "Promotional discount", amount: -5 },
          { label: "Estimated tax", amount: 5 },
        ],
      },
      plan: {
        id: "growth",
        name: "Growth",
        priceMonthly: 49,
        priceYearly: 490,
        cycle: "monthly",
        status: "active",
        renewalDate: nowPlusDays(9),
        features: [
          "Unlimited AI-generated pages",
          "Up to 10 stores & 25 team seats",
          "Priority support",
          "Custom domain & SSL",
        ],
      },
      paymentMethods: [
        {
          id: "pm_1", brand: "visa", last4: "2554",
          holder: "Jane Cooper", expMonth: 8, expYear: 2028, isDefault: true,
        },
      ],
      invoices: mockInvoices,
      payments: mockPayments,
      settings: {
        defaultCurrency: "USD",
        companyName: "Aether Commerce Inc.",
        billingEmail: "billing@aether.dev",
        taxId: "",
        address: {
          line1: "", line2: "", city: "",
          state: "", postalCode: "", country: "US",
        },
        emailNotifications: true,
      },

      addPaymentMethod: async (pm) => {
        const id = `pm_${Date.now().toString(36)}`;
        const list = get().paymentMethods;
        const isDefault = list.length === 0;
        set({ paymentMethods: [...list, { ...pm, id, isDefault }] });
      },
      updatePaymentMethod: async (id, patch) => {
        set({
          paymentMethods: get().paymentMethods.map(p =>
            p.id === id ? { ...p, ...patch } : p),
        });
      },
      removePaymentMethod: async (id) => {
        const list = get().paymentMethods.filter(p => p.id !== id);
        if (list.length && !list.some(p => p.isDefault)) list[0].isDefault = true;
        set({ paymentMethods: list });
      },
      setDefaultPaymentMethod: async (id) => {
        set({
          paymentMethods: get().paymentMethods.map(p => ({ ...p, isDefault: p.id === id })),
        });
      },

      changePlan: async (planId) => {
        const plans: Record<string, Partial<BillingPlan>> = {
          starter: { id: "starter", name: "Starter", priceMonthly: 19, priceYearly: 190 },
          growth:  { id: "growth",  name: "Growth",  priceMonthly: 49, priceYearly: 490 },
          scale:   { id: "scale",   name: "Scale",   priceMonthly: 99, priceYearly: 990 },
        };
        const p = plans[planId];
        if (!p) return;
        set({ plan: { ...get().plan, ...p } as BillingPlan });
      },
      setBillingCycle: async (cycle) => {
        set({ plan: { ...get().plan, cycle } });
      },
      cancelSubscription: async () => {
        set({ plan: { ...get().plan, status: "canceled" } });
      },

      updateSettings: async (patch) => {
        set({ settings: { ...get().settings, ...patch, address: { ...get().settings.address, ...(patch.address ?? {}) } } });
      },
    }),
    { name: "aether-billing-v1" },
  ),
);

export const formatMoney = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const brandLabel = (b: PaymentBrand) => ({
  visa: "Visa", mastercard: "Mastercard", amex: "American Express",
  paypal: "PayPal", stripe: "Stripe", bank: "Bank Transfer",
}[b]);
