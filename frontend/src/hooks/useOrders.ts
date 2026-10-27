import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/api/orders";
import { adaptFrappeOrders } from "@/lib/order-adapter";

export function useOrders(status?: string) {
  return useQuery({
    queryKey: ["orders", status],
    queryFn: async () => {
      const rawOrders = await getOrders(status);
      return adaptFrappeOrders(rawOrders);
    },
  });
}
