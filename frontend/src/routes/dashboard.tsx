import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuthStore } from "@/lib/auth-store";
import { getCurrentUser } from "@/api/auth";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;

    const { user } = useAuthStore.getState();
    if (!user) {
      throw redirect({ to: "/" });
    }

    try {
      await getCurrentUser();
    } catch {
      useAuthStore.getState().signOut?.();
      throw redirect({ to: "/" });
    }
  },

  component: () => (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  ),
});
