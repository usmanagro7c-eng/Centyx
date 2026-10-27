import { createFileRoute } from "@tanstack/react-router";
import { PurchaseOrdersPage } from "@/components/dashboard/purchase-orders-page";

export const Route = createFileRoute("/dashboard/purchase-orders/")({
  head: () => ({ meta: [{ title: "Purchase Orders — Aether" }] }),
  component: PurchaseOrdersPage,
});
