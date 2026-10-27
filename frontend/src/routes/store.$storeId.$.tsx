import { createFileRoute, useParams } from "@tanstack/react-router";
import { DashboardDispatch } from "@/routes/dashboard.$";

export const Route = createFileRoute("/store/$storeId/$")({
  component: StoreCatchAll,
});

function StoreCatchAll() {
  const { _splat } = useParams({ from: "/store/$storeId/$" });
  return <DashboardDispatch slug={_splat ?? ""} />;
}
