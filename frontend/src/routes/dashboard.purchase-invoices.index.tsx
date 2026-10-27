import { createFileRoute } from "@tanstack/react-router";

import { PurchaseInvoicesPage } from "@/components/dashboard/purchase-invoices-page";

export const Route = createFileRoute("/dashboard/purchase-invoices/")({
  head: () => ({
    meta: [{ title: "Purchase Invoices — Aether" }],
  }),

  component: PurchaseInvoicesPage,
});