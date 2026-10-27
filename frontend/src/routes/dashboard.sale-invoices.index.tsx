import { createFileRoute } from "@tanstack/react-router";

import SalesInvoicesPage from "../components/dashboard/sale-invoices-page";

export const Route = createFileRoute(
  "/dashboard/sale-invoices/"
)({
  component: SalesInvoicesRoute,
});

function SalesInvoicesRoute() {
  return <SalesInvoicesPage />;
}