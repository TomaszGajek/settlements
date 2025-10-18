import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchTransactions } from "@/lib/services/transactions.client";

/**
 * React Query infinite query hook to fetch paginated transactions for a specific month and year.
 *
 * Supports infinite scroll by automatically fetching next pages.
 * Automatically refetches when month or year changes.
 * Data is considered stale after 30 seconds.
 *
 * @param month - Month to retrieve data for (1-12)
 * @param year - Year to retrieve data for (e.g., 2025)
 * @returns React Query infinite result with transactions, pagination, and loading state
 */
export function useTransactions(month: number, year: number) {
  return useInfiniteQuery({
    queryKey: ["transactions", month, year],
    queryFn: ({ pageParam = 1 }) => fetchTransactions(month, year, pageParam),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 0, // Always refetch when period changes
    refetchOnWindowFocus: false,
  });
}
