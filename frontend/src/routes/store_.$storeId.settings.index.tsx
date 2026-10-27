import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/store_/$storeId/settings/")({
  component: SettingsRedirect,
});

function SettingsRedirect() {
  const { storeId } = useParams({ from: "/store_/$storeId/settings/" });
  return <Navigate to="/store/$storeId/settings/$" params={{ storeId, _splat: "store-details" }} replace />;
}
