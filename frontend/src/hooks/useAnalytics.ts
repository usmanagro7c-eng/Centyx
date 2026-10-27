import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/api/analytics";

export function useAnalytics(range: { from: string; to: string; previousFrom: string; previousTo: string }) {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => getAnalytics(range),
    staleTime: 30_000,
  });
}