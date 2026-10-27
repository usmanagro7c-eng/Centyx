import { createFileRoute, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/store/$storeId")({
  head: () => ({
    meta: [
      { title: "Store — Aether" },
      { name: "description", content: "Manage this store's operations, products and orders." },
    ],
  }),
  component: StoreLayout,
});

function StoreLayout() {
  const { storeId } = useParams({ from: "/store/$storeId" });
  const navigate = useNavigate();
  const stores = useAuthStore((s) => s.stores);
  const activeStoreId = useAuthStore((s) => s.activeStoreId);
  const switchStore = useAuthStore((s) => s.switchStore);
  const exists = stores.some((s) => s.id === storeId);

  useEffect(() => {
    if (!exists) { navigate({ to: "/stores" }); return; }
    if (activeStoreId !== storeId) switchStore(storeId);
  }, [exists, activeStoreId, storeId, switchStore, navigate]);

  if (!exists) return null;
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
