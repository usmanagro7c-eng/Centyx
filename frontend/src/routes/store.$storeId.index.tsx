import { createFileRoute } from "@tanstack/react-router";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const Route = createFileRoute("/store/$storeId/")({
  component: DashboardHome,
});
