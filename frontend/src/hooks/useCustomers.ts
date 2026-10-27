import { useQuery } from "@tanstack/react-query";
import { getCustomers, type CustomerType } from "@/api/customers";

export function useCustomers(type?: CustomerType) {
  return useQuery({
    queryKey: ["customers", type],
    queryFn: () => getCustomers({ type }),
    staleTime: 30_000,
  });
}